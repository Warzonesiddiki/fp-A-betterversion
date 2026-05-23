import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, hasPermission, isRole } from '@/store/authStore';
import type { Role, User } from '@/types';

// Role hierarchy for privilege comparison
const ROLE_HIERARCHY: Role[] = ['Viewer', 'Department_Head', 'Analyst', 'FP&A_Manager', 'Admin'];

/**
 * Check if candidate role has at least the privilege level of required role.
 */
export function hasMinimumRole(candidate: Role, required: Role): boolean {
  return ROLE_HIERARCHY.indexOf(candidate) >= ROLE_HIERARCHY.indexOf(required);
}

/**
 * Check if user's role is in the allowedRoles list.
 */
export function hasAllowedRole(user: User | null, ...allowedRoles: Role[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required permission string (e.g. 'budget:write') */
  permission?: string;
  /** Required role(s) — user must have at least one */
  roles?: Role[];
  /** If true, redirect to login instead of showing unauthorized */
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  permission,
  roles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Not authenticated — redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (roles && roles.length > 0 && !isRole(user, ...roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
          <p className="text-slate-400">You don&apos;t have permission to access this page.</p>
          <p className="text-sm text-slate-500">
            Required role: {roles.join(' or ')}
            <br />
            Your role: {user?.role ?? 'None'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Permission check
  if (permission && !hasPermission(user, permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
          <p className="text-slate-400">You don&apos;t have the required permission.</p>
          <p className="text-sm text-slate-500">
            Required: <code className="text-blue-400">{permission}</code>
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
