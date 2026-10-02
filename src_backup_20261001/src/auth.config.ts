import type { NextAuthConfig } from "next-auth";

// Edge-safe config used by middleware. No database access here — the
// Credentials provider (which touches SQLite) is added only in auth.ts,
// which runs in the Node runtime (API routes, server components).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname.startsWith("/login");
      if (isLoginPage) return true;
      return isLoggedIn;
    },
  },
};
