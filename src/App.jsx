import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CoursePage from './pages/CoursePage.jsx';
import Profile from './pages/Profile.jsx';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/login" element={<Login />} />

        {/* Updated Protected Route block */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} /> {/* <-- Add this route */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/course/:courseId" element={<CoursePage />} />
          <Route path="/profile" element={<Profile />} />
          {/* Add future routes like /course/:id here */}
        </Route>
        
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;