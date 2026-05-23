import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { JWT_SECRET } from '../config/env.js';
import {
  checkAccountLockout,
  recordLoginAttempt,
} from '../middleware/accountLockout.js';

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
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

function generateAccessToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

function generateRefreshToken(): string {
  return uuidv4();
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
    const { email, password, firstName, lastName } = req.validated as z.infer<typeof registerSchema>;

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
    ).run(uuidv4(), userId, refreshToken, refreshExpiresAt);

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

    // Check if account is locked due to too many failed attempts
    const lockoutStatus = checkAccountLockout(email);
    if (lockoutStatus.locked) {
      res.status(423).json({
        error: `Account is locked due to too many failed login attempts. Try again in ${lockoutStatus.remainingMinutes} minute${lockoutStatus.remainingMinutes !== 1 ? 's' : ''}.`,
        lockedUntil: new Date(Date.now() + lockoutStatus.remainingMinutes * 60000).toISOString(),
      });
      return;
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
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
      const updatedStatus = checkAccountLockout(email);
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

    // Generate tokens
    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS).toISOString();

    // Store refresh token
    db.prepare(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), user.id, refreshToken, refreshExpiresAt);

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

    // Look up refresh token in DB
    const row = db.prepare(
      'SELECT * FROM refresh_tokens WHERE token = ?'
    ).get(refreshToken) as RefreshTokenRow | undefined;

    if (!row) {
      res.status(401).json({ error: 'Invalid refresh token' });
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
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id) as UserRow | undefined;
    if (!user || !user.is_active) {
      res.status(401).json({ error: 'User not found or deactivated' });
      return;
    }

    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });

    res.json({ accessToken });
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

    const result = db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);

    if (result.changes === 0) {
      // Token not found — still treat as success (idempotent logout)
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
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as UserRow | undefined;

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
