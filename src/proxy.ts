import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  // Exclude static files generally (anything under /public with a file
  // extension, e.g. /brand/panorama-logo.png) in addition to the Next.js
  // internals — otherwise the login page's own logo (and the image
  // optimizer's server-side fetch of it) gets redirected to /login, since
  // an unauthenticated request to it would otherwise require auth first.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
