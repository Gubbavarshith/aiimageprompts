# API Feature Removal Guide

This guide helps you completely remove the API key authentication feature from your Supabase project.

## Steps to Remove API Feature

### 1. Drop the `api_keys` Table

Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor):

```sql
-- Drop the api_keys table and all related objects (indexes, policies)
DROP TABLE IF EXISTS public.api_keys CASCADE;
```

Or use the migration file: `supabase/migrations/drop_api_keys_table.sql`

### 2. Remove the Edge Function

The `publish-blog` edge function needs to be deleted from Supabase:

**Option A: Via Supabase Dashboard**
1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** section
3. Find `publish-blog` function
4. Click **Delete** or **Remove**

**Option B: Via Supabase CLI** (if you have it installed)
```bash
supabase functions delete publish-blog
```

### 3. Verify Removal

After completing the above steps, verify:

1. **Table removed**: Check that `api_keys` no longer appears in your database tables
2. **Edge function removed**: Check that `publish-blog` no longer appears in Edge Functions
3. **Code removed**: All local code files have been deleted:
   - ✅ `supabase/functions/publish-blog/index.ts` (deleted)
   - ✅ `src/lib/services/apiKeys.ts` (deleted)
   - ✅ `supabase/functions/publish-blog/` directory (removed)

## What Was Removed

- Database table: `api_keys` with all columns, indexes, and RLS policies
- Edge Function: `publish-blog` for blog post publishing via API
- TypeScript service: `src/lib/services/apiKeys.ts` for API key management
- Admin UI: (was planned but cancelled)

## Notes

- The migration uses `CASCADE` to automatically remove all dependent objects (indexes, policies)
- If you encounter any errors, make sure no other tables or functions reference `api_keys`
- The edge function was deployed via MCP earlier, so it exists in your Supabase project and needs manual removal
