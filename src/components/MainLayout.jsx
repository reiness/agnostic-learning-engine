import React, { useState } from 'react';
import Navbar from './Navbar';

const MainLayout = ({ sidebarContent, children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-muted text-muted-foreground p-6 transition-all duration-300 ease-in-out transform ${isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'} hidden md:block`}>
        {sidebarContent}
      </div>
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-0' : 'md:ml-72'}`}>
        <Navbar toggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="flex-1 p-8 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;