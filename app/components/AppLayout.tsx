'use client';
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navigation } from './Navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar isMobileOpen={isMobileMenuOpen} onMobileClose={closeMobileMenu} />
      
      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Navigation */}
        <Navigation onMobileMenuClick={toggleMobileMenu} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
