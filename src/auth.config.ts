import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

// How long a login lasts before the person has to sign in again: 12 hours by
// default (roughly one working day) instead of NextAuth's 30-day default,
// since these accounts are used on shared hotel computers. Set SESSION_HOURS
// on the host to change it without touching the code.
const SESSION_HOURS = Number(process.env.SESSION_HOURS);
export const SESSION_MAX_AGE_SECONDS = Math.round(
  (Number.isFinite(SESSION_HOURS) && SESSION_HOURS > 0 ? SESSION_HOURS : 12) * 3600
);

// NextAuth quietly renews a login's cookie every time the person uses the
// app, so on its own the timeout above would only mean "12 hours of doing
// nothing". This stamps the moment of sign-in on the login and refuses it
// once SESSION_HOURS have passed since then, however active the person has
// been — returning null ends the session. Logins that were already open when
// this was introduced have no stamp yet, so they start their 12 hours the
// first time they are seen. Used by both the login itself (auth.ts) and the
// route protection (proxy.ts), so the two always agree.
export function applySessionLimit(token: JWT, isNewLogin: boolean): JWT | null {
  const now = Math.floor(Date.now() / 1000);
  const signedInAt = token.signedInAt;
  if (isNewLogin || typeof signedInAt !== "number") {
    token.signedInAt = now;
  } else if (now - signedInAt > SESSION_MAX_AGE_SECONDS) {
    return null;
  }
  return token;
}

// Edge-safe config used by middleware. No database access here — the
// Credentials provider (which touches SQLite) is added only in auth.ts,
// which runs in the Node runtime (API routes, server components).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    jwt({ token, user }) {
      return applySessionLimit(token, !!user);
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname.startsWith("/login");
      if (isLoginPage) return true;
      return isLoggedIn;
    },
  },
};
