// Session Engine - Session management with timeout and device tracking
// Pure TypeScript, no external dependencies

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  device: DeviceInfo;
  isActive: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  ip?: string;
  deviceName?: string;
}

export interface SessionConfig {
  timeoutMinutes: number;
  maxConcurrentSessions: number;
  extendOnActivity: boolean;
}

const DEFAULT_CONFIG: SessionConfig = {
  timeoutMinutes: 30,
  maxConcurrentSessions: 5,
  extendOnActivity: true,
};

export class SessionEngine {
  private sessions: Map<string, Session> = new Map();
  private config: SessionConfig;

  constructor(config?: Partial<SessionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  createSession(userId: string, device: DeviceInfo): Session {
    this.enforceSessionLimit(userId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.timeoutMinutes * 60000);
    const session: Session = {
      id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      createdAt: now.toISOString(),
      lastActivity: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      device,
      isActive: true,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    if (this.isExpired(session)) {
      this.invalidateSession(sessionId);
      return undefined;
    }
    return session;
  }

  refreshSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return null;
    if (this.isExpired(session)) {
      this.invalidateSession(sessionId);
      return null;
    }
    const now = new Date();
    session.lastActivity = now.toISOString();
    if (this.config.extendOnActivity) {
      session.expiresAt = new Date(
        now.getTime() + this.config.timeoutMinutes * 60000
      ).toISOString();
    }
    return session;
  }

  invalidateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.isActive = false;
    return true;
  }

  invalidateAllForUser(userId: string): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.isActive) {
        session.isActive = false;
        count++;
      }
    }
    return count;
  }

  getActiveSessions(userId: string): Session[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && s.isActive && !this.isExpired(s)
    );
  }

  getAllActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter((s) => s.isActive && !this.isExpired(s));
  }

  validateSession(sessionId: string): { valid: boolean; reason?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) return { valid: false, reason: 'Session not found' };
    if (!session.isActive) return { valid: false, reason: 'Session invalidated' };
    if (this.isExpired(session)) {
      this.invalidateSession(sessionId);
      return { valid: false, reason: 'Session expired' };
    }
    return { valid: true };
  }

  purgeExpired(): number {
    const before = this.sessions.size;
    for (const [id, session] of this.sessions) {
      if (this.isExpired(session) || !session.isActive) {
        this.sessions.delete(id);
      }
    }
    return before - this.sessions.size;
  }

  getSessionCount(): { total: number; active: number; expired: number } {
    let active = 0;
    let expired = 0;
    for (const session of this.sessions.values()) {
      if (!session.isActive) continue;
      if (this.isExpired(session)) expired++;
      else active++;
    }
    return { total: this.sessions.size, active, expired };
  }

  serialize(): string {
    return JSON.stringify(Array.from(this.sessions.entries()));
  }

  deserialize(json: string): void {
    this.sessions = new Map(JSON.parse(json));
  }

  private isExpired(session: Session): boolean {
    return new Date(session.expiresAt) < new Date();
  }

  private enforceSessionLimit(userId: string): void {
    const activeSessions = this.getActiveSessions(userId);
    if (activeSessions.length >= this.config.maxConcurrentSessions) {
      const oldest = activeSessions.sort((a, b) => a.lastActivity.localeCompare(b.lastActivity))[0];
      this.invalidateSession(oldest.id);
    }
  }
}
