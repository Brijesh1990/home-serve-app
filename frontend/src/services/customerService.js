import api from './api';
import { mockStore } from './mockData';

export const customerService = {
  async getAddresses() {
    try {
      const res = await api.get('/customers/me/addresses');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    return mockStore.getAddresses();
  },

  async addAddress(payload) {
    try {
      const res = await api.post('/customers/me/addresses', payload);
      return res.data?.data || res.data;
    } catch {
      const addresses = mockStore.getAddresses();
      const created = {
        id: Date.now(),
        label: payload.label || 'Home',
        recipient_name: payload.recipient_name || 'Aarav Sharma',
        phone: payload.phone || '+91 98765 43210',
        address_line: payload.address_line,
        landmark: payload.landmark || '',
        city: payload.city || 'Mumbai',
        state: payload.state || 'Maharashtra',
        postal_code: payload.postal_code || '400053',
        is_default: addresses.length === 0,
      };
      mockStore.setAddresses([...addresses, created]);
      return created;
    }
  },

  async updateAddress(id, payload) {
    try {
      const res = await api.put(`/customers/me/addresses/${id}`, payload);
      return res.data?.data || res.data;
    } catch {
      const addresses = mockStore.getAddresses().map((a) =>
        Number(a.id) === Number(id) ? { ...a, ...payload } : a
      );
      mockStore.setAddresses(addresses);
      return addresses.find((a) => Number(a.id) === Number(id));
    }
  },

  async deleteAddress(id) {
    try {
      await api.delete(`/customers/me/addresses/${id}`);
      return { success: true };
    } catch {
      const addresses = mockStore.getAddresses().filter((a) => Number(a.id) !== Number(id));
      mockStore.setAddresses(addresses);
      return { success: true };
    }
  },

  async getFavorites() {
    try {
      const res = await api.get('/customers/me/favorites');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    const favIds = mockStore.getFavorites();
    const providers = mockStore.getProviders();
    return providers.filter((p) => favIds.includes(Number(p.id)));
  },

  async toggleFavorite(providerId) {
    const id = Number(providerId);
    const favIds = mockStore.getFavorites();
    const exists = favIds.includes(id);
    try {
      if (exists) {
        await api.delete(`/customers/me/favorites/${id}`);
      } else {
        await api.post('/customers/me/favorites', { provider_id: id });
      }
    } catch {
      // fallback
    }
    const updated = exists ? favIds.filter((item) => item !== id) : [...favIds, id];
    mockStore.setFavorites(updated);
    return { is_favorite: !exists, favorites: updated };
  },
};
