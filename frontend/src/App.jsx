import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/layouts/PublicLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Public Pages
import HomePage from './pages/public/HomePage';
import ServicesListingPage from './pages/public/ServicesListingPage';
import ServiceDetailsPage from './pages/public/ServiceDetailsPage';
import ProviderDetailsPage from './pages/public/ProviderDetailsPage';
import BookingCheckoutPage from './pages/public/BookingCheckoutPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Role Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';

export const App = () => {
  return (
    <Routes>
      {/* Public Website & Auth Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesListingPage />} />
        <Route path="/services/:id" element={<ServiceDetailsPage />} />
        <Route path="/providers/:id" element={<ProviderDetailsPage />} />
        <Route path="/checkout" element={<BookingCheckoutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Role-Based Protected SaaS Dashboards */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['customer', 'admin']}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/dashboard"
        element={
          <ProtectedRoute allowedRoles={['provider', 'admin']}>
            <ProviderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician/dashboard"
        element={
          <ProtectedRoute allowedRoles={['technician', 'admin']}>
            <TechnicianDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
