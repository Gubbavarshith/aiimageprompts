# API Testing Configuration Guide

This document provides complete API configuration details for testing the AI Image Prompts application. The application uses **Supabase for admin authentication** and **Clerk for user authentication**.

---

## API 1: Supabase (Admin Authentication & Database)

### Configuration Details

**API Name:** `AI Image Prompts - Supabase API`

**API Endpoint / URL:**
```
https://hfncjkqzflreyfxvobxx.supabase.co
```
*This value comes from `VITE_SUPABASE_URL` in your `.env` file*

**Authentication Type:** `Custom Header` (Required)

**Headers Required:**
1. **Header Name:** `apikey` (must be lowercase, exactly as shown)
   **Header Value:** `[YOUR_VITE_SUPABASE_ANON_KEY_FROM_ENV_FILE]`
   *Copy the complete value from `VITE_SUPABASE_ANON_KEY` in your `.env` file (JWT format starting with `eyJ...`)*

2. **Header Name:** `Authorization` (for JWT keys)
   **Header Value:** `Bearer [YOUR_VITE_SUPABASE_ANON_KEY_FROM_ENV_FILE]`
   *Include the word "Bearer" followed by a space, then your complete key from `.env` file*

**Important:** Replace `[YOUR_VITE_SUPABASE_ANON_KEY_FROM_ENV_FILE]` with the actual value from your `.env` file's `VITE_SUPABASE_ANON_KEY` variable.

**Additional Headers:**
- `Content-Type: application/json`
- `Prefer: return=representation` (for POST/PATCH to return data)

---

### Supabase REST API Endpoints

**Base URL:** `https://hfncjkqzflreyfxvobxx.supabase.co/rest/v1/`

**Full API URL Example:**
```
https://hfncjkqzflreyfxvobxx.supabase.co/rest/v1/prompts?select=*&status=eq.Published
```

**Key Tables & Endpoints:**

#### 1. prompts (Main Content Table)
- **GET** `/rest/v1/prompts?select=*&status=eq.Published&limit=10`
  - Public: Read published prompts
- **POST** `/rest/v1/prompts` (Admin only)
  - Create new prompt
  - Body: `{ "title": "...", "prompt": "...", "category": "...", "status": "Published", ... }`
- **PATCH** `/rest/v1/prompts?id=eq.{id}` (Admin only)
  - Update existing prompt
- **DELETE** `/rest/v1/prompts?id=eq.{id}` (Admin only)
  - Delete prompt

#### 2. prompt_ratings (User Ratings)
- **GET** `/rest/v1/prompt_ratings?select=*&prompt_id=eq.{id}`
  - Public: Read ratings for a prompt
- **POST** `/rest/v1/prompt_ratings`
  - Create rating (authenticated or anonymous)
  - Body: `{ "prompt_id": "...", "rating": 5, "user_id": "..." }`

#### 3. saved_prompts (User Favorites)
- **GET** `/rest/v1/saved_prompts?select=*&user_id=eq.{clerk_user_id}`
  - Authenticated: Read user's saved prompts
- **POST** `/rest/v1/saved_prompts`
  - Authenticated: Save a prompt
  - Body: `{ "user_id": "...", "prompt_id": "..." }`
- **DELETE** `/rest/v1/saved_prompts?id=eq.{id}`
  - Authenticated: Unsave a prompt

#### 4. blog_posts (Blog Articles)
- **GET** `/rest/v1/blog_posts?select=*&status=eq.Published&order=created_at.desc`
  - Public: Read published blog posts
- **POST** `/rest/v1/blog_posts` (Admin only)
  - Create blog post
- **PATCH** `/rest/v1/blog_posts?id=eq.{id}` (Admin only)
  - Update blog post

#### 5. category_meta (Category Metadata)
- **GET** `/rest/v1/category_meta?select=*`
  - Public: Read category metadata

#### 6. email_subscriptions (Newsletter)
- **POST** `/rest/v1/email_subscriptions`
  - Public: Subscribe to newsletter
  - Body: `{ "email": "user@example.com", ... }`

#### 7. contact_messages (Contact Form)
- **POST** `/rest/v1/contact_messages`
  - Public: Submit contact message
  - Body: `{ "name": "...", "email": "...", "message": "...", "status": "new" }`
- **GET** `/rest/v1/contact_messages?select=*` (Admin only)
  - Read all contact messages

#### 8. tracked_links (Short Links)
- **GET** `/rest/v1/tracked_links?select=*&is_active=eq.true`
  - Public: Read active tracked links

#### 9. Admin Authentication (Supabase Auth)
- **POST** `/auth/v1/token?grant_type=password`
  - Admin login
  - Body: `{ "email": "admin@example.com", "password": "..." }`
  - Returns: `{ "access_token": "...", "refresh_token": "...", ... }`

