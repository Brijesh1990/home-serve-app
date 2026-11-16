import api from './api';
import { INITIAL_ANALYTICS, INITIAL_SUBSCRIPTIONS, mockStore } from './mockData';

export const analyticsService = {
  async getDashboardAnalytics() {
    try {
      const res = await api.get('/analytics/overview');
      const data = res.data?.data || res.data;
      if (data && data.kpis) return data;
    } catch {
      // fallback
    }
    const bookings = mockStore.getBookings();
    const providers = mockStore.getProviders();
    const technicians = mockStore.getTechnicians();
    const users = mockStore.getUsers();
    const coupons = mockStore.getCoupons();

    const totalRev = bookings.reduce((s, b) => s + Number(b.total_amount || 0), 0);
    const dynamicKpis = {
      ...INITIAL_ANALYTICS.kpis,
      total_customers: Math.max(INITIAL_ANALYTICS.kpis.total_customers, users.filter((u) => u.role === 'customer').length),
      total_providers: Math.max(INITIAL_ANALYTICS.kpis.total_providers, providers.length),
      total_technicians: Math.max(INITIAL_ANALYTICS.kpis.total_technicians, technicians.length),
      total_bookings: INITIAL_ANALYTICS.kpis.total_bookings + bookings.length,
      pending_bookings: bookings.filter((b) => b.status === 'Pending').length + 18,
      completed_bookings: INITIAL_ANALYTICS.kpis.completed_bookings + bookings.filter((b) => b.status === 'Completed').length,
      cancelled_bookings: INITIAL_ANALYTICS.kpis.cancelled_bookings + bookings.filter((b) => b.status === 'Cancelled').length,
      total_revenue: Math.round(INITIAL_ANALYTICS.kpis.total_revenue + totalRev),
      platform_commission: Math.round((INITIAL_ANALYTICS.kpis.total_revenue + totalRev) * 0.15),
      active_coupons: coupons.length,
    };

    return {
      ...INITIAL_ANALYTICS,
      kpis: dynamicKpis,
    };
  },

  async exportBookingsCSV() {
    try {
      const res = await api.get('/reports/bookings/export');
      if (typeof res.data === 'string' && res.data.includes(',')) return res.data;
    } catch {
      // fallback
    }
    const bookings = mockStore.getBookings();
    return bookings.map((b) => ({
      Booking_Reference: b.booking_reference,
      Customer: b.customer_name,
      Service: b.service_name,
      Provider: b.provider_name,
      Technician: b.technician_name || 'Unassigned',
      Date: b.scheduled_date,
      Time_Slot: b.time_slot,
      Status: b.status,
      Payment_Status: b.payment_status,
      Base_INR: b.base_amount,
      Discount_INR: b.discount_amount,
      GST_18_INR: b.tax_amount,
      Total_INR: b.total_amount,
      Platform_Commission_15_INR: b.commission_amount,
      Provider_Net_85_INR: b.provider_payout,
    }));
  },

  async exportRevenueCSV() {
    try {
      const res = await api.get('/reports/revenue/export');
      if (typeof res.data === 'string' && res.data.includes(',')) return res.data;
    } catch {
      // fallback
    }
    return INITIAL_ANALYTICS.monthly_trends.map((m) => ({
      Month: `2026-${m.month}`,
      Bookings_Count: m.bookings,
      Gross_Revenue_INR: m.revenue,
      Platform_Commission_15_INR: m.commission,
      Provider_Net_Payout_INR: m.revenue - m.commission,
      New_Customers: m.customers,
    }));
  },

  async getCoupons() {
    try {
      const res = await api.get('/coupons');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    return mockStore.getCoupons();
  },

  async createCoupon(payload) {
    try {
      const res = await api.post('/coupons', payload);
      return res.data?.data || res.data;
    } catch {
      const coupons = mockStore.getCoupons();
      const created = {
        id: Date.now(),
        code: payload.code.toUpperCase(),
        description:
          payload.description ||
          `${payload.discount_type === 'percentage' ? `${payload.discount_value}%` : `₹${payload.discount_value}`} OFF on orders above ₹${payload.min_order_amount}`,
        discount_type: payload.discount_type,
        discount_value: Number(payload.discount_value),
        min_order_amount: Number(payload.min_order_amount || 0),
        max_discount: Number(payload.max_discount || payload.discount_value),
        valid_until: payload.valid_until,
        usage_count: 0,
        status: 'active',
      };
      mockStore.setCoupons([created, ...coupons]);
      return created;
    }
  },

  async deleteCoupon(id) {
    try {
      await api.delete(`/coupons/${id}`);
      return { success: true };
    } catch {
      const coupons = mockStore.getCoupons().filter((c) => Number(c.id) !== Number(id));
      mockStore.setCoupons(coupons);
      return { success: true };
    }
  },

  async getComplaints() {
    try {
      const res = await api.get('/complaints');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    return mockStore.getComplaints();
  },

  async createComplaint(payload) {
    try {
      const res = await api.post('/complaints', payload);
      return res.data?.data || res.data;
    } catch {
      const complaints = mockStore.getComplaints();
      const user = JSON.parse(localStorage.getItem('homeserve_user') || '{}');
      const created = {
        id: Date.now(),
        ticket_number: `HS-TKT-${Math.floor(100 + Math.random() * 900)}`,
        booking_reference: payload.booking_reference || payload.booking_id || 'HS-BK-2026-1001',
        user_id: user.id || 2,
        user_name: user.full_name || 'Aarav Sharma',
        user_role: user.role || 'customer',
        subject: payload.subject,
        description: payload.description,
        priority: payload.priority || 'Medium',
        status: 'Open',
        admin_resolution: '',
        created_at: new Date().toISOString().split('T')[0],
      };
      mockStore.setComplaints([created, ...complaints]);
      return created;
    }
  },

  async resolveComplaint(id, admin_resolution) {
    try {
      const res = await api.patch(`/complaints/${id}/resolve`, { admin_resolution });
      return res.data?.data || res.data;
    } catch {
      const complaints = mockStore.getComplaints().map((c) =>
        Number(c.id) === Number(id) ? { ...c, status: 'Resolved', admin_resolution } : c
      );
      mockStore.setComplaints(complaints);
      return complaints.find((c) => Number(c.id) === Number(id));
    }
  },

  async getReviews() {
    try {
      const res = await api.get('/reviews');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    return mockStore.getReviews();
  },

  async createReview(payload) {
    try {
      const res = await api.post('/reviews', payload);
      return res.data?.data || res.data;
    } catch {
      const reviews = mockStore.getReviews();
      const user = JSON.parse(localStorage.getItem('homeserve_user') || '{}');
      const created = {
        id: Date.now(),
        booking_id: payload.booking_id,
        booking_reference: payload.booking_reference || 'HS-BK-2026-1001',
        service_id: payload.service_id || 1,
        service_name: payload.service_name || 'Home Service',
        provider_id: payload.provider_id || 1,
        provider_name: payload.provider_name || 'Apex Home Solutions Pvt Ltd',
        customer_id: user.id || 2,
        customer_name: user.full_name || 'Aarav Sharma',
        rating: Number(payload.rating),
        comment: payload.comment,
        provider_response: '',
        moderation_status: 'approved',
        created_at: new Date().toISOString().split('T')[0],
      };
      mockStore.setReviews([created, ...reviews]);
      if (payload.booking_id) {
        const bookings = mockStore.getBookings().map((b) =>
          Number(b.id) === Number(payload.booking_id) ? { ...b, is_reviewed: true } : b
        );
        mockStore.setBookings(bookings);
      }
      return created;
    }
  },

  async moderateReview(id, moderation_status) {
    try {
      const res = await api.patch(`/reviews/${id}/moderate`, { moderation_status });
      return res.data?.data || res.data;
    } catch {
      const reviews = mockStore.getReviews().map((r) =>
        Number(r.id) === Number(id) ? { ...r, moderation_status } : r
      );
      mockStore.setReviews(reviews);
      return reviews.find((r) => Number(r.id) === Number(id));
    }
  },

  async respondToReview(id, provider_response) {
    try {
      const res = await api.patch(`/reviews/${id}/respond`, { provider_response });
      return res.data?.data || res.data;
    } catch {
      const reviews = mockStore.getReviews().map((r) =>
        Number(r.id) === Number(id) ? { ...r, provider_response } : r
      );
      mockStore.setReviews(reviews);
      return reviews.find((r) => Number(r.id) === Number(id));
    }
  },

  async getSubscriptions() {
    try {
      const res = await api.get('/subscriptions');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    return INITIAL_SUBSCRIPTIONS;
  },

  async getUsers() {
    try {
      const res = await api.get('/users');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    return mockStore.getUsers();
  },

  async toggleUserStatus(userId, status) {
    try {
      const res = await api.patch(`/users/${userId}/status`, { status });
      return res.data?.data || res.data;
    } catch {
      const users = mockStore.getUsers().map((u) =>
        Number(u.id) === Number(userId)
          ? { ...u, status, is_active: status === 'active' }
          : u
      );
      mockStore.setUsers(users);
      return users.find((u) => Number(u.id) === Number(userId));
    }
  },
};
