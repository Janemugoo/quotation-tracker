import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

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

    CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
    CREATE INDEX IF NOT EXISTS idx_followups_quotation ON follow_ups(quotation_id);
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

  return db;
}

export const db = globalThis.__db ?? init();
if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}
