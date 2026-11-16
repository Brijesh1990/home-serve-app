import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { authService } from '../services/authService';
import { setCredentials, clearCredentials } from '../store';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('homeserve_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('homeserve_access_token');
    if (token && user) {
      dispatch(setCredentials({ user, access_token: token }));
    }
  }, [dispatch, user]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const result = await authService.login(credentials);
      setUser(result.user);
      dispatch(setCredentials(result));
      return result.user;
    } finally {
      setLoading(false);
    }
  };

  const registerCustomer = async (data) => {
    setLoading(true);
    try {
      const result = await authService.registerCustomer(data);
      const u = result.user || result;
      setUser(u);
      dispatch(setCredentials({ user: u, access_token: result.access_token }));
      return u;
    } finally {
      setLoading(false);
    }
  };

  const registerProvider = async (data) => {
    setLoading(true);
    try {
      const result = await authService.registerProvider(data);
      const u = result.user || result;
      setUser(u);
      dispatch(setCredentials({ user: u, access_token: result.access_token }));
      return u;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    const updated = await authService.updateProfile(data);
    setUser(updated);
    return updated;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    dispatch(clearCredentials());
  };

  const getRoleDashboardPath = (roleName = user?.role) => {
    switch ((roleName || '').toLowerCase()) {
      case 'admin':
        return '/admin/dashboard';
      case 'provider':
        return '/provider/dashboard';
      case 'technician':
        return '/technician/dashboard';
      default:
        return '/customer/dashboard';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        login,
        registerCustomer,
        registerProvider,
        updateProfile,
        logout,
        getRoleDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
