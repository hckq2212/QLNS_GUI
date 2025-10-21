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
};

export default userAPI;
