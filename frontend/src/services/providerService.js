import api from './api';
import { mockStore } from './mockData';

export const providerService = {
  async getProviders(params = {}) {
    try {
      const res = await api.get('/providers', { params });
      const data = res.data?.data || res.data?.items || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    let providers = [...mockStore.getProviders()];
    if (params.status && params.status !== 'all') {
      providers = providers.filter(
        (p) => p.verification_status?.toLowerCase() === params.status.toLowerCase()
      );
    }
    if (params.city && params.city !== 'All Cities') {
      providers = providers.filter((p) => p.city === params.city);
    }
    return providers;
  },

  async getProviderById(id) {
    try {
      const res = await api.get(`/providers/${id}`);
      const data = res.data?.data || res.data;
      if (data && data.id) return data;
    } catch {
      // fallback
    }
    const providers = mockStore.getProviders();
    return providers.find((p) => Number(p.id) === Number(id)) || providers[0];
  },

  async verifyProvider(id) {
    try {
      const res = await api.patch(`/providers/${id}/verify`);
      return res.data?.data || res.data;
    } catch {
      const providers = mockStore.getProviders().map((p) =>
        Number(p.id) === Number(id)
          ? { ...p, verification_status: 'verified', is_verified: true }
          : p
      );
      mockStore.setProviders(providers);
      return providers.find((p) => Number(p.id) === Number(id));
    }
  },

  async rejectProvider(id, reason) {
    try {
      const res = await api.patch(`/providers/${id}/reject`, { reason });
      return res.data?.data || res.data;
    } catch {
      const providers = mockStore.getProviders().map((p) =>
        Number(p.id) === Number(id)
          ? { ...p, verification_status: 'rejected', is_verified: false, rejection_reason: reason }
          : p
      );
      mockStore.setProviders(providers);
      return providers.find((p) => Number(p.id) === Number(id));
    }
  },

  async addProviderService(providerId, serviceData) {
    try {
      const res = await api.post(`/providers/${providerId}/services`, serviceData);
      return res.data?.data || res.data;
    } catch {
      return { success: true };
    }
  },

  async getWorkingHours(providerId) {
    const provider = await this.getProviderById(providerId);
    return provider?.working_hours || [];
  },

  async updateWorkingHours(providerId, workingHours) {
    try {
      const res = await api.put(`/providers/${providerId}/working-hours`, {
        working_hours: workingHours,
      });
      return res.data?.data || res.data;
    } catch {
      const providers = mockStore.getProviders().map((p) =>
        Number(p.id) === Number(providerId) ? { ...p, working_hours: workingHours } : p
      );
      mockStore.setProviders(providers);
      return workingHours;
    }
  },

  async getServiceAreas(providerId) {
    const provider = await this.getProviderById(providerId);
    return provider?.service_areas || [];
  },

  async addServiceArea(providerId, areaPayload) {
    try {
      const res = await api.post(`/providers/${providerId}/areas`, areaPayload);
      return res.data?.data || res.data;
    } catch {
      const providers = mockStore.getProviders();
      const newArea = { id: Date.now(), ...areaPayload };
      const updated = providers.map((p) =>
        Number(p.id) === Number(providerId)
          ? { ...p, service_areas: [...(p.service_areas || []), newArea] }
          : p
      );
      mockStore.setProviders(updated);
      return newArea;
    }
  },

  async removeServiceArea(providerId, areaId) {
    try {
      await api.delete(`/providers/${providerId}/areas/${areaId}`);
      return { success: true };
    } catch {
      const providers = mockStore.getProviders().map((p) =>
        Number(p.id) === Number(providerId)
          ? {
              ...p,
              service_areas: (p.service_areas || []).filter((a) => Number(a.id) !== Number(areaId)),
            }
          : p
      );
      mockStore.setProviders(providers);
      return { success: true };
    }
  },

  async getEarnings(providerId) {
    try {
      const res = await api.get(`/providers/${providerId}/earnings`);
      const data = res.data?.data || res.data;
      if (data && data.summary) return data;
    } catch {
      // fallback
    }
    const bookings = mockStore
      .getBookings()
      .filter((b) => Number(b.provider_id) === Number(providerId || 1));
    const gross = bookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const commission = Number((gross * 0.15).toFixed(2));
    const net = Number((gross - commission).toFixed(2));
    return {
      summary: {
        gross_earnings: gross,
        commission_deducted: commission,
        net_payout: net,
        commission_rate: 15,
      },
      ledger: bookings,
    };
  },
};
