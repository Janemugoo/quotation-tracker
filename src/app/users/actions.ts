"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import {
  countAdmins,
  createUser,
  deleteUser,
  getUserByEmail,
  getUserById,
  setUserAdmin,
  updateUserPassword,
} from "@/lib/queries";
import { isSessionAdmin } from "@/lib/authz";

// Shared guard: only an admin (or, before anyone has been made an admin yet,
// any logged-in user — see isSessionAdmin()) may reach these actions.
// Checked here too, not just by the page, since actions are callable on
// their own.
async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isSessionAdmin(session)) redirect("/");
  return session;
}

function fail(message: string): never {
  redirect(`/users?error=${encodeURIComponent(message)}`);
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";
  const isAdmin = formData.get("is_admin") === "on";

  if (!name || !email || !password) {
    fail("Name, email and password are all required.");
  }
  if (password.length < 8) {
    fail("Password must be at least 8 characters.");
  }
  if (getUserByEmail(email)) {
    fail(`${email} already has a login — use "Reset password" instead.`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  createUser({ name, email, passwordHash, isAdmin });

  revalidatePath("/users");
  redirect("/users");
}

export async function resetPasswordAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const password = (formData.get("password") as string) ?? "";
  if (password.length < 8) {
    fail("Password must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  updateUserPassword(id, passwordHash);

  revalidatePath("/users");
  redirect("/users");
}

export async function toggleAdminAction(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;
  const makeAdmin = formData.get("make_admin") === "true";

  if (!makeAdmin && (session.user as { id: string }).id === id && countAdmins() <= 1) {
    fail("You're the only admin — promote someone else before removing yourself.");
  }

  setUserAdmin(id, makeAdmin);
  revalidatePath("/users");
  redirect("/users");
}

export async function deleteUserAction(id: string) {
  const session = await requireAdmin();

  if ((session.user as { id: string }).id === id) {
    fail("You can't remove your own login while you're signed in with it.");
  }

  const target = getUserById(id);
  if (target?.is_admin && countAdmins() <= 1) {
    fail("Can't remove the only admin.");
  }

  try {
    deleteUser(id);
  } catch {
    // Foreign-key protected: this person has created quotations or
    // follow-ups, and removing them would orphan that history.
    fail(
      `Can't remove ${target?.name ?? "this user"} — they have quotations or follow-ups on record. Reset their password instead to stop them signing in.`
    );
  }

  revalidatePath("/users");
  redirect("/users");
}
