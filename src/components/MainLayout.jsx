import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';

const MainLayout = ({ sidebarContent, children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('isSidebarCollapsed');
    return savedState === 'true' ? true : false;
  });

  useEffect(() => {
    localStorage.setItem('isSidebarCollapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-muted text-muted-foreground p-6 transition-all duration-300 ease-in-out transform ${isSidebarCollapsed ? '-translate-x-full w-0 p-0' : 'translate-x-0 w-72'} overflow-y-auto hidden md:block`}>
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