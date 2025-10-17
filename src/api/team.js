import api from './apiConfig';

const BASE = '/api/team';

const teamAPI = {
  async getAll(params = {}) {
    const res = await api.get(BASE, { params });
    return res.data;
  },
};

export default teamAPI;
