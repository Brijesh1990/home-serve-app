import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, getRoleDashboardPath } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = (user.role || 'customer').toLowerCase();
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.map((r) => r.toLowerCase()).includes(userRole)
  ) {
    return <Navigate to={getRoleDashboardPath(userRole)} replace />;
  }

  return children;
};

export default ProtectedRoute;
