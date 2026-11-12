import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/auth";

export function TopNav({
  userName,
  isAdmin = false,
  active,
}: {
  userName: string;
  isAdmin?: boolean;
  active?: "quotations" | "tenders" | "halls" | "users";
}) {
  const linkClass = (key: "quotations" | "tenders" | "halls" | "users") =>
    `text-sm whitespace-nowrap transition-colors ${
      active === key
        ? "font-medium text-brand-brown"
        : "text-slate-500 hover:text-brand-brown"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b-2 border-brand-brown bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <Link href="/" aria-label="Quotation Tracker home" className="flex items-center gap-2.5">
          <Image
            src="/brand/panorama-mark.png"
            alt=""
            width={400}
            height={304}
            className="h-9 w-auto"
            priority
          />
          <span className="font-semibold text-brand-brown leading-tight whitespace-nowrap hidden sm:inline">
            Quotation Tracker
          </span>
        </Link>
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          <Link href="/" className={linkClass("quotations")}>
            Quotations
          </Link>
          <Link href="/tenders" className={linkClass("tenders")}>
            Tenders
          </Link>
          <Link href="/halls" className={linkClass("halls")}>
            Halls
          </Link>
          {isAdmin && (
            <Link
              href="/users"
              className={`${linkClass("users")} hidden sm:inline`}
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
              className="text-sm whitespace-nowrap text-slate-500 hover:text-brand-brown transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
