import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentAuthState, getDashboardForRole } from './authRouteUtils';

/**
 * Wraps public/login routes.
 * If the user is already authenticated, redirect them to their role-appropriate dashboard.
 * This ensures authenticated users can never see the login page again.
 */
const PublicRoute: React.FC = () => {
  const { token, user } = getCurrentAuthState();

  if (token && user) {
    return <Navigate to={getDashboardForRole(user)} replace />;
  }


  return <Outlet />;
};

export default PublicRoute;
