import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/shared/LoadingSpinner';
import ProtectedRoute from './components/shared/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProcessesPage from './pages/ProcessesPage';
import MaterialsPage from './pages/MaterialsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import StudentsPage from './pages/StudentsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

/** Redirects already-authenticated users away from public-only pages (login/signup). */
function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner label="Loading" fullScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <SignupPage />
          </GuestRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="processes" element={<ProcessesPage />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route
          path="students"
          element={
            <ProtectedRoute allowedRoles={['lecturer', 'admin']}>
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
