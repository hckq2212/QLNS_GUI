import api from './apiConfig';

const BASE = '/api/team';

const teamAPI = {
  async getAll(params = {}) {
    const res = await api.get(BASE, { params });
    return res.data;
  },
  async getById(id, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.get(`${BASE}/${id}`, config);
    return res.data;
  },
};

export default teamAPI;
