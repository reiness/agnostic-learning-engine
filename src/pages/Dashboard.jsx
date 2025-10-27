import React from 'react';

const Dashboard = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden md:block md:w-64 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-4">My Courses</h2>
        {/* Sidebar content goes here */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-100 p-4">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        {/* Main content goes here */}
      </div>
    </div>  );
};

export default Dashboard;