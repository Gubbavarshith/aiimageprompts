import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'

// Import LandingPage directly (critical for LCP)
import LandingPage from './pages/LandingPage'

// Lazy load non-critical components (not needed for landing page)
const MaintenanceGuard = lazy(() => import('./components/MaintenanceGuard'))
const AuthLayout = lazy(() => import('./layouts/AuthLayout'))
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'))
const AdminProvider = lazy(() => import('./contexts/AdminContext').then(m => ({ default: m.AdminProvider })))
const BuyMeACoffee = lazy(() => import('./components/BuyMeACoffee'))

// Lazy load other pages for code splitting
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const SubmitPromptPage = lazy(() => import('./pages/SubmitPromptPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const GuidelinesPage = lazy(() => import('./pages/GuidelinesPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const PromptPage = lazy(() => import('./pages/PromptPage'))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const PromptsPage = lazy(() => import('./pages/admin/PromptsPage'))
const ReviewPromptsPage = lazy(() => import('./pages/admin/ReviewPromptsPage'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'))
const SubscriptionsPage = lazy(() => import('./pages/admin/SubscriptionsPage'))
const AdminBlogListPage = lazy(() => import('./pages/admin/AdminBlogListPage'))
const AdminBlogEditorPage = lazy(() => import('./pages/admin/AdminBlogEditorPage'))
const ExploreHeroToolsAdminPage = lazy(() => import('./pages/admin/ExploreHeroToolsAdminPage'))
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'))
const TagsPage = lazy(() => import('./pages/admin/TagsPage'))
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const SavedPromptsPage = lazy(() => import('./pages/SavedPromptsPage'))
import { WelcomeModal } from './components/modals/WelcomeModal'

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
  const [showMaintenanceGuard, setShowMaintenanceGuard] = useState(false)

  // Defer maintenance guard check until after first paint
  useEffect(() => {
    const timer = requestAnimationFrame(() => setShowMaintenanceGuard(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  const content = (
    <>
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
          <Route path="/refund" element={<RefundPolicyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/prompt/:slug" element={<PromptPage />} />

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
            <Route path="/admin/blogs" element={<AdminBlogListPage />} />
            <Route path="/admin/blogs/new" element={<AdminBlogEditorPage />} />
            <Route path="/admin/blogs/:id" element={<AdminBlogEditorPage />} />
            <Route path="/admin/explore-hero" element={<ExploreHeroToolsAdminPage />} />
            <Route path="/admin/categories" element={<CategoriesPage />} />
            <Route path="/admin/tags" element={<TagsPage />} />
          </Route>

          {/* 404 Catch-all Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Suspense fallback={null}>
        <BuyMeACoffee />
      </Suspense>
      <WelcomeModal />
    </>
  )

  // Show content immediately, wrap with MaintenanceGuard after first paint
  return showMaintenanceGuard ? (
    <Suspense fallback={content}>
      <MaintenanceGuard>{content}</MaintenanceGuard>
    </Suspense>
  ) : content
}

export default App
