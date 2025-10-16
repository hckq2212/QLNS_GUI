import api from './apiConfig.js';

// Client-side wrapper for Opportunity endpoints (backend route: /api/opportunity)
const BASE = '/api/debt';

const debtAPI = {
  async getAll(config = {}) {
    const res = await api.get(`${BASE}`, config);
    return res.data;
  },
  async createForContract(contractId, payload = {}, config = {}) {
    if (!contractId) throw new Error('contractId required');
    const res = await api.post(`${BASE}/${contractId}`, payload, config);
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

  
};

export default debtAPI;
