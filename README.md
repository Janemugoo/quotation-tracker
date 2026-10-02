# Quotation Tracker

An internal web app for Panorama Park Hotel to log requested quotations and
track their follow-up status: Inquiry → Followed up → TBC → Confirmed /
Declined / Lost.

## What it does

- Login-protected (email + password), built for up to 5 staff accounts
- Dashboard listing every quotation, filterable by status, searchable by
  group / agent / contact / email
- Add / edit a quotation with the same fields as the tracking sheet (group
  name, event dates — picked from a calendar, From and To — pax, package,
  rate, business value, travel agent and contact details, status)
- A follow-up log per quotation — add a note each time someone calls or
  hears back, so the history of who followed up and when is kept
- One click on any quotation generates a branded quotation letter (PDF) —
  Panorama Park Hotel letterhead with the new logo, filled in from that
  quotation's data, ready to send to the client
- A **"Save & print quotation"** button on both the "New quotation" and
  quotation detail forms — fill out the fields and it saves the quotation to
  the tracker *and* takes you straight to the printable PDF letter in one
  step, instead of saving first and clicking a separate button afterwards
- The header bar, and the page title/actions above the form, stay fixed at
  the top of the screen — only the form itself (or, on a saved quotation's
  page, the form plus its follow-up log) scrolls, in its own panel
- The app is branded in Panorama Park Hotel's own colors (brown/green,
  sampled from the logo) and shows the hotel's logo in the nav bar and on
  the login page, matching the letter
- Deleting a quotation asks for confirmation in a popup first — it's not a
  single click away
- An admin-only **"Manage users"** page (linked at the top right, for admins
  only) to add a staff login, reset someone's password, promote/demote an
  admin, or remove a login — no server access needed for day-to-day account
  changes
- Data is stored in a local SQLite file (`data/app.db`) — no external
  database to set up

## Generating a quotation letter

Two ways to get the PDF:

1. **While filling out the form** — on "New quotation" (or when editing an
   existing one), click **"Save & print quotation"** instead of the regular
   save button. It saves the quotation and opens the letter straight away,
   ready to print (Ctrl/Cmd+P) or save as a PDF from the browser's print
   dialog.
2. **From an already-saved quotation** — open it and click **"Generate
   quotation letter (PDF)"** to regenerate the letter at any time (e.g.
   after the group or rate changes).

Either way it produces a letter in the hotel's format — letterhead,
package/rate table, standard inclusions, payment details and grand total,
terms & cancellation policy, and a signature block with the name of
whoever is logged in — filled from that quotation's fields.

Pricing is entered as a **Rate Breakdown**: one rate line for an ordinary
quotation, or add more for a quotation with several rates — different room
types, or the same room at a different nightly rate for part of the stay
(e.g. 1 pax for 4 nights, then 3 pax for 1 night). Each line has:

- **Package** — the room type/config on that line specifically (e.g. "Twin
  room", "Single room"). This is separate from the quotation's overall
  **Package** field above the rate lines, which is what shows in the
  letter's heading ("QUOTATION FOR: ..."); the per-line Package is what
  shows in the letter table's own PACKAGE column for that row.
- **Rate (KSH)**, **Pax**, **Nights** — the line's total is rate × pax ×
  nights, worked out for you and shown live, summed into a grand total
  across all lines.
- **Provisions** — what's included on that line (e.g. "Dinner, bed &
  breakfast for 4pax sharing in doubles"). Optional — if left blank, the
  letter falls back to the package name and pax count for that row.

The letter renders one table row per rate line, each with its own
PACKAGE/RATE/PROVISIONS/TOTAL, plus a grand total row.

The full logo lives at `public/brand/panorama-logo.png` (used on the letter
and the login page) and a cropped version of just the giraffe mark at
`public/brand/panorama-mark.png` (used in the app's nav bar, where the full
logo+wordmark would be too wide to read at that size). The letter template
itself is `src/lib/pdf/quotationLetter.ts` — replace the logo files or edit
that file (letterhead text, standard inclusions, terms wording) if any of
it needs to change later. The brand colors (brown/green) are defined once as
`--color-brand-*` variables in `src/app/globals.css` and used as Tailwind
classes (`bg-brand-brown`, `text-brand-green`, etc.) throughout the app —
change them there if the exact shade ever needs adjusting.

## Running it locally

Requires **Node.js 22 or newer** (it uses Node's built-in SQLite support).

```bash
npm install
cp .env.example .env
# open .env and set AUTH_SECRET to a random string, e.g.:
#   openssl rand -base64 32

# create your login (repeat for each of the 5 staff members)
node scripts/add-user.mjs "Jane Mugo" "jane@panoramaparkhotel.com" "a-strong-password"

npm run dev
```

Then open http://localhost:3000 and sign in with the account you just
created.

## Managing staff logins

Day to day, this is done from inside the app: sign in as an admin and open
**"Manage users"** at the top right. From there you can add a login, reset
anyone's password, promote/demote an admin, or remove a login — no server
access needed. A user who has already created quotations or follow-ups
can't be removed (their history would be orphaned) — reset their password
instead to stop them signing in.

The `scripts/add-user.mjs` script still exists for two cases the in-app page
can't cover itself:

```bash
# first-time setup, or creating a login directly on the server
node scripts/add-user.mjs "Full Name" "email@example.com" "password"

# promote someone to admin (needed once, to unlock "Manage users" for them)
node scripts/add-user.mjs "Full Name" "email@example.com" "same-password" admin
```

Running it again with the same email updates that person's name/password
(and admin status, if you add `admin`) instead of creating a duplicate
account. **On a brand-new install, nobody is an admin yet, so the app
treats everyone as one until the first person is promoted** — do that for
your own account right after setting up, with the command above, so the
page locks down to just admins afterwards. There's still no self-signup
page — every login is created this way or from "Manage users".

## Deploying it

This is a standard Next.js app, so it deploys anywhere Next.js does. The one
thing to check on your host is that it runs **Node.js 22+** (not an
"Edge"/serverless runtime that doesn't support Node's `node:sqlite`), and
that it keeps a **persistent disk** — the SQLite file at `data/app.db` lives
on the server's local disk, and most "serverless" hosts (Vercel included)
wipe local files between deploys/requests, which would lose your data. That
rules out Vercel for this app as it stands today (see the Postgres note
below if you want Vercel specifically).

**Recommended: [Railway](https://railway.app) or [Render](https://render.com)**
— both run a real Node 22 server with a disk that survives deploys.

1. **Push this project to a GitHub repo** (if you haven't already —
   `git init`, commit, create a repo on GitHub, `git push`).
2. **Create a new service from that repo** on Railway ("New Project" → "Deploy
   from GitHub repo") or Render ("New" → "Web Service"). Both auto-detect
   Next.js; the build command is `npm run build` and the start command is
   `npm start`.
3. **Add a persistent volume/disk mounted at `/app/data`** (Railway: service
   → Settings → Volumes; Render: service → Disks). This is the step that
   makes your quotations survive a redeploy — without it you're back to the
   Vercel problem.
4. **Set environment variables** in the host's dashboard:
   - `AUTH_SECRET` — a random string (generate one with `openssl rand -base64 32`)
   - `AUTH_TRUST_HOST=true`
5. **Deploy.** Once it's live, create the staff logins by running
   `node scripts/add-user.mjs "Full Name" "email@..." "password" admin` for
   yourself (from the host's shell/console — Railway and Render both offer
   one) and plain `node scripts/add-user.mjs ...` (no `admin`) for everyone
   else — or just add them yourself from "Manage users" once you're in.
6. Share the URL the host gives you (e.g. `your-app.up.railway.app`) with
   your GM — add a custom domain later from the same dashboard if you want
   one.

**Later, if useful:** this app can be moved to a hosted Postgres database
(Neon, Supabase, or Railway's own Postgres) instead of local SQLite, which
then also opens up Vercel as a host and scales better with concurrent
users. The data-access layer is all in `src/lib/queries.ts` and
`src/lib/db.ts`, so it's a contained change — ask if/when you want this.

## Project structure

```
src/
  app/
    page.tsx                 dashboard (list + filter + search)
    login/page.tsx            login form
    quotations/new/page.tsx   add quotation
    quotations/[id]/page.tsx  view / edit a quotation + follow-up log
    users/page.tsx             "Manage users" admin page
    users/actions.ts            add/reset/promote/remove a user login
    actions.ts                 create/update/delete quotation, add follow-up
    api/quotations/[id]/letter/route.ts       generates the saved letter (PDF)
    api/quotations/preview/letter/route.ts    generates the no-save preview (PDF, currently unused in the UI)
  components/
    QuotationForm.tsx          shared add/edit form
    LineItemsEditor.tsx         the Rate Breakdown row editor (package/rate/pax/nights/provisions per line)
    StatusBadge.tsx
    TopNav.tsx                 shows "Manage users" link to admins only
    DeleteQuotationDialog.tsx   confirm-before-delete popup (quotations)
    DeleteUserDialog.tsx        confirm-before-delete popup (users)
  lib/
    db.ts                      SQLite connection + table setup
    queries.ts                  all database reads/writes
    formInput.ts                 shared form-parsing (used by actions.ts and the preview route)
    authz.ts                     who counts as an admin (incl. the bootstrap case)
    types.ts                    shared types
    pdf/quotationLetter.ts       the letter template itself
  auth.ts / auth.config.ts / proxy.ts   login + route protection
scripts/
  add-user.mjs                create/update a staff login, or promote one to admin
```
