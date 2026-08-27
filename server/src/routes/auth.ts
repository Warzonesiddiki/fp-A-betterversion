import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { JWT_SECRET } from '../config/env.js';
import { checkAccountLockout, recordLoginAttempt } from '../middleware/accountLockout.js';

const router = Router();
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  entity_id: string | null;
  tenant_id: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

// SEC-1: refresh tokens are stored only as sha256 hashes at rest. The raw
// token exists solely in the API response; a database read no longer yields
// a usable credential.
function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(user: {
  id: string;
  email: string;
  role: string;
  tenant_id?: string | null;
}): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      ...(user.tenant_id ? { tenantId: user.tenant_id } : {}),
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    }
  );
}

function generateRefreshToken(): string {
  return uuidv4();
}

// ---------------------------------------------------------------------------
// Per-identifier (email) fixed-window brute-force limiter (wave 3, lane R41)
//
// Complements the IP-level authLimiter mounted in index.ts: an attacker
// rotating IPs still burns a per-account budget. Fixed window, in-memory
// (Phase 0 single-process deployment), keyed on the lowercased email.
//
// Ordering contract:
//   - login: the limiter fires BEFORE checkAccountLockout/password
//     verification, so a flooded account reveals neither lockout state nor
//     credential validity.
//   - refresh: the limiter sits AFTER the revoked/expired checks and BEFORE
//     rotation/issuance. Deliberate: replaying a REVOKED token must always
//     reach SEC-2 reuse detection (family revocation) and must never be
//     masked by a 429.
//   - Only a SUCCESSFUL login resets the identifier's budget; failed
//     attempts (and refreshes) merely consume slots.
// ---------------------------------------------------------------------------

const IDENTIFIER_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_IDENTIFIER_RATE_LIMIT = 10;

interface IdentifierBucket {
  count: number;
  windowStart: number;
}

const identifierBuckets = new Map<string, IdentifierBucket>();

/** Test hook: clears every identifier bucket between suites. */
export function resetAuthRateLimiter(): void {
  identifierBuckets.clear();
}

function resolveIdentifierRateLimitMax(): number {
  const raw = Number(process.env.AUTH_RATE_LIMIT_MAX);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return DEFAULT_IDENTIFIER_RATE_LIMIT;
}

