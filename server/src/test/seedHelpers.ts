import type { Database } from 'better-sqlite3';

/**
 * Seeds actor rows required by real-SQLite FK enforcement.
 *
 * The request-audit middleware writes `audit_log.user_id` (FK to users) and
 * route helpers write `user_entity_access` (FKs to users and entities). Tests
 * mint JWTs with synthetic ids, so every actor used in a test must exist as a
 * users row — the legacy in-memory mock DB ignored foreign keys, which is why
 * these seeds were not needed before the real-SQLite migration.
 */
export function seedUser(
  db: Database,
  id: string,
  email: string,
  role: string
): void {
  db.prepare(
    `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  ).run(id, email, 'not-a-real-hash', 'Seed', 'User', role);
}

export function seedEntity(db: Database, id: string, name: string, code: string): void {
  db.prepare(
    `INSERT OR REPLACE INTO entities (id, name, code, is_active)
     VALUES (?, ?, ?, 1)`
  ).run(id, name, code);
}

/** Grants the actor entity access (used by entity-scoped route tests). */
export function grantEntityAccess(
  db: Database,
  userId: string,
  entityId: string,
  role: string
): void {
  db.prepare(
    `INSERT OR REPLACE INTO user_entity_access (user_id, entity_id, role)
     VALUES (?, ?, ?)`
  ).run(userId, entityId, role);
}
