import api from './apiConfig.js';

// Client-side wrapper for ServiceJob endpoints (backend route: /api/service-job)
const BASE = '/api/service-job';

const serviceJobAPI = {
  async getAll(config = {}) {
    const res = await api.get(`${BASE}`, config);
    return res.data;
  },
  async getById(id, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.get(`${BASE}/${id}`, config);
    return res.data;
  },
  async getByServiceId(serviceId, config = {}) {
    if (!serviceId) throw new Error('id required');
    const res = await api.get(`${BASE}/${serviceId}`, config);
    return res.data;
  },
};

export default serviceJobAPI;
