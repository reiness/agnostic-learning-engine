import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen bg-gray-900 text-white text-2xl">
        Loading...
      </div>
    );
  }

  if (user) {
    return <Outlet />;
  }

  return <Navigate to="/login" />;
};

export default ProtectedRoute;