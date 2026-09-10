import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import TopNav from './TopNav';
import Footer from './Footer';

/**
 * Layout for all AUTHENTICATED routes.
 * Renders Header, TopNav, main content area (via Outlet), and Footer.
 * Login pages are NEVER rendered inside this layout.
 */
const AuthenticatedLayout: React.FC = () => {
  return (
    <div className="app-container">
      <div className="main-content">
        <Header />
        <TopNav />
        <main style={{ flex: 1, backgroundColor: 'var(--background)' }}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AuthenticatedLayout;
