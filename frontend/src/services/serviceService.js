import api from './api';
import { mockStore } from './mockData';

export const serviceService = {
  async getCategories() {
    try {
      const res = await api.get('/categories');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
      return mockStore.getCategories();
    } catch {
      return mockStore.getCategories();
    }
  },

  async createCategory(payload) {
    try {
      const res = await api.post('/categories', payload);
      return res.data?.data || res.data;
    } catch {
      const categories = mockStore.getCategories();
      const created = {
        id: Date.now(),
        name: payload.name,
        slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: payload.icon || 'Sparkles',
        description: payload.description || 'Verified professional home service category',
        service_count: Number(payload.service_count || 5),
        starting_price: Number(payload.starting_price || 299),
        color: 'from-blue-500 to-indigo-600',
        image:
          payload.image ||
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
      };
      mockStore.setCategories([...categories, created]);
      return created;
    }
  },

  async updateCategory(id, payload) {
    try {
      const res = await api.put(`/categories/${id}`, payload);
      return res.data?.data || res.data;
    } catch {
      const categories = mockStore.getCategories();
      const updated = categories.map((c) => (Number(c.id) === Number(id) ? { ...c, ...payload } : c));
      mockStore.setCategories(updated);
      return updated.find((c) => Number(c.id) === Number(id));
    }
  },

  async deleteCategory(id) {
    try {
      await api.delete(`/categories/${id}`);
      return { success: true };
    } catch {
      const categories = mockStore.getCategories().filter((c) => Number(c.id) !== Number(id));
      mockStore.setCategories(categories);
      return { success: true };
    }
  },

  async getServices(params = {}) {
    try {
      const res = await api.get('/services', { params });
      const data = res.data?.data || res.data?.items || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
      return this.filterLocalServices(params);
    } catch {
      return this.filterLocalServices(params);
    }
  },

  filterLocalServices(params = {}) {
    let list = [...mockStore.getServices()];
    if (params.category_id && Number(params.category_id) > 0) {
      list = list.filter((s) => Number(s.category_id) === Number(params.category_id));
    }
    if (params.category && params.category !== 'All') {
      list = list.filter(
        (s) =>
          s.category_name?.toLowerCase() === params.category.toLowerCase() ||
          s.slug?.includes(params.category.toLowerCase())
      );
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.category_name?.toLowerCase().includes(q)
      );
    }
    if (params.city && params.city !== 'All Cities') {
      list = list.filter((s) => !s.city || s.city === params.city || s.city === 'Mumbai');
    }
    if (params.max_price) {
      list = list.filter((s) => Number(s.discount_price || s.base_price) <= Number(params.max_price));
    }
    if (params.min_rating) {
      list = list.filter((s) => Number(s.rating || 4.5) >= Number(params.min_rating));
    }
    if (params.sort === 'price_asc') {
      list.sort((a, b) => (a.discount_price || a.base_price) - (b.discount_price || b.base_price));
    } else if (params.sort === 'price_desc') {
      list.sort((a, b) => (b.discount_price || b.base_price) - (a.discount_price || a.base_price));
    } else if (params.sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  },

  async getServiceById(id) {
    try {
      const res = await api.get(`/services/${id}`);
      const data = res.data?.data || res.data;
      if (data && data.id) return data;
    } catch {
      // fallback
    }
    const services = mockStore.getServices();
    return services.find((s) => Number(s.id) === Number(id)) || services[0];
  },

  async createService(payload) {
    try {
      const res = await api.post('/services', payload);
      return res.data?.data || res.data;
    } catch {
      const services = mockStore.getServices();
      const categories = mockStore.getCategories();
      const cat = categories.find((c) => Number(c.id) === Number(payload.category_id)) || categories[0];
      const created = {
        id: Date.now(),
        name: payload.name,
        slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category_id: Number(payload.category_id || 1),
        category_name: cat?.name || 'Home Service',
        base_price: Number(payload.base_price),
        discount_price: Number(payload.discount_price || payload.base_price),
        duration_minutes: Number(payload.duration_minutes || 60),
        rating: 4.8,
        reviews_count: 12,
        is_featured: true,
        city: payload.city || 'Mumbai',
        image:
          payload.image ||
          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
        description: payload.description,
        inclusions: ['Complete inspection & professional execution', '30-day warranty'],
        exclusions: ['Spare parts charged at MRP'],
      };
      mockStore.setServices([created, ...services]);
      return created;
    }
  },

  async updateService(id, payload) {
    try {
      const res = await api.put(`/services/${id}`, payload);
      return res.data?.data || res.data;
    } catch {
      const services = mockStore.getServices();
      const updated = services.map((s) => (Number(s.id) === Number(id) ? { ...s, ...payload } : s));
      mockStore.setServices(updated);
      return updated.find((s) => Number(s.id) === Number(id));
    }
  },

  async deleteService(id) {
    try {
      await api.delete(`/services/${id}`);
      return { success: true };
    } catch {
      const services = mockStore.getServices().filter((s) => Number(s.id) !== Number(id));
      mockStore.setServices(services);
      return { success: true };
    }
  },
};
