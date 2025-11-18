import React, { useEffect, useState } from 'react';
import MetricCard from '../components/MetricCard';
import Spinner from '../components/Spinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const AdminDashboardOverview = () => {
  const [metrics, setMetrics] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [lifetimeMetrics, setLifetimeMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/.netlify/functions/getAdminDashboardMetrics?days=${days}`);
        const data = await response.json();
        setMetrics(data);
        if (days === 0) {
          setLifetimeMetrics(data.lifetimeMetrics);
          setHistoricalData([]);
        } else {
          setHistoricalData(data.historicalData);
          setLifetimeMetrics(null);
        }
      } catch (error) {
        console.error('Error fetching admin metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [days]);

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM d');
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="p-2 border rounded-md"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
          <option value={0}>Lifetime</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <MetricCard title="Total Users" value={metrics?.totalUsers} icon="Users" />
            <MetricCard title="Total Courses" value={metrics?.totalCourses} icon="BookOpen" />
            <MetricCard title="Total Modules" value={metrics?.totalModules} icon="LayoutGrid" />
            <MetricCard title="Total Flashcards" value={metrics?.totalFlashcards} icon="Copy" />
            <MetricCard title="Completed Courses" value={metrics?.totalCompletedCourses} icon="CheckCircle" />
            <MetricCard title="Daily Active Users" value={metrics?.dailyActiveUsers} icon="Activity" />
          </div>

          {days > 0 ? (
            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-semibold mb-4">Daily New Users</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="newUsers" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-semibold mb-4">Daily Active Users</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="activeUsers" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="p-4 border rounded-md lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Daily Generated Courses</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="generatedCourses" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard title="Lifetime New Users" value={lifetimeMetrics?.totalNewUsers} icon="Users" />
              <MetricCard title="Lifetime Active Users" value={lifetimeMetrics?.totalActiveUsers} icon="Activity" />
              <MetricCard title="Lifetime Generated Courses" value={lifetimeMetrics?.totalGeneratedCourses} icon="BookOpen" />
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default AdminDashboardOverview;