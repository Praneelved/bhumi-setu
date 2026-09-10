import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/government/dashboard', label: 'Government Verification Portal' },
  { path: '/gis', label: 'National GIS Explorer' },
  { path: '/government/compensation', label: 'Compensation & PFMS Payments' },
  { path: '/dashboard', label: 'Executive Dashboard' },
  { path: '/tracker', label: 'Proposal & Cadastral Tracker' },
  { path: '/login', label: 'Login / SSO Gateway' },
  { path: '/about', label: 'About & Study Scope' }
];

const TopNav = () => {
  return (
    <nav style={{
      backgroundColor: 'var(--surface-container-lowest)',
      borderBottom: '1px solid var(--outline-variant)',
      padding: '0 var(--space-xl)',
      display: 'flex',
      gap: 'var(--space-xl)',
      overflowX: 'auto'
    }}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            padding: 'var(--space-md) 0',
            textDecoration: 'none',
            color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
            fontWeight: isActive ? 700 : 600,
            fontFamily: 'var(--font-heading)',
            fontSize: '14px',
            borderBottom: isActive ? '3px solid var(--primary-container)' : '3px solid transparent',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          })}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default TopNav;
