import React, { useEffect, useState } from 'react';
import MainLayout from '../components/MainLayout';
import MetricCard from '../components/MetricCard';
import Spinner from '../components/Spinner';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/.netlify/functions/getAdminDashboardMetrics');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching admin metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Dashboard Overview</h2>
          {loading ? (
            <Spinner />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard title="Total Users" value={metrics?.totalUsers} icon="Users" />
              <MetricCard title="Total Courses" value={metrics?.totalCourses} icon="BookOpen" />
              <MetricCard title="Total Modules" value={metrics?.totalModules} icon="LayoutGrid" />
              <MetricCard title="Total Flashcards" value={metrics?.totalFlashcards} icon="Copy" />
              <MetricCard title="Completed Courses" value={metrics?.totalCompletedCourses} icon="CheckCircle" />
              <MetricCard title="Daily Active Users" value={metrics?.dailyActiveUsers} icon="Activity" />
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Role Access Management</h2>
          <p>Manage user roles and permissions within the application.</p>
          {/* Placeholder for role access content */}
          <div className="bg-gray-100 p-4 rounded-md mt-2">
            <p>User table with role editing options will be displayed here.</p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;