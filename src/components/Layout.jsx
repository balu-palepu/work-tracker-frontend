import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => (
  <div className="flex h-screen bg-gray-50 overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  </div>
);

export default Layout;
