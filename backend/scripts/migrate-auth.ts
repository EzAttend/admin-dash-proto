/// <reference types="bun-types" />
import { Database } from "bun:sqlite";
import { resolve } from "node:path";

// Use same path as auth.ts
const dbPath = Bun.env.AUTH_DB_PATH || resolve(import.meta.dir, "../data/auth.db");

console.log(`[Migration] Opening database at: ${dbPath}`);

const db = new Database(dbPath);

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON;");

// better-auth required tables
const migrations = [
  // User table
  `CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER DEFAULT 0,
    name TEXT,
    image TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );`,

  // Session table
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

  // Account table (for OAuth providers and email/password)
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

  // Verification table (for email verification, password reset, etc.)
  `CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );`,

  // Indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);`,
  `CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);`,
  `CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);`,
  `CREATE INDEX IF NOT EXISTS idx_account_providerId ON account(providerId);`,
  `CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);`,
];

console.log("[Migration] Running migrations...");

for (const sql of migrations) {
  try {
    db.run(sql);
    const tableName = sql.match(/(?:TABLE|INDEX).*?(\w+)/i)?.[1] || "unknown";
    console.log(`[Migration] ✓ ${tableName}`);
  } catch (err) {
    console.error("[Migration] ✗ Failed:", (err as Error).message);
    console.error("SQL:", sql.slice(0, 100) + "...");
  }
}

console.log("[Migration] Done!");
db.close();
