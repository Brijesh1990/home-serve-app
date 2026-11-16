import api from './api';
import { mockStore } from './mockData';

export const bookingService = {
  async getBookings(params = {}) {
    try {
      const res = await api.get('/bookings', { params });
      const data = res.data?.data || res.data?.items || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    let bookings = [...mockStore.getBookings()];
    if (params.customer_id) {
      bookings = bookings.filter((b) => Number(b.customer_id) === Number(params.customer_id));
    }
    if (params.provider_id) {
      bookings = bookings.filter((b) => Number(b.provider_id) === Number(params.provider_id));
    }
    if (params.technician_id) {
      bookings = bookings.filter((b) => Number(b.technician_id) === Number(params.technician_id));
    }
    if (params.status && params.status !== 'all') {
      bookings = bookings.filter((b) => b.status.toLowerCase() === params.status.toLowerCase());
    }
    return bookings;
  },

  async checkAvailability({ provider_id, scheduled_date, time_slot }) {
    try {
      const res = await api.get('/availability/check', {
        params: { provider_id, scheduled_date, time_slot },
      });
      return res.data?.data || res.data;
    } catch {
      const bookings = mockStore.getBookings();
      const conflict = bookings.find(
        (b) =>
          Number(b.provider_id) === Number(provider_id) &&
          b.scheduled_date === scheduled_date &&
          b.time_slot === time_slot &&
          !['Cancelled', 'Rejected'].includes(b.status)
      );
      return {
        available: !conflict,
        message: conflict
          ? 'This slot is already reserved for the selected provider. Please pick another time slot.'
          : 'Slot is available for instant confirmation!',
      };
    }
  },

  async validateCoupon(code, orderAmount) {
    try {
      const res = await api.post('/coupons/validate', {
        code: code.toUpperCase(),
        order_amount: orderAmount,
      });
      return res.data?.data || res.data;
    } catch {
      const coupons = mockStore.getCoupons();
      const found = coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
      if (!found) {
        throw new Error('Invalid coupon code. Try WELCOME20, SUMMER15, or HOME250.');
      }
      if (Number(orderAmount) < Number(found.min_order_amount)) {
        throw new Error(`Minimum order value of ₹${found.min_order_amount} required for ${found.code}.`);
      }
      let discount =
        found.discount_type === 'percentage'
          ? Math.round((Number(orderAmount) * Number(found.discount_value)) / 100)
          : Number(found.discount_value);
      if (found.max_discount && discount > Number(found.max_discount)) {
        discount = Number(found.max_discount);
      }
      return {
        valid: true,
        coupon: found,
        discount_amount: discount,
        message: `Coupon ${found.code} applied! You saved ₹${discount}.`,
      };
    }
  },

  async createBooking(payload) {
    try {
      const res = await api.post('/bookings', payload);
      const data = res.data?.data || res.data;
      if (data && data.id) return data;
    } catch {
      // fallback
    }
    const bookings = mockStore.getBookings();
    const services = mockStore.getServices();
    const providers = mockStore.getProviders();
    const user = JSON.parse(localStorage.getItem('homeserve_user') || '{}');

    const service = services.find((s) => Number(s.id) === Number(payload.service_id)) || services[0];
    const provider = providers.find((p) => Number(p.id) === Number(payload.provider_id)) || providers[0];

    const baseAmount = Number(payload.base_amount || service.discount_price || service.base_price);
    const discountAmount = Number(payload.discount_amount || 0);
    const taxable = Math.max(0, baseAmount - discountAmount);
    const taxAmount = Number((taxable * 0.18).toFixed(2));
    const totalAmount = Number((taxable + taxAmount).toFixed(2));
    const commissionAmount = Number((totalAmount * 0.15).toFixed(2));
    const providerPayout = Number((totalAmount - commissionAmount).toFixed(2));

    const newBooking = {
      id: Date.now(),
      booking_reference: `HS-BK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_id: user.id || 2,
      customer_name: user.full_name || 'Aarav Sharma',
      customer_email: user.email || 'customer@homeserve.com',
      customer_phone: user.phone || '+91 98765 43210',
      service_id: service.id,
      service_name: service.name,
      category_name: service.category_name,
      provider_id: provider.id,
      provider_name: provider.business_name,
      technician_id: null,
      technician_name: null,
      assignment_id: null,
      assignment_status: 'Unassigned',
      scheduled_date: payload.scheduled_date,
      time_slot: payload.time_slot,
      address_line: payload.address_line,
      city: payload.city || 'Mumbai',
      postal_code: payload.postal_code || '400053',
      problem_description: payload.problem_description,
      reference_image_url: payload.reference_image_url || '',
      status: payload.payment_status === 'Paid' ? 'Confirmed' : 'Pending',
      payment_status: payload.payment_status || 'Pending',
      payment_method: payload.payment_method || 'razorpay',
      razorpay_order_id: payload.razorpay_order_id || null,
      razorpay_payment_id: payload.razorpay_payment_id || null,
      base_amount: baseAmount,
      discount_amount: discountAmount,
      coupon_code: payload.coupon_code || '',
      tax_amount: taxAmount,
      total_amount: totalAmount,
      commission_amount: commissionAmount,
      provider_payout: providerPayout,
      is_reviewed: false,
      created_at: new Date().toISOString(),
    };

    mockStore.setBookings([newBooking, ...bookings]);
    return newBooking;
  },

  async updateBookingStatus(bookingId, status) {
    try {
      const res = await api.patch(`/bookings/${bookingId}/status`, { status });
      return res.data?.data || res.data;
    } catch {
      const bookings = mockStore.getBookings().map((b) =>
        Number(b.id) === Number(bookingId) ? { ...b, status } : b
      );
      mockStore.setBookings(bookings);
      return bookings.find((b) => Number(b.id) === Number(bookingId));
    }
  },

  async rescheduleBooking(bookingId, { scheduled_date, time_slot }) {
    try {
      const res = await api.post(`/bookings/${bookingId}/reschedule`, {
        scheduled_date,
        time_slot,
      });
      return res.data?.data || res.data;
    } catch {
      const bookings = mockStore.getBookings().map((b) =>
        Number(b.id) === Number(bookingId) ? { ...b, scheduled_date, time_slot } : b
      );
      mockStore.setBookings(bookings);
      return bookings.find((b) => Number(b.id) === Number(bookingId));
    }
  },

  async cancelBooking(bookingId, reason = 'Cancelled by user') {
    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`, { reason });
      return res.data?.data || res.data;
    } catch {
      const bookings = mockStore.getBookings().map((b) =>
        Number(b.id) === Number(bookingId)
          ? { ...b, status: 'Cancelled', cancellation_reason: reason }
          : b
      );
      mockStore.setBookings(bookings);
      return bookings.find((b) => Number(b.id) === Number(bookingId));
    }
  },

  async assignTechnician(bookingId, technicianId) {
    try {
      const res = await api.post('/assignments', {
        booking_id: bookingId,
        technician_id: technicianId,
      });
      return res.data?.data || res.data;
    } catch {
      const technicians = mockStore.getTechnicians();
      const tech = technicians.find((t) => Number(t.id) === Number(technicianId)) || technicians[0];
      const bookings = mockStore.getBookings().map((b) =>
        Number(b.id) === Number(bookingId)
          ? {
              ...b,
              technician_id: tech.id,
              technician_name: tech.full_name,
              technician_phone: tech.phone,
              assignment_id: Date.now(),
              assignment_status: 'Assigned',
              status: 'Assigned',
            }
          : b
      );
      mockStore.setBookings(bookings);
      return bookings.find((b) => Number(b.id) === Number(bookingId));
    }
  },

  async uploadServiceImages(bookingId, { before_image_url, after_image_url, completion_remarks }) {
    try {
      const res = await api.post(`/bookings/${bookingId}/images`, {
        before_image_url,
        after_image_url,
        completion_remarks,
      });
      return res.data?.data || res.data;
    } catch {
      const bookings = mockStore.getBookings().map((b) =>
        Number(b.id) === Number(bookingId)
          ? {
              ...b,
              before_image_url: before_image_url || b.before_image_url,
              after_image_url: after_image_url || b.after_image_url,
              completion_remarks: completion_remarks || b.completion_remarks,
            }
          : b
      );
      mockStore.setBookings(bookings);
      return bookings.find((b) => Number(b.id) === Number(bookingId));
    }
  },
};
