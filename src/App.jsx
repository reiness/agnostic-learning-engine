import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CoursePage from './pages/CoursePage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Updated Protected Route block */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} /> {/* <-- Add this route */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/course/:courseId" element={<CoursePage />} />
          {/* Add future routes like /course/:id here */}
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;