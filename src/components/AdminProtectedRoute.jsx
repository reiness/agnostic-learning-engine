import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Navigate, Outlet } from 'react-router-dom';

const AdminProtectedRoute = () => {
  const [user, loading, error] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const adminRef = doc(db, 'admins', user.email);
          const adminDoc = await getDoc(adminRef);
          setIsAdmin(adminDoc.exists());
        } catch (err) {
          console.error("Error checking admin status:", err);
          setIsAdmin(false);
        } finally {
          setAdminCheckLoading(false);
        }
      } else {
        setAdminCheckLoading(false);
      }
    };
    checkAdminStatus();
  }, [user]);

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
  if (loading || adminCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen bg-gray-900 text-white text-2xl">
        Loading...
      </div>
    );
  }

  if (user && isAdmin) {
    return <Outlet />;
  }

  return <Navigate to="/login" />;
};

export default AdminProtectedRoute;