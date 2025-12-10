import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import MaintenanceGuard from './components/MaintenanceGuard'
import { AdminProvider } from './contexts/AdminContext'

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const SubmitPromptPage = lazy(() => import('./pages/SubmitPromptPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const GuidelinesPage = lazy(() => import('./pages/GuidelinesPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const PromptsPage = lazy(() => import('./pages/admin/PromptsPage'))
const ReviewPromptsPage = lazy(() => import('./pages/admin/ReviewPromptsPage'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'))
const SubscriptionsPage = lazy(() => import('./pages/admin/SubscriptionsPage'))
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const SavedPromptsPage = lazy(() => import('./pages/SavedPromptsPage'))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-[#FFDE1A] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
    </div>
  </div>
)

function App() {
  return (
    <MaintenanceGuard>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* 
            Routing Structure:
            - / -> Landing Page
            - /explore -> Explore Prompts Page
            - /terms, /privacy, /contact -> Legal/Info Pages
            - /auth -> Unified Auth Page (Login/Signup)
            - AuthLayout wraps /admin/login (centered auth layout)
            - AdminLayout wraps all other /admin/* pages (sidebar + header layout)
            Each layout uses <Outlet /> to render child route components.
          */}

          {/* Maintenance Route */}
          <Route path="/maintenance" element={<MaintenancePage />} />

          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/submit" element={<SubmitPromptPage />} />
          <Route path="/saved" element={<SavedPromptsPage />} />
          {/* Profile route redirects to home - Clerk handles profile via UserButton */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />

          {/* Unified Auth Route - wildcard to catch Clerk sub-routes like /auth/verify-email-address */}
          <Route path="/auth/*" element={<AuthPage />} />

          {/* Auth Routes - AuthLayout provides centered card layout for login */}
          <Route element={<AuthLayout />}>
            <Route path="/admin/login" element={<AdminLoginPage />} />
          </Route>

          {/* Admin Routes - Protected and wrapped with AdminLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AdminProvider>
                  <AdminLayout />
                </AdminProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/prompts" element={<PromptsPage />} />
            <Route path="/admin/review" element={<ReviewPromptsPage />} />
            <Route path="/admin/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>

          {/* 404 Catch-all Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </MaintenanceGuard>
  )
}

export default App
