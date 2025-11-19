import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { Button } from '@/components/ui/button'; // Assuming Button is used for sidebar links

const AdminDashboard = () => {
  const location = useLocation();

  const adminSidebarContent = (
    <nav className="space-y-2">
      <h2 className="text-xl font-bold mb-4">Admin Navigation</h2>
      <Link to="/admin/overview">
        <Button
          variant="ghost"
          className={`w-full justify-start text-wrap break-words h-auto py-2 text-left ${
            location.pathname === '/admin/overview' ? 'bg-gray-200' : ''
          }`}
        >
          Dashboard Overview
        </Button>
      </Link>
      <Link to="/admin/roles">
        <Button
          variant="ghost"
          className={`w-full justify-start text-wrap break-words h-auto py-2 text-left ${
            location.pathname === '/admin/roles' ? 'bg-gray-200' : ''
          }`}
        >
          Role Access Management
        </Button>
      </Link>
      <Link to="/admin/users">
        <Button
          variant="ghost"
          className={`w-full justify-start text-wrap break-words h-auto py-2 text-left ${
            location.pathname === '/admin/users' ? 'bg-gray-200' : ''
          }`}
        >
          User Management
        </Button>
      </Link>
    </nav>
  );

  return (
    <MainLayout sidebarContent={adminSidebarContent}>
      <div className="container mx-auto p-4">
        <Outlet />
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;