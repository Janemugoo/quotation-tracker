import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import type {
  FollowUpWithAuthor,
  Quotation,
  QuotationLineItem,
  QuotationStatus,
  QuotationWithMeta,
  User,
} from "./types";

// line_items is stored as a JSON TEXT column; rows straight out of
// better-sqlite/node:sqlite come back with that field as a raw string (or
// null), so every read parses it back into an array before handing the
// quotation to the rest of the app.
function parseLineItems<T extends { line_items: unknown }>(
  row: T
): T & { line_items: QuotationLineItem[] | null } {
  const raw = row.line_items;
  return {
    ...row,
    line_items:
      typeof raw === "string" && raw.trim() ? JSON.parse(raw) : null,
  };
}

// ---------- Users ----------

export function getUserByEmail(email: string): User | undefined {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as unknown as User | undefined;
  return row;
}

export function getUserById(id: string): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | User
    | undefined;
}

export function listUsers(): User[] {
  return getDb().prepare("SELECT * FROM users ORDER BY name").all() as unknown as User[];
}

export function createUser(params: {
  name: string;
  email: string;
  passwordHash: string;
  isAdmin?: boolean;
}): User {
  const id = randomUUID();
  getDb().prepare(
    "INSERT INTO users (id, name, email, password, is_admin) VALUES (?, ?, ?, ?, ?)"
  ).run(
    id,
    params.name,
    params.email.trim().toLowerCase(),
    params.passwordHash,
    params.isAdmin ? 1 : 0
  );
  return getUserById(id)!;
}

export function countAdmins(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM users WHERE is_admin = 1")
    .get() as { n: number };
  return row.n;
}

// True until the first admin exists. Used so a brand-new install (or one
// upgraded from before "Manage users" existed) isn't locked out of its own
// admin page — anyone can reach it until somebody is promoted.
export function noAdminsYet(): boolean {
  return countAdmins() === 0;
}

export function updateUserPassword(id: string, passwordHash: string): void {
  getDb().prepare("UPDATE users SET password = ? WHERE id = ?").run(passwordHash, id);
}

export function setUserAdmin(id: string, isAdmin: boolean): void {
  getDb().prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(isAdmin ? 1 : 0, id);
}

// Throws if the user has created quotations or follow-ups (the DB's foreign
// keys protect that history) — callers should catch and show a friendly
// message rather than losing a staff member's quotation trail.
export function deleteUser(id: string): void {
  getDb().prepare("DELETE FROM users WHERE id = ?").run(id);
}

// ---------- Quotations ----------

export interface QuotationFilters {
  status?: QuotationStatus | "ALL";
  search?: string;
}

