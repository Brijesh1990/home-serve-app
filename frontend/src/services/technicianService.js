import api from './api';
import { mockStore } from './mockData';

export const technicianService = {
  async getTechnicians(params = {}) {
    try {
      const res = await api.get('/technicians', { params });
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    let list = [...mockStore.getTechnicians()];
    if (params.provider_id) {
      list = list.filter((t) => Number(t.provider_id) === Number(params.provider_id));
    }
    return list;
  },

  async createTechnician(payload) {
    try {
      const res = await api.post('/technicians', payload);
      return res.data?.data || res.data;
    } catch {
      const list = mockStore.getTechnicians();
      const created = {
        id: Date.now(),
        provider_id: Number(payload.provider_id || 1),
        provider_name: payload.provider_name || 'Apex Home Solutions Pvt Ltd',
        full_name: payload.full_name,
        email: payload.email || `${payload.full_name.toLowerCase().replace(/\s+/g, '.')}@homeserve.com`,
        phone: payload.phone,
        specialization: payload.specialization || 'Multi-Skilled Technician',
        experience_years: Number(payload.experience_years || 4),
        rating: 4.8,
        jobs_completed: 0,
        availability_status: 'Available',
        status: 'active',
        city: payload.city || 'Mumbai',
      };
      mockStore.setTechnicians([created, ...list]);
      return created;
    }
  },

  async updateAssignmentStatus(bookingOrAssignmentId, payload) {
    try {
      const res = await api.patch(`/assignments/${bookingOrAssignmentId}/status`, payload);
      if (res.data?.data) return res.data.data;
    } catch {
      // fallback
    }
    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const bookings = mockStore.getBookings().map((b) => {
      if (
        Number(b.id) === Number(bookingOrAssignmentId) ||
        Number(b.assignment_id) === Number(bookingOrAssignmentId)
      ) {
        const nextStatus = payload.status;
        return {
          ...b,
          assignment_status: nextStatus,
          status: nextStatus === 'Accepted' ? 'Accepted' : nextStatus,
          arrival_time: nextStatus === 'Arrived' ? `Today, ${nowTime}` : b.arrival_time,
          start_time: nextStatus === 'In Progress' ? `Today, ${nowTime}` : b.start_time,
          completion_time: nextStatus === 'Completed' ? `Today, ${nowTime}` : b.completion_time,
          completion_remarks: payload.completion_remarks || b.completion_remarks,
          before_image_url: payload.before_image_url || b.before_image_url,
          after_image_url: payload.after_image_url || b.after_image_url,
          payment_status: nextStatus === 'Completed' ? 'Paid' : b.payment_status,
        };
      }
      return b;
    });
    mockStore.setBookings(bookings);
    return bookings.find(
      (b) =>
        Number(b.id) === Number(bookingOrAssignmentId) ||
        Number(b.assignment_id) === Number(bookingOrAssignmentId)
    );
  },
};
