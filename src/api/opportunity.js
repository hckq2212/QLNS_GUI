import api from './apiConfig.js';

// Client-side wrapper for Opportunity endpoints (backend route: /api/opportunity)
const BASE = '/api/opportunity';

const opportunityAPI = {
  async getAll(config = {}) {
    const res = await api.get(`${BASE}`, config);
    return res.data;
  },

  async getAllPending(config = {}) {
    const res = await api.get(`${BASE}/pending`, config);
    return res.data;
  },
 
  async getById(id, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.get(`${BASE}/${id}`, config);
    return res.data;
  },

  async create(payload, config = {}) {
    const res = await api.post(`${BASE}`, payload, config);
    return res.data;
  },

  async update(id, payload, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.patch(`${BASE}/${id}`, payload, config);
    return res.data;
  },

  async remove(id, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.delete(`${BASE}/${id}`, config);
    return res.data;
  },

  async approve(id, paymentPlan = {}, config = {}) {
    if (!id) throw new Error('id required');
    // paymentPlan: { debts: [{amount, due_date}], installments: n }
    const res = await api.post(`${BASE}/${id}/approve`, paymentPlan, config);
    return res.data;
  },

  async reject(id, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.post(`${BASE}/${id}/reject`, {}, config);
    return res.data;
  },

  async submit(id, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.post(`${BASE}/${id}/submit`, {}, config);
    return res.data;
  },

  async getByCreator(userId, config = {}) {
    if (!userId) throw new Error('userId required');
    const res = await api.get(`${BASE}/creator/${userId}`, config);
    return res.data;
  },
    async getService(opportunityId, config = {}) {
    if (!opportunityId) throw new Error('opportunityId required');
    const res = await api.get(`${BASE}/${opportunityId}/services`, config);
    return res.data;
  }
};

export default opportunityAPI;
