## Audit Report — Admin Dashboard & Supabase Data

### Overview
I reviewed the admin dashboard, prompt services, and Supabase policies. The UI now pulls live data, but there are critical backend policy issues and a couple of UX/navigation bugs to address.

### Critical
- Supabase RLS too permissive: policies now allow any `authenticated` user to SELECT/UPDATE/DELETE every prompt. This bypasses the admin whitelist and lets any signed-in Supabase user alter or remove data.
- Public/anon insert policies: `Allow public to insert prompts` and `Test simplest anon policy` permit anonymous inserts with minimal checks (only non-null + status Pending), no rate limiting, and no user validation. This enables spam/poisoning of your prompts table.

### High
- Admin authorization only client-side: Admin gating uses `VITE_ADMIN_EMAIL_WHITELIST` on the frontend, but Supabase policies no longer enforce admin-only access. A non-admin with Supabase auth could still mutate prompts because of the permissive RLS.
- Admin dashboard “Categories” nav: The summary card links to `/admin/categories`, which is not a defined route, causing a 404 on click.

### Medium
- Supabase env fallbacks: If env vars are missing, the app still instantiates Supabase with placeholders; users see runtime errors instead of a hard fail/maintenance page. Safer to block admin flows when not configured.
- Duplicate published-select policies: Two similar public SELECT policies for published prompts add noise; prune to a single clear policy.

### Low
- Clerk dev key warning appears in console for production; switch to production keys before deploy.
- Extension-induced console errors (`contentscript.js Identifier 'cl'…`) can obscure real issues; advise testing with extensions disabled.

### Recommended fixes
1) Tighten Supabase RLS for `public.prompts`:
   - Remove the anon/public insert test policies; require authenticated users only, with server-side validation of allowed submitters (or move inserts behind an Edge Function).
   - Add admin-only SELECT/UPDATE/DELETE policy that checks an admin claim (email allowlist or `is_admin` in JWT). Keep a single public SELECT for `status = 'Published'`.
2) Enforce admin on the backend:
   - When signing in admins, set `is_admin=true` (or use a fixed admin role) and have RLS check it. Do not rely solely on `VITE_ADMIN_EMAIL_WHITELIST`.
3) Fix navigation bug:
   - Update the dashboard “Categories” card to route to an existing page (e.g., `/admin/prompts`) or remove the link until a categories page exists.
4) Configuration hard-stop:
   - If Supabase envs are missing, show a blocking error/maintenance page for admin routes instead of initializing with placeholders.
5) Clean up policies:
   - Remove duplicate published SELECT policies; keep one canonical rule.

### Validation steps after fixes
- Verify prompts count (currently 6: 4 Published, 2 Pending) matches dashboard stats.
- Confirm Review page lists all non-published prompts and that approve sets `Published`, reject sets `Rejected`, with no 403s.
- Attempt prompt mutation as a non-admin account to ensure RLS denies UPDATE/DELETE/SELECT non-published records.

