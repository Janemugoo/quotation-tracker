// Minimal CSV writer for the admin exports. Opens cleanly in Excel: a UTF-8
// byte-order mark so accents/symbols survive, CRLF line endings, and every
// field quoted when it contains a comma, quote or line break.

type Cell = string | number | null | undefined;

// A text cell that starts with =, +, - or @ would be run as a formula when
// someone opens the file in Excel (a known "CSV injection" trick, and these
// fields are typed in by users). Prefix those with an apostrophe — but leave
// ordinary phone numbers such as "+254 712 345 678" alone.
function neutraliseFormula(text: string): string {
  if (/^[=@\t\r]/.test(text)) return `'${text}`;
  if (/^[+-]/.test(text) && !/^[+-]?[\d\s().-]+$/.test(text)) return `'${text}`;
  return text;
}

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  const text =
    typeof value === "number" ? String(value) : neutraliseFormula(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: Cell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
