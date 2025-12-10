# AI Image Prompts - Admin Dashboard

A modern admin dashboard for the AI Image Prompt Library project.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Clerk account (for user authentication)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aiimageprompts
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit the `.env` file and add your credentials:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
   - `VITE_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
   - `VITE_ADMIN_EMAIL_WHITELIST` - Comma-separated list of admin emails

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

**Important:** After updating your `.env` file, restart the development server for changes to take effect.

### Build

Create a production build:

```bash
npm run build
```

### Preview

Preview the production build:

```bash
npm run preview
```

## Deployment to Vercel

### Prerequisites
- Vercel account
- GitHub/GitLab/Bitbucket repository connected

### Steps

1. **Push your code to GitHub** (or your preferred Git provider)

2. **Import your project to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. **Configure Environment Variables:**
   - In Vercel project settings, go to "Environment Variables"
   - Add all variables from your `.env` file:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_CLERK_PUBLISHABLE_KEY`
     - `VITE_ADMIN_EMAIL_WHITELIST`

4. **Deploy:**
   - Vercel will automatically detect Vite and configure the build
   - Click "Deploy" and wait for the build to complete

5. **Verify:**
   - Once deployed, visit your Vercel URL
   - Test admin login at `/admin/login`
   - Verify all features are working correctly

### Vercel Build Settings

Vercel should automatically detect:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

If not detected automatically, you can set these manually in Project Settings > General.

## Features

- Modern, glassmorphism design
- Responsive layout
- Form validation
- Loading states
- Smooth animations
- Tailwind CSS v4 styling

## Tech Stack

- React 19.2.0
- TypeScript
- Vite
- Tailwind CSS v4
- React Router

## Project Structure

```
src/
  pages/
    LoginPage.tsx    # Admin login page
  App.tsx            # Main app component
  main.tsx           # Entry point
  index.css          # Global styles
```

## Environment Variables

All environment variables should be stored in a `.env` file in the root directory. Never commit this file to version control.

### Required Variables

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public API key
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key for user authentication
- `VITE_ADMIN_EMAIL_WHITELIST` - Comma-separated list of admin email addresses

### Getting Your Credentials

**Supabase:**
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" and "anon public" key

**Clerk:**
1. Go to your Clerk dashboard
2. Navigate to API Keys
3. Copy the "Publishable key"

## Admin Login

Navigate to `/admin/login` to access the admin login page.

**Authentication:** Uses Supabase Auth. Only emails listed in `VITE_ADMIN_EMAIL_WHITELIST` can access the admin dashboard.

## Project Structure

```
src/
  components/      # Reusable UI components
  contexts/        # React contexts
  hooks/          # Custom React hooks
  layouts/        # Layout components
  lib/            # Utilities and services
  pages/          # Page components
    admin/        # Admin dashboard pages
  App.tsx         # Main app component
  main.tsx        # Entry point
  index.css       # Global styles
```

