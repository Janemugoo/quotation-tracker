import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

// Single shared SQLite connection, stored on the global object so hot
// reloads in dev don't open a new file handle every request.
declare global {
  // eslint-disable-next-line no-var
  var __db: DatabaseSync | undefined;
}

const DB_PATH = path.join(process.cwd(), "data", "app.db");

function init(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  // If two writes ever collide, wait up to 5s for the other to finish
  // instead of failing straight away with "database is locked".
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      date_of_inquiry TEXT NOT NULL,
      group_name TEXT NOT NULL,
      event_dates TEXT,
      number_of_pax TEXT,
      package TEXT,
      rate TEXT,
      travel_agent_name TEXT,
      contact_person TEXT,
      phone_number TEXT,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'INQUIRY',
      business_value REAL,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id TEXT PRIMARY KEY,
      quotation_id TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id),
      note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tenders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      organisation TEXT NOT NULL,
      reference_number TEXT,
      submission_deadline TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      status TEXT NOT NULL DEFAULT 'FOUND',
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tender_notes (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id),
      note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
    CREATE INDEX IF NOT EXISTS idx_followups_quotation ON follow_ups(quotation_id);
    CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
    CREATE INDEX IF NOT EXISTS idx_tender_notes_tender ON tender_notes(tender_id);
  `);

  // Migration: add the "provisions" column (what's included in the package,
  // e.g. "Dinner, bed & breakfast and lunch for 28 students sharing 15
  // rooms") for databases created before the quotation-letter feature.
  // SQLite has no "ADD COLUMN IF NOT EXISTS", so check first.
  const columns = db.prepare("PRAGMA table_info(quotations)").all() as {
    name: string;
  }[];
  if (!columns.some((c) => c.name === "provisions")) {
    db.exec("ALTER TABLE quotations ADD COLUMN provisions TEXT;");
  }

  // Migration: add "line_items" — a JSON array of {provisions, rate, pax,
  // nights} for quotations with more than one rate line (different room
  // types / nights). Stored as TEXT (JSON), NULL for ordinary quotations.
  if (!columns.some((c) => c.name === "line_items")) {
    db.exec("ALTER TABLE quotations ADD COLUMN line_items TEXT;");
  }

  // Migration: add "event_date_from"/"event_date_to" (plain YYYY-MM-DD, from
  // the calendar pickers) alongside the older free-text "event_dates" —
  // event_dates is still what the letter and dashboard display, but it's now
  // formatted from these two date fields instead of typed in directly, so
  // editing a quotation can re-open the pickers on the right dates.
  if (!columns.some((c) => c.name === "event_date_from")) {
    db.exec("ALTER TABLE quotations ADD COLUMN event_date_from TEXT;");
  }
  if (!columns.some((c) => c.name === "event_date_to")) {
    db.exec("ALTER TABLE quotations ADD COLUMN event_date_to TEXT;");
  }

  // Migration: add "is_admin" to users — admins see the "Manage users" page
  // (add/remove staff logins, reset passwords) instead of needing someone to
  // run scripts/add-user.mjs on the server by hand. Existing installs start
  // with everyone at 0; see the README for how to promote the first admin.
  const userColumns = db.prepare("PRAGMA table_info(users)").all() as {
    name: string;
  }[];
  if (!userColumns.some((c) => c.name === "is_admin")) {
    db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;");
  }

  seedFirstAdmin(db);

  return db;
}

// Creates the very first admin login from environment variables, but only
// when the users table is completely empty. This is what lets a brand-new
// (or freshly wiped) deployment be signed into straight away, without anyone
// having to open a shell on the server. It never touches an existing login:
// once any user exists, these variables are ignored, so a password changed
// later from "Manage users" is never overwritten on a redeploy.
function seedFirstAdmin(db: DatabaseSync) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const { n } = db.prepare("SELECT COUNT(*) AS n FROM users").get() as {
    n: number;
  };
  if (n > 0) return;

  if (password.length < 8) {
    console.warn(
      "ADMIN_PASSWORD is shorter than 8 characters, so the first admin login was not created."
    );
    return;
  }

  const name = process.env.ADMIN_NAME?.trim() || "Admin";
  db.prepare(
    "INSERT INTO users (id, name, email, password, is_admin) VALUES (?, ?, ?, ?, 1)"
  ).run(randomUUID(), name, email, bcrypt.hashSync(password, 10));
  console.log(`Created the first admin login (${email}) from ADMIN_* variables.`);
}

// Opened lazily, on the first actual query — not as a side effect of
// importing this module. Next.js's build-time "collect page data" step
// imports every route's module graph (including this file) across several
// parallel worker processes without ever calling into application code, so
// if the database were opened/migrated at module load time, multiple build
// workers could race to open and ALTER the same SQLite file at once and
// fail with "database is locked". Deferring the real work to getDb() means
// it only ever runs when a request is actually being handled.
let dbInstance: DatabaseSync | undefined;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = globalThis.__db ?? init();
    if (process.env.NODE_ENV !== "production") {
      globalThis.__db = dbInstance;
    }
  }
  return dbInstance;
}
