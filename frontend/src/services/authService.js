import api from './api';
import { mockStore } from './mockData';

export const authService = {
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      const payload = response.data?.data || response.data;
      const user = payload.user || payload;
      const accessToken = payload.access_token || `hs_jwt_${Date.now()}`;
      const refreshToken = payload.refresh_token || `hs_refresh_${Date.now()}`;
      localStorage.setItem('homeserve_access_token', accessToken);
      localStorage.setItem('homeserve_refresh_token', refreshToken);
      localStorage.setItem('homeserve_user', JSON.stringify(user));
      return { user, access_token: accessToken, refresh_token: refreshToken };
    } catch {
      const users = mockStore.getUsers();
      const found = users.find(
        (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
      );
      if (found) {
        const accessToken = `hs_demo_jwt_${found.role}_${Date.now()}`;
        const refreshToken = `hs_demo_refresh_${found.role}_${Date.now()}`;
        localStorage.setItem('homeserve_access_token', accessToken);
        localStorage.setItem('homeserve_refresh_token', refreshToken);
        localStorage.setItem('homeserve_user', JSON.stringify(found));
        return { user: found, access_token: accessToken, refresh_token: refreshToken };
      }
      throw new Error('Invalid email or password. Try one of the 1-Click Demo Role buttons!');
    }
  },

  async registerCustomer(data) {
    try {
      const response = await api.post('/auth/register', { ...data, role: 'customer' });
      return response.data?.data || response.data;
    } catch {
      const users = mockStore.getUsers();
      const newUser = {
        id: Date.now(),
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        role: 'customer',
        status: 'active',
        is_active: true,
        created_at: new Date().toISOString().split('T')[0],
        bookings_count: 0,
      };
      mockStore.setUsers([...users, newUser]);
      const accessToken = `hs_demo_jwt_customer_${Date.now()}`;
      localStorage.setItem('homeserve_access_token', accessToken);
      localStorage.setItem('homeserve_user', JSON.stringify(newUser));
      return { user: newUser, access_token: accessToken };
    }
  },

  async registerProvider(data) {
    try {
      const response = await api.post('/auth/register/provider', { ...data, role: 'provider' });
      return response.data?.data || response.data;
    } catch {
      const providers = mockStore.getProviders();
      const users = mockStore.getUsers();
      const newProviderId = providers.length + 1;
      const newUser = {
        id: Date.now(),
        full_name: data.full_name,
        business_name: data.business_name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        role: 'provider',
        provider_id: newProviderId,
        status: 'active',
        is_active: true,
        created_at: new Date().toISOString().split('T')[0],
      };
      const newProvider = {
        id: newProviderId,
        user_id: newUser.id,
        business_name: data.business_name,
        owner_name: data.full_name,
        email: data.email,
        phone: data.phone,
        category: data.category,
        specialization: data.category,
        city: data.city,
        experience_years: Number(data.experience_years || 3),
        license_number: data.license_number,
        verification_status: 'pending',
        is_verified: false,
        rating: 4.8,
        reviews_count: 1,
        completed_jobs: 0,
        commission_rate: 15,
        subscription_plan: 'Starter',
        service_ids: [1, 3],
        service_areas: [
          { id: Date.now(), city: data.city, area_name: `${data.city} Central`, postal_code: '400001' },
        ],
        working_hours: [],
      };
      mockStore.setUsers([...users, newUser]);
      mockStore.setProviders([newProvider, ...providers]);
      const accessToken = `hs_demo_jwt_provider_${Date.now()}`;
      localStorage.setItem('homeserve_access_token', accessToken);
      localStorage.setItem('homeserve_user', JSON.stringify(newUser));
      return { user: newUser, provider: newProvider, access_token: accessToken };
    }
  },

  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch {
      return {
        success: true,
        message: `Password reset token sent to ${email}. Use demo token: HS-RESET-2026`,
        reset_token: 'HS-RESET-2026',
      };
    }
  },

  async resetPassword(payload) {
    try {
      const response = await api.post('/auth/reset-password', payload);
      return response.data;
    } catch {
      return {
        success: true,
        message: 'Your password has been successfully updated. You can now sign in.',
      };
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put('/users/profile', profileData);
      const updated = response.data?.data || response.data;
      localStorage.setItem('homeserve_user', JSON.stringify(updated));
      return updated;
    } catch {
      const stored = JSON.parse(localStorage.getItem('homeserve_user') || '{}');
      const updated = { ...stored, ...profileData };
      localStorage.setItem('homeserve_user', JSON.stringify(updated));
      return updated;
    }
  },

  logout() {
    localStorage.removeItem('homeserve_access_token');
    localStorage.removeItem('homeserve_refresh_token');
    localStorage.removeItem('homeserve_user');
  },
};
