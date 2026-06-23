import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuthStore } from './store/useAuthStore';
import { PageLoader } from './components/Skeleton';
import SuspensionScreen from './pages/SuspensionScreen';
import ScrollToTop from './components/ScrollToTop';

// ── Lazy Load Pages ──
const Home       = lazy(() => import('./pages/Home'));
const About      = lazy(() => import('./pages/About'));
const Contact    = lazy(() => import('./pages/Contact'));
const Login      = lazy(() => import('./pages/Login'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Members    = lazy(() => import('./pages/Members'));
const MemberProfile = lazy(() => import('./pages/MemberProfile'));
const Plans      = lazy(() => import('./pages/Plans'));
const Payments   = lazy(() => import('./pages/Payments'));
const Attendance = lazy(() => import('./pages/Attendance'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const Gyms       = lazy(() => import('./pages/Gyms'));
const BranchProfile = lazy(() => import('./pages/BranchProfile'));
const SupportDashboard = lazy(() => import('./pages/SupportDashboard'));
const SupportTicketDetails = lazy(() => import('./pages/SupportTicketDetails'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const RefundPolicy = lazy(() => import('./pages/legal/RefundPolicy'));

// Operations Hub
const OperationsOverview = lazy(() => import('./pages/operations/OperationsOverview'));
const StaffPayroll = lazy(() => import('./pages/operations/StaffPayroll'));
const Expenses = lazy(() => import('./pages/expenses/Expenses'));
const Inventory = lazy(() => import('./pages/inventory/Inventory'));
const Assets = lazy(() => import('./pages/assets/Assets'));
const Maintenance = lazy(() => import('./pages/maintenance/Maintenance'));
import CommandPalette from './components/ui/CommandPalette';
import GlobalSocketListener from './components/GlobalSocketListener';

function App() {
  const { user, isAuthenticated, suspensionInfo } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Real-time Global Lockout Enforcement
  if (isAuthenticated && suspensionInfo) {
    return <SuspensionScreen {...suspensionInfo} />;
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      {isAuthenticated && <CommandPalette />}
      {isAuthenticated && <GlobalSocketListener />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/"      element={!isAuthenticated ? <Home />  : <Navigate to="/dashboard" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          {/* Protected — wrapped by Layout (which now owns the Toaster) */}
          <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
            <Route path="/dashboard" element={isSuperAdmin ? <SuperAdminDashboard /> : <Dashboard />} />
            <Route path="/super-admin/branches/:id" element={isSuperAdmin ? <BranchProfile /> : <Navigate to="/dashboard" replace />} />
            <Route path="/super-admin/support/tickets" element={isSuperAdmin ? <SupportDashboard /> : <Navigate to="/dashboard" replace />} />
            <Route path="/super-admin/support/tickets/:id" element={isSuperAdmin ? <SupportTicketDetails /> : <Navigate to="/dashboard" replace />} />
            <Route path="/members"               element={<Members />} />
            <Route path="/members/profile/:id"   element={<MemberProfile />} />
            <Route path="/plans"                 element={<Plans />} />
            <Route path="/payments"              element={<Payments />} />
            <Route path="/attendance"            element={<Attendance />} />
            <Route path="/gyms"                  element={<Gyms />} />

            {/* Operations Hub routes */}
            <Route path="/operations"            element={<OperationsOverview />} />
            <Route path="/operations/expenses"   element={<Expenses />} />
            <Route path="/operations/inventory"  element={<Inventory />} />
            <Route path="/operations/assets"     element={<Assets />} />
            <Route path="/operations/maintenance" element={<Maintenance />} />
            <Route path="/operations/staff"      element={<StaffPayroll />} />

            {/* Legacy Operations Hub redirects */}
            <Route path="/expenses"              element={<Navigate to="/operations/expenses" replace />} />
            <Route path="/inventory"             element={<Navigate to="/operations/inventory" replace />} />
            <Route path="/assets"                element={<Navigate to="/operations/assets" replace />} />
            <Route path="/maintenance"           element={<Navigate to="/operations/maintenance" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
