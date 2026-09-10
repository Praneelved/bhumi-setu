import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { 
  getCurrentAuthState, 
  getDashboardForRole, 
  getLoginForRole,
  getAuthorityFromRole 
} from './authRouteUtils';
import type { GovernmentAuthority } from './authRouteUtils';

interface ProtectedRouteProps {
  /** If specified, only these user_types can access. Others are redirected to their own dashboard. */
  allowedRoles?: string[];
  /** If specified, only these government authorities (DISTRICT, STATE, CENTRAL) can access. */
  allowedAuthorities?: GovernmentAuthority[];
  /** Where to send unauthenticated users. Defaults to /login. */
  redirectTo?: string;
}

/**
 * Renders child routes only if the user is authenticated and authorized for the authority tier.
 * - No token → redirect to redirectTo (login page)
 * - Wrong role or authority → redirect to the user's own authorized dashboard
 * - Correct role & authority → render <Outlet />
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  allowedAuthorities,
  redirectTo = '/login',
}) => {
  const { token, user } = getCurrentAuthState();

  // Not authenticated
  if (!token || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Authenticated but accessing a route restricted to different user_type
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.user_type)) {
    return <Navigate to={getDashboardForRole(user)} replace />;
  }

  // Strict Government Tier Access Guard: District vs State vs Central
  if (allowedAuthorities && allowedAuthorities.length > 0) {
    const userAuthority = getAuthorityFromRole(user.role);
    if (!userAuthority || !allowedAuthorities.includes(userAuthority)) {
      // Forbidden cross-tier access: Bounce to their own authorized dashboard
      return <Navigate to={getDashboardForRole(user)} replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;


