import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/auth";

export function TopNav({
  userName,
  isAdmin = false,
}: {
  userName: string;
  isAdmin?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-brand-brown bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/brand/panorama-mark.png"
            alt=""
            width={400}
            height={304}
            className="h-9 w-auto"
            priority
          />
          <span className="font-semibold text-brand-brown leading-tight">
            Quotation Tracker
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link
              href="/users"
              className="text-sm text-slate-500 hover:text-brand-brown transition-colors hidden sm:inline"
            >
              Manage users
            </Link>
          )}
          <span className="text-sm text-slate-500 hidden sm:inline">
            {userName}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-slate-500 hover:text-brand-brown transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
