import api from './apiConfig.js';

const BASE = '/api/user';

const userAPI = {
  async getAll(config = {}) {
    const res = await api.get(`${BASE}`, config);
    return res.data;
  },
  async getById(id, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.get(`${BASE}/${id}`, config);
    return res.data;
  },
  // Fetch current authenticated user's profile (avatar, full_name, etc.)
  // This calls GET /api/user/me and does not require an id parameter.
  async getPersonalInfo(config = {}) {
    const res = await api.get(`${BASE}/me`, config);
    return res.data;
  },
};

export default userAPI;