export function listQuotations(filters: QuotationFilters = {}): QuotationWithMeta[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filters.status && filters.status !== "ALL") {
    clauses.push("q.status = ?");
    params.push(filters.status);
  }
  if (filters.search && filters.search.trim()) {
    clauses.push(
      "(q.group_name LIKE ? OR q.travel_agent_name LIKE ? OR q.contact_person LIKE ? OR q.email LIKE ?)"
    );
    const like = `%${filters.search.trim()}%`;
    params.push(like, like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const rows = getDb()
    .prepare(
      `SELECT
         q.*,
         u.name AS created_by_name,
         (SELECT COUNT(*) FROM follow_ups f WHERE f.quotation_id = q.id) AS follow_up_count,
         (SELECT MAX(f.created_at) FROM follow_ups f WHERE f.quotation_id = q.id) AS last_follow_up_at
       FROM quotations q
       JOIN users u ON u.id = q.created_by
       ${where}
       ORDER BY q.date_of_inquiry DESC, q.created_at DESC`
    )
    .all(...params) as unknown as QuotationWithMeta[];

  return rows.map(parseLineItems);
}

export function getQuotation(id: string): QuotationWithMeta | undefined {
  const row = getDb()
    .prepare(
      `SELECT
         q.*,
         u.name AS created_by_name,
         (SELECT COUNT(*) FROM follow_ups f WHERE f.quotation_id = q.id) AS follow_up_count,
         (SELECT MAX(f.created_at) FROM follow_ups f WHERE f.quotation_id = q.id) AS last_follow_up_at
       FROM quotations q
       JOIN users u ON u.id = q.created_by
       WHERE q.id = ?`
    )
    .get(id) as unknown as QuotationWithMeta | undefined;
  return row ? parseLineItems(row) : undefined;
}

export interface QuotationInput {
  date_of_inquiry: string;
  group_name: string;
  event_dates: string;
  event_date_from: string;
  event_date_to: string;
  number_of_pax: string;
  package: string;
  rate: string;
  provisions: string;
  travel_agent_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  status: QuotationStatus;
  business_value: number | null;
  line_items: QuotationLineItem[] | null;
}

export function createQuotation(
  input: QuotationInput,
  createdBy: string
): Quotation {
  const id = randomUUID();
  getDb().prepare(
    `INSERT INTO quotations (
       id, date_of_inquiry, group_name, event_dates, event_date_from, event_date_to,
       number_of_pax, package, rate, provisions,
       travel_agent_name, contact_person, phone_number, email, status, business_value,
       line_items, created_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.date_of_inquiry,
    input.group_name,
    input.event_dates,
    input.event_date_from,
    input.event_date_to,
    input.number_of_pax,
    input.package,
    input.rate,
    input.provisions,
    input.travel_agent_name,
    input.contact_person,
    input.phone_number,
    input.email,
    input.status,
    input.business_value,
    input.line_items ? JSON.stringify(input.line_items) : null,
    createdBy
  );
  const row = getDb().prepare("SELECT * FROM quotations WHERE id = ?").get(id) as unknown as Quotation;
  return parseLineItems(row);
}

export function updateQuotation(id: string, input: QuotationInput): Quotation {
  getDb().prepare(
    `UPDATE quotations SET
       date_of_inquiry = ?, group_name = ?, event_dates = ?, event_date_from = ?, event_date_to = ?,
       number_of_pax = ?,
       package = ?, rate = ?, provisions = ?, travel_agent_name = ?, contact_person = ?,
       phone_number = ?, email = ?, status = ?, business_value = ?, line_items = ?,
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    input.date_of_inquiry,
    input.group_name,
    input.event_dates,
    input.event_date_from,
    input.event_date_to,
    input.number_of_pax,
    input.package,
    input.rate,
    input.provisions,
    input.travel_agent_name,
    input.contact_person,
    input.phone_number,
    input.email,
    input.status,
    input.business_value,
    input.line_items ? JSON.stringify(input.line_items) : null,
    id
  );
  const row = getDb().prepare("SELECT * FROM quotations WHERE id = ?").get(id) as unknown as Quotation;
  return parseLineItems(row);
}

export function deleteQuotation(id: string): void {
  getDb().prepare("DELETE FROM quotations WHERE id = ?").run(id);
}

// ---------- Follow-ups ----------

export function listFollowUps(quotationId: string): FollowUpWithAuthor[] {
  return getDb()
    .prepare(
      `SELECT f.*, u.name AS author_name
       FROM follow_ups f
       JOIN users u ON u.id = f.author_id
       WHERE f.quotation_id = ?
       ORDER BY f.created_at DESC`
    )
    .all(quotationId) as unknown as FollowUpWithAuthor[];
}

export function addFollowUp(params: {
  quotationId: string;
  authorId: string;
  note: string;
}): FollowUpWithAuthor {
  const id = randomUUID();
  getDb().prepare(
    "INSERT INTO follow_ups (id, quotation_id, author_id, note) VALUES (?, ?, ?, ?)"
  ).run(id, params.quotationId, params.authorId, params.note);

  // Bump the quotation's updated_at and mark it followed-up if it was still
  // a fresh inquiry, so the dashboard reflects that someone acted on it.
  getDb().prepare(
    `UPDATE quotations
     SET updated_at = datetime('now'),
         status = CASE WHEN status = 'INQUIRY' THEN 'FOLLOWED_UP' ELSE status END
     WHERE id = ?`
  ).run(params.quotationId);

  return getDb()
    .prepare(
      `SELECT f.*, u.name AS author_name FROM follow_ups f JOIN users u ON u.id = f.author_id WHERE f.id = ?`
    )
    .get(id) as unknown as FollowUpWithAuthor;
}

// ---------- Dashboard summary ----------

export function statusCounts(): Record<QuotationStatus, number> {
  const rows = getDb()
    .prepare("SELECT status, COUNT(*) AS n FROM quotations GROUP BY status")
    .all() as { status: QuotationStatus; n: number }[];
  const result: Record<QuotationStatus, number> = {
    INQUIRY: 0,
    FOLLOWED_UP: 0,
    TBC: 0,
    CONFIRMED: 0,
    DECLINED: 0,
    LOST: 0,
  };
  for (const row of rows) result[row.status] = row.n;
  return result;
}