**Note:** Admin authentication uses Supabase Auth. Only emails in `VITE_ADMIN_EMAIL_WHITELIST` can access admin routes.

---

### Supabase Testing Focus

1. **CRUD Operations:**
   - Test creating, reading, updating, and deleting prompts (admin)
   - Test reading published prompts (public)

2. **Filtering & Search:**
   - Test filtering by status: `?status=eq.Published`
   - Test filtering by category: `?category=eq.Art`
   - Test search with PostgREST operators: `?title=ilike.*search*`

3. **Pagination:**
   - Test limit: `?limit=10`
   - Test offset: `?offset=20`
   - Test ordering: `?order=created_at.desc`

4. **Authentication:**
   - Test public endpoints (no auth required)
   - Test admin endpoints (require Supabase Auth token)
   - Test RLS policies (public vs authenticated vs admin)

5. **Error Handling:**
   - Test invalid requests (400)
   - Test unauthorized access (401)
   - Test forbidden access (403)
   - Test not found (404)

**Reference:** [Supabase REST API Documentation](https://supabase.com/docs/reference/api)

---

## API 2: Clerk (User Authentication)

### Configuration Details

**API Name:** `AI Image Prompts - Clerk API`

**API Endpoint / URL:**
```
https://api.clerk.com
```
*Clerk uses a centralized API endpoint*

**Authentication Type:** `Bearer Token` or `API Key`

**API Key / Token:**
```
[YOUR_VITE_CLERK_PUBLISHABLE_KEY_FROM_ENV_FILE]
```
*Copy the complete value from `VITE_CLERK_PUBLISHABLE_KEY` in your `.env` file (format: `pk_test_...` or `pk_live_...`)*

**Important:** Replace `[YOUR_VITE_CLERK_PUBLISHABLE_KEY_FROM_ENV_FILE]` with the actual value from your `.env` file.

**Note:** For backend API testing, you may also need:
- **Secret Key:** `sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (from Clerk Dashboard → API Keys → Secret Key)
  - **⚠️ WARNING:** Secret keys should NEVER be used in frontend/client-side code
  - Only use secret keys for server-side/backend API testing

---

### Clerk API Endpoints

**Base URL:** `https://api.clerk.com/v1/`

**Key Endpoints:**

#### 1. User Management
- **GET** `/users`
  - List all users (requires secret key)
  - Headers: `Authorization: Bearer sk_test_...`
- **GET** `/users/{user_id}`
  - Get user details (requires secret key)
- **POST** `/users`
  - Create user (requires secret key)
  - Body: `{ "email_address": ["user@example.com"], ... }`
- **PATCH** `/users/{user_id}`
  - Update user (requires secret key)
- **DELETE** `/users/{user_id}`
  - Delete user (requires secret key)

#### 2. Sessions
- **GET** `/sessions`
  - List sessions (requires secret key)
- **GET** `/sessions/{session_id}`
  - Get session details (requires secret key)
- **POST** `/sessions/{session_id}/revoke`
  - Revoke session (requires secret key)

#### 3. Authentication (Frontend - Clerk Components)
The application uses Clerk's React components for frontend authentication:
- **Sign In:** `/auth` route (handled by Clerk `<SignIn />` component)
- **Sign Up:** `/auth` route (handled by Clerk `<SignUp />` component)
- **User Profile:** Handled by Clerk `<UserButton />` component

**Frontend Routes:**
- `/auth` - Sign in/Sign up page
- `/auth/verify-email-address` - Email verification (Clerk sub-route)
- `/auth/*` - Other Clerk authentication flows

#### 4. Webhooks (Backend)
- **POST** `/webhooks` (configured in Clerk Dashboard)
  - Receive user events (user.created, user.updated, etc.)
  - Requires webhook secret for verification

---

### Clerk Testing Focus

1. **User Authentication Flow:**
   - Test sign up process
   - Test sign in process
   - Test email verification
   - Test password reset

2. **User Management (Backend API):**
   - Test creating users via API (secret key)
   - Test retrieving user information
   - Test updating user metadata
   - Test session management

3. **Frontend Integration:**
   - Test Clerk React components render correctly
   - Test protected routes redirect to `/auth` when not signed in
   - Test user profile access via UserButton

4. **Security:**
   - Test that publishable key works for frontend
   - Test that secret key is required for backend API
   - Test session validation

**Reference:** [Clerk API Documentation](https://clerk.com/docs/reference/backend-api/overview)

---

## Testing Configuration Summary

### For TestSprite/Testing Platform:

#### API 1: Supabase
```
API Name: AI Image Prompts - Supabase API
API Endpoint: https://hfncjkqzflreyfxvobxx.supabase.co
Authentication Type: Custom Header
Header 1:
  Name: apikey
  Value: [Copy complete value from VITE_SUPABASE_ANON_KEY in .env file]
Header 2:
  Name: Authorization
  Value: Bearer [Copy complete value from VITE_SUPABASE_ANON_KEY in .env file]
```

#### API 2: Clerk (Frontend)
```
API Name: AI Image Prompts - Clerk API
API Endpoint: https://api.clerk.com
Authentication Type: Bearer Token
Token: [Copy complete value from VITE_CLERK_PUBLISHABLE_KEY in .env file]
```

#### API 3: Clerk (Backend - Optional for Server-Side Testing)
```
API Name: AI Image Prompts - Clerk Backend API
API Endpoint: https://api.clerk.com
Authentication Type: Bearer Token
Token: [Copy complete value from CLERK_SECRET_KEY in .env file]
⚠️ WARNING: Secret keys should NEVER be used in frontend/client-side code
```

---

## Environment Variables Reference

All API keys should be retrieved from your `.env` file:

**Supabase:**
- `VITE_SUPABASE_URL` → API Endpoint URL
- `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY` → API Key

**Clerk:**
- `VITE_CLERK_PUBLISHABLE_KEY` → Frontend API Key (publishable)
- `CLERK_SECRET_KEY` → Backend API Key (secret, server-side only)

**Admin Configuration:**
- `VITE_ADMIN_EMAIL_WHITELIST` → Comma-separated list of admin emails for Supabase admin access

---

## Common Testing Scenarios

### Scenario 1: Public User Browsing Prompts
1. **No authentication required**
2. **GET** `/rest/v1/prompts?select=*&status=eq.Published&limit=20`
3. **Expected:** 200 OK with array of published prompts

### Scenario 2: User Sign Up (Clerk)
1. **POST** to Clerk frontend component (not direct API)
2. User visits `/auth` and uses SignUp component
3. **Expected:** User created, redirected to home, signed in

### Scenario 3: User Saving a Prompt
1. **User authenticated via Clerk** (has Clerk user ID)
2. **POST** `/rest/v1/saved_prompts`
   - Headers: Include Supabase `apikey` + `Authorization` headers
   - Body: `{ "user_id": "[clerk_user_id]", "prompt_id": "[prompt_uuid]" }`
3. **Expected:** 201 Created

### Scenario 4: Admin Creating a Prompt
1. **Admin authenticated via Supabase Auth**
2. **POST** `/rest/v1/prompts`
   - Headers: Include Supabase `apikey` + `Authorization: Bearer [supabase_admin_token]`
   - Body: `{ "title": "...", "prompt": "...", "category": "...", "status": "Published", ... }`
3. **Expected:** 201 Created

### Scenario 5: Admin Accessing Protected Route
1. **Admin signs in at** `/admin/login` (Supabase Auth)
2. **Accesses** `/admin/dashboard`
3. **Expected:** 200 OK, dashboard loads
4. **If unauthorized:** Redirected to `/admin/login` with error message

---

## Troubleshooting

### Error: "No API key found in request" (401)
**Solution:** Ensure both headers are set:
- `apikey: [your-supabase-key]`
- `Authorization: Bearer [your-supabase-key]`

### Error: "Invalid API key" (401)
**Solution:** 
- Verify key is copied correctly (no extra spaces)
- Check if key format matches (JWT keys start with `eyJ...`)
- Ensure you're using the anon/public key, not the service role key

### Error: "Row Level Security policy violation" (403)
**Solution:**
- This is expected for protected endpoints
- Test with public endpoints first (`status=eq.Published`)
- Admin endpoints require authenticated admin user

### Error: "Clerk publishable key not found"
**Solution:**
- Verify `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env`
- Restart development server after updating `.env`
- Check Clerk Dashboard for correct publishable key

---

## Additional Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Supabase REST API Reference:** https://supabase.com/docs/reference/api
- **Clerk Documentation:** https://clerk.com/docs
- **Clerk Backend API Reference:** https://clerk.com/docs/reference/backend-api/overview
- **PostgREST Query Syntax:** https://postgrest.org/en/stable/api.html

---

## Security Notes

1. **Never commit `.env` file** to version control
2. **Anon keys are safe** for client-side use (protected by RLS)
3. **Secret keys must never** be used in frontend code
4. **Admin access** is restricted by email whitelist (`VITE_ADMIN_EMAIL_WHITELIST`)
5. **Row Level Security (RLS)** protects all Supabase tables
6. **Clerk publishable keys** are safe for frontend use
7. **Clerk secret keys** should only be used in backend/server environments

---

**Last Updated:** Based on current application configuration
**Environment Variables Location:** `.env` file in project root
