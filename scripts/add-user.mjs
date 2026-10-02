// Usage: node scripts/add-user.mjs "Full Name" "email@example.com" "password" [admin]
// Creates (or updates) a login for the quotation tracker. Run this once per
// staff member, or to set/reset someone's password from the server. Add the
// word "admin" as a 4th argument to also give them the "Manage users" page
// (adding/removing logins) — most people won't need this, there just needs
// to be at least one.
//
// This is now also the way to promote the *first* admin on an install that
// already has accounts from before "Manage users" existed: run this again
// for your own account with "admin" on the end. After that, admins can be
// managed from the app itself at /users.

import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import bcrypt from "bcryptjs";

const [, , name, email, password, role] = process.argv;
const isAdmin = role === "admin" ? 1 : 0;

if (!name || !email || !password) {
  console.error(
    'Usage: node scripts/add-user.mjs "Full Name" "email@example.com" "password" [admin]'
  );
  process.exit(1);
}

const DB_PATH = path.join(process.cwd(), "data", "app.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
// In case this runs against a database created before is_admin existed.
const columns = db.prepare("PRAGMA table_info(users)").all();
if (!columns.some((c) => c.name === "is_admin")) {
  db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;");
}

const existing = db
  .prepare("SELECT id FROM users WHERE email = ?")
  .get(email.trim().toLowerCase());

const hash = bcrypt.hashSync(password, 10);

if (existing) {
  db.prepare(
    "UPDATE users SET name = ?, password = ?, is_admin = ? WHERE email = ?"
  ).run(name, hash, isAdmin, email.trim().toLowerCase());
  console.log(
    `Updated existing user: ${email}${isAdmin ? " (now an admin)" : ""}`
  );
} else {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id, name, email, password, is_admin) VALUES (?, ?, ?, ?, ?)"
  ).run(id, name, email.trim().toLowerCase(), hash, isAdmin);
  console.log(
    `Created user: ${name} <${email}>${isAdmin ? " (admin)" : ""}`
  );
}

db.close();
