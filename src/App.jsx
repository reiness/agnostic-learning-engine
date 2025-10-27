import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Updated Protected Route block */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} /> {/* <-- Add this route */}
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Add future routes like /course/:id here */}
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;