function normalizeIdentifier(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

/** Consume one slot for the identifier; false = over this window's limit. */
function consumeIdentifierSlot(identifier: string): boolean {
  const max = resolveIdentifierRateLimitMax();
  const now = Date.now();
  let bucket = identifierBuckets.get(identifier);
  if (!bucket || now - bucket.windowStart >= IDENTIFIER_WINDOW_MS) {
    bucket = { count: 0, windowStart: now };
    identifierBuckets.set(identifier, bucket);
  }
  bucket.count++;
  return bucket.count <= max;
}

function identifierRetryAfterSeconds(identifier: string): number {
  const bucket = identifierBuckets.get(identifier);
  if (!bucket) return Math.ceil(IDENTIFIER_WINDOW_MS / 1000);
  const remainingMs = bucket.windowStart + IDENTIFIER_WINDOW_MS - Date.now();
  return Math.max(1, Math.ceil(remainingMs / 1000));
}

/** Clear the identifier's budget (successful login only). */
function resetIdentifier(identifier: string): void {
  identifierBuckets.delete(identifier);
}

function identifierRateLimited(req: Request, res: Response, identifier: string): boolean {
  if (consumeIdentifierSlot(identifier)) return false;
  res.status(429).json({
    error: 'Too many authentication attempts for this account. Try again later.',
    retryAfterSeconds: identifierRetryAfterSeconds(identifier),
  });
  return true;
}

function sanitizeUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    entityId: row.entity_id,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.validated as z.infer<
      typeof registerSchema
    >;

    // Check for existing user
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const userId = uuidv4();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'Viewer', 1, ?, ?)`
    ).run(userId, email, passwordHash, firstName, lastName, now, now);

    // Generate tokens
    const accessToken = generateAccessToken({ id: userId, email, role: 'Viewer' });
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS).toISOString();

    db.prepare(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), userId, hashRefreshToken(refreshToken), refreshExpiresAt);

    // Fetch the created user
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow;

    res.status(201).json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('[auth] Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.validated as z.infer<typeof loginSchema>;
    const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;

    // Lane R41: per-identifier brute-force gate — runs BEFORE the account
    // lockout check and password verification so a flooded identifier
    // reveals neither its lockout state nor credential validity.
    const identifier = normalizeIdentifier(email);
    if (identifierRateLimited(req, res, identifier)) {
      return;
    }

    // Check if account is locked due to too many failed attempts
    const lockoutStatus = checkAccountLockout(email, ipAddress);
    if (lockoutStatus.locked) {
      res.status(423).json({
        error: `Account is locked due to too many failed login attempts. Try again in ${lockoutStatus.remainingMinutes} minute${lockoutStatus.remainingMinutes !== 1 ? 's' : ''}.`,
        lockedUntil: new Date(Date.now() + lockoutStatus.remainingMinutes * 60000).toISOString(),
      });
      return;
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
      | UserRow
      | undefined;
    if (!user) {
      // Record failed attempt (even for non-existent users to prevent enumeration)
      recordLoginAttempt(email, ipAddress, false);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Record failed attempt
      recordLoginAttempt(email, ipAddress, false);

      // Re-check lockout after recording the failed attempt
      const updatedStatus = checkAccountLockout(email, ipAddress);
      if (updatedStatus.locked) {
        res.status(423).json({
          error: `Account is locked due to too many failed login attempts. Try again in ${updatedStatus.remainingMinutes} minute${updatedStatus.remainingMinutes !== 1 ? 's' : ''}.`,
          lockedUntil: new Date(Date.now() + updatedStatus.remainingMinutes * 60000).toISOString(),
        });
        return;
      }

      res.status(401).json({
        error: 'Invalid email or password',
        attemptsRemaining: updatedStatus.attemptsRemaining,
      });
      return;
    }

    // Record successful login and clear failed attempts
    recordLoginAttempt(email, ipAddress, true);

    // Lane R41: a successful login resets the identifier's brute-force
    // budget — the legitimate owner should never inherit an attacker's
    // consumed slots.
    resetIdentifier(identifier);

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    });
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS).toISOString();

    // Store refresh token
    db.prepare(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), user.id, hashRefreshToken(refreshToken), refreshExpiresAt);

    res.json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('[auth] Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /refresh
// ---------------------------------------------------------------------------

router.post('/refresh', validate(refreshSchema), (req, res) => {
  try {
    const { refreshToken } = req.validated as z.infer<typeof refreshSchema>;

    // SEC-1: lookup is by hash — the presented raw token never matches the DB.
    const row = db
      .prepare('SELECT * FROM refresh_tokens WHERE token = ?')
      .get(hashRefreshToken(refreshToken)) as RefreshTokenRow | undefined;

    if (!row) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // SEC-2: reuse detection. A revoked token being replayed means either a
    // stolen token racing the rotation or a client retrying an old response;
    // in both cases the safest action is to revoke every token for the user.
    if (row.revoked_at !== null) {
      db.prepare(
        "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE user_id = ? AND revoked_at IS NULL"
      ).run(row.user_id);
      res.status(401).json({ error: 'Refresh token reuse detected; all sessions revoked' });
      return;
    }

    // Check expiry
    if (new Date(row.expires_at) < new Date()) {
      // Clean up expired token
      db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(row.id);
      res.status(401).json({ error: 'Refresh token has expired' });
      return;
    }

    // Fetch user to include role in the new access token
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id) as
      | UserRow
      | undefined;
    if (!user || !user.is_active) {
      res.status(401).json({ error: 'User not found or deactivated' });
      return;
    }

    // Lane R41: per-identifier brute-force gate on refresh. Placed AFTER the
    // revoked/expired checks so SEC-2 reuse detection can never be masked by
    // a 429, and BEFORE rotation/issuance so a flooded identifier cannot mint
    // additional token pairs.
    const refreshIdentifier = normalizeIdentifier(user.email);
    if (identifierRateLimited(req, res, refreshIdentifier)) {
      return;
    }

    // SEC-2: rotate — revoke the presented token and issue a fresh one. The
    // old row is kept (revoked) so a later replay triggers reuse detection.
    const newRefreshToken = generateRefreshToken();
    const rotate = db.transaction((rowId: string) => {
      db.prepare("UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE id = ?").run(rowId);
      db.prepare(
        'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
      ).run(
        uuidv4(),
        user.id,
        hashRefreshToken(newRefreshToken),
        new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS).toISOString()
      );
    });
    rotate(row.id);

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('[auth] Refresh error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /logout
// ---------------------------------------------------------------------------

router.post('/logout', validate(logoutSchema), (req, res) => {
  try {
    const { refreshToken } = req.validated as z.infer<typeof logoutSchema>;

    // SEC-1/SEC-2: revoke by hash and keep the row so a replay of this token
    // later triggers reuse detection instead of looking "invalid".
    const result = db
      .prepare(
        "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE token = ? AND revoked_at IS NULL"
      )
      .run(hashRefreshToken(refreshToken));

    if (result.changes === 0) {
      // Token not found or already revoked — still treat as success (idempotent logout)
      res.json({ message: 'Logged out successfully' });
      return;
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[auth] Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /me
// ---------------------------------------------------------------------------

router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as
      | UserRow
      | undefined;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('[auth] Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
