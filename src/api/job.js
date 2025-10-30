import api from './apiConfig';

const BASE = '/api/job';

const jobAPI = {
  async getById(id, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.get(`${BASE}/${id}`, config);
    return res.data;
  },
  async update(id, payload = {}, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.patch(`${BASE}/${id}`, payload, config);
    return res.data;
  },
  async getByProject(projectId, config = {}) {
    if (!projectId) throw new Error('projectId required');
    const res = await api.get(`${BASE}/project/${projectId}`, config);
    return res.data;
  },

  // assign with a full payload object (keeps compatibility with server's /:id/assign route)
  async assign(id, payload = {}, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.patch(`${BASE}/${id}/assign`, payload, config);
    return res.data;
  }
};

export default jobAPI;
