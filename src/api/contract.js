import api from './apiConfig.js';

const BASE = '/api/contract';

const contractAPI = {
  async getAll(config = {}) {
    const res = await api.get(`${BASE}`, config);
    return res.data;
  },
  async getPending(config = {}) {
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
  async hrConfirm(id, payload = {}, config = {}) {
    const res = await api.patch(`${BASE}/${id}/hr-confirm`, payload, config);
    return res.data;
  },
  async submitToBod(id, payload = {}, config = {}) {
    const res = await api.patch(`${BASE}/${id}/submit-bod`, payload, config);
    return res.data;
  },
  async approve(id, payload = {}, config = {}) {
    const res = await api.patch(`${BASE}/${id}/approve`, payload, config);
    return res.data;
  },
  async sign(id, payload = {}, config = {}) {
    // backend expects POST /api/contract/:id/sign with body { signed_file_url }
    const res = await api.post(`${BASE}/${id}/sign`, payload, config);
    return res.data;
  },
  async deploy(id, payload = {}, config = {}) {
    const res = await api.post(`${BASE}/${id}/deploy`, payload, config);
    return res.data;
  },
  async getServiceUsage(id, config = {}) {
    // Calls backend route that returns per-service usage summary for a contract
    // Expected endpoint: GET /api/contract/:id/services-summary
    if (!id) throw new Error('id required');
    const res = await api.get(`${BASE}/${id}/services`, config);
    return res.data;
  },
  async uploadFile(id, file, type = 'signed') {
    if (!id) throw new Error('id required');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    const res = await api.post(`${BASE}/${id}/files`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  async createFromOpportunity(opportunityId, payload = {}, config = {}) {
    if (!opportunityId) throw new Error('opportunityId required');
    const res = await api.post(`${BASE}/opportunity/${opportunityId}`, payload, config);
    return res.data;
  },
};

export default contractAPI;
