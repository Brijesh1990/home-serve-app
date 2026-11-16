import api from './api';
import { mockStore } from './mockData';

export const notificationService = {
  async getNotifications() {
    try {
      const res = await api.get('/notifications');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    return mockStore.getNotifications();
  },

  async markAsRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // fallback
    }
    const updated = mockStore.getNotifications().map((n) =>
      Number(n.id) === Number(id) ? { ...n, is_read: true } : n
    );
    mockStore.setNotifications(updated);
    return updated;
  },

  async markAllAsRead() {
    const updated = mockStore.getNotifications().map((n) => ({ ...n, is_read: true }));
    mockStore.setNotifications(updated);
    return updated;
  },

  async sendAnnouncement(payload) {
    try {
      const res = await api.post('/notifications/announce', payload);
      return res.data?.data || res.data;
    } catch {
      const list = mockStore.getNotifications();
      const created = {
        id: Date.now(),
        title: payload.title,
        message: payload.message,
        target_role: payload.target_role || 'all',
        type: 'announcement',
        is_read: false,
        created_at: 'Just now',
      };
      mockStore.setNotifications([created, ...list]);
      return created;
    }
  },
};
