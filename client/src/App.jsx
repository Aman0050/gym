import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuthStore } from './store/useAuthStore';
import { PageLoader } from './components/Skeleton';
import SuspensionScreen from './pages/SuspensionScreen';

// ── Lazy Load Pages ──
const Home       = lazy(() => import('./pages/Home'));
const Login      = lazy(() => import('./pages/Login'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Members    = lazy(() => import('./pages/Members'));
const MemberProfile = lazy(() => import('./pages/MemberProfile'));
const Plans      = lazy(() => import('./pages/Plans'));
const Payments   = lazy(() => import('./pages/Payments'));
const Attendance = lazy(() => import('./pages/Attendance'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const Gyms       = lazy(() => import('./pages/Gyms'));

import CommandPalette from './components/ui/CommandPalette';

function App() {
  const { user, isAuthenticated, suspensionInfo } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Real-time Global Lockout Enforcement
  if (isAuthenticated && suspensionInfo) {
    return <SuspensionScreen {...suspensionInfo} />;
  }

  return (
    <BrowserRouter>
      {isAuthenticated && <CommandPalette />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/"      element={!isAuthenticated ? <Home />  : <Navigate to="/dashboard" replace />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />

          {/* Protected — wrapped by Layout (which now owns the Toaster) */}
          <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
            <Route path="/dashboard" element={isSuperAdmin ? <SuperAdminDashboard /> : <Dashboard />} />
            <Route path="/members"               element={<Members />} />
            <Route path="/members/profile/:id"   element={<MemberProfile />} />
            <Route path="/plans"                 element={<Plans />} />
            <Route path="/payments"              element={<Payments />} />
            <Route path="/attendance"            element={<Attendance />} />
            <Route path="/gyms"                  element={<Gyms />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
