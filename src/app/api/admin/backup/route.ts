import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isLiveAdmin } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { todayStamp } from "@/lib/csv";

// Admin-only: a complete, consistent copy of the database (quotations,
// tenders, follow-ups and every login). Restoring it is just putting the
// file back at data/app.db. VACUUM INTO writes a clean snapshot even while
// other people are using the app, which copying the live file would not.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isLiveAdmin(session)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qt-backup-"));
  const file = path.join(dir, "app.db");
  try {
    getDb().exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
    const bytes = fs.readFileSync(file);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="quotation-tracker-backup-${todayStamp()}.db"`,
        "Cache-Control": "no-store",
      },
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
