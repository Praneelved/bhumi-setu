import React from 'react';
import { NavLink } from 'react-router-dom';

// Public / Landowner top navigation — strictly 3 items as required
const publicNavItems = [
  { path: '/about', label: 'About' },
  { path: '/login', label: 'Login' },
  { path: '/gis', label: 'National GIS Explorer' },
];

// Government portal navigation (preserved for authenticated officers)
const governmentNavItems = [
  { path: '/government/dashboard', label: 'Government Verified Portal' },
  { path: '/government/gis', label: 'Government GIS Monitoring' },
  { path: '/government/compensation', label: 'Compensation Executive Proposal' },
  { path: '/about', label: 'About' },
];

// Agency portal navigation (preserved for authenticated agency users)
const agencyNavItems = [
  { path: '/agency/dashboard', label: 'Agency Portal' },
  { path: '/agency/gis', label: 'Project GIS Explorer' },
  { path: '/about', label: 'About' },
];

const TopNav: React.FC = () => {
  // Detect current user role from localStorage
  let userType: string | null = null;
  try {
    const stored = localStorage.getItem('bhoomi_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      userType = parsed?.user_type || null;
    }
  } catch {
    userType = null;
  }

  // Public / Landowner view shows strictly: About | Login | National GIS Explorer
  const navItems = userType === 'GOVERNMENT'
    ? governmentNavItems
    : userType === 'AGENCY'
      ? agencyNavItems
      : publicNavItems;

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
