import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import logger from './utils/logger';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CoursePage from './pages/CoursePage.jsx';
import Profile from './pages/Profile.jsx';
import DeletedCourses from './pages/DeletedCourses.jsx';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext.jsx';

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
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />

          {/* Updated Protected Route block */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} /> {/* <-- Add this route */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/course/:courseId" element={<CoursePage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/deleted-courses" element={<DeletedCourses />} />
            {/* Add future routes like /course/:id here */}
          </Route>
          
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;