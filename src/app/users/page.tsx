import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listUsers, noAdminsYet } from "@/lib/queries";
import { isSessionAdmin } from "@/lib/authz";
import { TopNav } from "@/components/TopNav";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";
import {
  createUserAction,
  deleteUserAction,
  resetPasswordAction,
  toggleAdminAction,
} from "./actions";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const inputClass =
  "w-full rounded-lg border border-brand-brown/25 bg-brand-brown-light/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown focus:bg-white transition-colors";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const bootstrapping = noAdminsYet();
  const isAdmin = isSessionAdmin(session);
  if (!isAdmin) redirect("/");

  const { error } = await searchParams;
  const users = listUsers();
  const currentUserId = (session.user as { id: string }).id;

  return (
    <div className="min-h-screen">
      <TopNav
        userName={session.user.name ?? ""}
        isAdmin={isAdmin}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-brand-brown">Manage users</h1>
          <p className="text-sm text-slate-500">
            Add a staff login, reset a password, or remove access.
          </p>
        </div>

        {bootstrapping && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm px-4 py-3">
            No one has been made an admin yet, so everyone can see this page
            for now. Tick <span className="font-medium">Make admin</span>{" "}
            below for yourself (or whoever should manage logins) to lock this
            page down to just them.
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-medium text-slate-700 mb-4">Add a login</h2>
          <form action={createUserAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Full name
              </label>
              <input type="text" name="name" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Email
              </label>
              <input type="email" name="email" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                className={inputClass}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="is_admin"
                  className="rounded border-brand-brown/40 text-brand-brown focus:ring-brand-brown"
                />
                Make admin (can manage other users)
              </label>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="bg-brand-brown text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-brand-brown-dark transition-colors"
              >
                Add login
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.name}
                    {u.id === currentUserId && (
                      <span className="ml-2 text-xs text-slate-400">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <form action={toggleAdminAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <input
                        type="hidden"
                        name="make_admin"
                        value={(!u.is_admin).toString()}
                      />
                      <button
                        type="submit"
                        className={
                          u.is_admin
                            ? "text-xs font-medium bg-brand-green-light text-brand-green-dark rounded-full px-2.5 py-1 hover:opacity-80"
                            : "text-xs font-medium bg-slate-100 text-slate-500 rounded-full px-2.5 py-1 hover:bg-slate-200"
                        }
                        title={u.is_admin ? "Click to remove admin" : "Click to make admin"}
                      >
                        {u.is_admin ? "Admin" : "Staff"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={resetPasswordAction} className="flex items-center gap-1.5">
                        <input type="hidden" name="id" value={u.id} />
                        <input
                          type="password"
                          name="password"
                          placeholder="New password"
                          minLength={8}
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-brown"
                        />
                        <button
                          type="submit"
                          className="text-xs font-medium text-slate-600 border border-slate-300 rounded-lg px-2 py-1.5 hover:border-brand-brown/40 whitespace-nowrap"
                        >
                          Reset
                        </button>
                      </form>
                      {u.id !== currentUserId && (
                        <DeleteUserDialog
                          deleteAction={deleteUserAction.bind(null, u.id)}
                          userName={u.name}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </div>
  );
}
