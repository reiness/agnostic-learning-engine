import React from 'react';

const MainLayout = ({ sidebarContent, children }) => {
  return (
    <div className="flex h-screen w-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:block md:w-72 bg-gray-900 text-white p-6">
        {sidebarContent}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;