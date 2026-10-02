import type { Session } from "next-auth";
import { noAdminsYet } from "./queries";

// A session carries isAdmin from when it was issued (see auth.ts), plus the
// bootstrap case: until someone has been promoted, everyone counts as an
// admin so a fresh install (or one upgraded from before this existed) isn't
// locked out of /users.
export function isSessionAdmin(session: Session | null): boolean {
  return !!(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin || noAdminsYet();
}
