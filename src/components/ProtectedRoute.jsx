import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const [user, loading, error] = useAuthState(auth);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-2xl">
        <div className="text-center">
          <p className="text-red-500">Authentication Error</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }
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