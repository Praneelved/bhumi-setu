// Shared auth utilities — used by ProtectedRoute, PublicRoute, and RootRedirect
import { getAuthToken, getStoredUser } from '../../services/api';
import type { UserProfile } from '../../services/api';

export type UserType = 'GOVERNMENT' | 'AGENCY' | 'PERSONAL';
export type GovernmentAuthority = 'DISTRICT' | 'STATE' | 'CENTRAL';

export function getAuthorityFromRole(role?: string): GovernmentAuthority | null {
  if (!role) return null;
  const upper = role.toUpperCase();
  if (upper.includes('DISTRICT') || upper.includes('COLLECTOR') || upper.includes('ACQUISITION_OFFICER')) {
    return 'DISTRICT';
  }
  if (upper.includes('STATE')) {
    return 'STATE';
  }
  if (upper.includes('CENTRAL')) {
    return 'CENTRAL';
  }
  return null;
}

export function getDashboardForRole(userOrType?: UserProfile | string | null): string {
  if (!userOrType) {
    const stored = getStoredUser();
    if (stored) return getDashboardForRole(stored);
    return '/login';
  }

  if (typeof userOrType === 'object') {
    const role = userOrType.role?.toUpperCase() || '';
    const userType = userOrType.user_type?.toUpperCase() || '';

    if (userType === 'AGENCY' || role.includes('AGENCY')) {
      return '/agency/dashboard';
    }
    if (userType === 'PERSONAL' || role.includes('LANDOWNER')) {
      return '/personal/dashboard';
    }
    if (userType === 'GOVERNMENT' || role.includes('OFFICER') || role.includes('ADMIN')) {
      if (role.includes('STATE')) {
        return '/government/state/dashboard';
      }
      if (role.includes('CENTRAL')) {
        return '/government/central/dashboard';
      }
      return '/government/district/dashboard';
    }
  }

  // If passed string
  const str = String(userOrType).toUpperCase();
  if (str === 'AGENCY') return '/agency/dashboard';
  if (str === 'PERSONAL') return '/personal/dashboard';
  if (str === 'STATE' || str === 'STATE_OFFICER') return '/government/state/dashboard';
  if (str === 'CENTRAL' || str === 'CENTRAL_OFFICER' || str === 'CENTRAL_ADMIN') return '/government/central/dashboard';
  if (str === 'DISTRICT' || str === 'DISTRICT_OFFICER' || str === 'GOVERNMENT') return '/government/district/dashboard';

  return '/login';
}

export function getLoginForRole(userType: string): string {
  switch (userType) {
    case 'GOVERNMENT': return '/login/government';
    case 'AGENCY':     return '/login/agency';
    case 'PERSONAL':   return '/login/personal';
    default:           return '/login';
  }
}

export function getCurrentAuthState(): { token: string | null; user: ReturnType<typeof getStoredUser> } {
  return {
    token: getAuthToken(),
    user: getStoredUser(),
  };
}

