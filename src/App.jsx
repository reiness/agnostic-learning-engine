import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import logger from './utils/logger';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminProtectedRoute from './components/AdminProtectedRoute.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminDashboardOverview from './pages/AdminDashboardOverview.jsx';
import AdminRoleManagement from './pages/AdminRoleManagement.jsx';
import AdminUserManagement from './pages/AdminUserManagement.jsx';
import CoursePage from './pages/CoursePage.jsx';
import Profile from './pages/Profile.jsx';
import DeletedCourses from './pages/DeletedCourses.jsx';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { Toaster, useToasterStore, toast } from 'react-hot-toast';

const TOAST_LIMIT = 2;

/**
 * A component that listens to the toast store and dismisses toasts that exceed the limit.
 * This ensures that only the most recent toasts are visible.
 */
const ToasterListener = () => {
  const { toasts } = useToasterStore();

  useEffect(() => {
    const visibleToasts = toasts.filter((t) => t.visible);
    if (visibleToasts.length > TOAST_LIMIT) {
      // Create a copy of the array to avoid direct state mutation before sorting
      const sortedVisibleToasts = [...visibleToasts].sort((a, b) => a.createdAt - b.createdAt);
      const toastsToDismiss = sortedVisibleToasts.slice(0, sortedVisibleToasts.length - TOAST_LIMIT);
      toastsToDismiss.forEach((t) => toast.dismiss(t.id));
    }
  }, [toasts]);

  return null; // This component does not render anything
};

function App() {
  useEffect(() => {
    logger.info('App component mounted.');
    return () => {
      logger.info('App component unmounted.');
    };
  }, []);

  return (
    <ThemeProvider>
      <NotificationProvider>
        <>
          <Toaster
            position="top-right"
            gutter={4} // Halved the default gap of 8px
            toastOptions={{
              duration: 5000,
              style: {
                marginTop: '60px',
              },
            }}
          />
          <ToasterListener />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/course/:courseId" element={<CoursePage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/deleted-courses" element={<DeletedCourses />} />
            </Route>
            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin" element={<AdminDashboard />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<AdminDashboardOverview />} />
                <Route path="roles" element={<AdminRoleManagement />} />
                <Route path="users" element={<AdminUserManagement />} />
              </Route>
            </Route>
          </Routes>
        </>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;