/// <reference types="bun-types" />
import { Database } from "bun:sqlite";
import path from "node:path";

const migrations = [
  `CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER DEFAULT 0,
    name TEXT,
    image TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );`,

  `CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expiresAt TEXT NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    accessTokenExpiresAt TEXT,
    refreshTokenExpiresAt TEXT,
    scope TEXT,
    idToken TEXT,
    password TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );`,

  `CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);`,
  `CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);`,
  `CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);`,
  `CREATE INDEX IF NOT EXISTS idx_account_providerId ON account(providerId);`,
  `CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);`,
];

/**
 * Run better-auth SQLite migrations (idempotent — safe on every startup).
 * Creates user, session, account, and verification tables if they don't exist.
 */
export async function migrateAuthDB(): Promise<void> {
  const dbPath =
    process.env.AUTH_DB_PATH ||
    path.resolve(__dirname, "../../data/auth.db");

  console.log(`[Auth Migration] Opening database at: ${dbPath}`);

  const db = new Database(dbPath);
  db.run("PRAGMA foreign_keys = ON;");

  for (const sql of migrations) {
    try {
      db.run(sql);
    } catch (err) {
      console.error(
        "[Auth Migration] Failed:",
        (err as Error).message,
        "\nSQL:",
        sql.slice(0, 100)
      );
    }
  }

  db.close();
  console.log("[Auth Migration] Tables ready");
}
