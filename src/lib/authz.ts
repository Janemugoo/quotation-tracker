import type { Session } from "next-auth";
import { getUserById, noAdminsYet } from "./queries";

// A session carries isAdmin from when it was issued (see auth.ts), plus the
// bootstrap case: until someone has been promoted, everyone counts as an
// admin so a fresh install (or one upgraded from before this existed) isn't
// locked out of /users.
export function isSessionAdmin(session: Session | null): boolean {
  return !!(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin || noAdminsYet();
}

// Stricter check for downloads that contain every login's password hash
// (the database backup) or all of the hotel's data: the person must be an
// admin *right now* according to the database — not merely hold an old
// session that still says admin, and not via the "no admin exists yet"
// shortcut above.
export function isLiveAdmin(session: Session | null): boolean {
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return false;
  return !!getUserById(id)?.is_admin;
}
