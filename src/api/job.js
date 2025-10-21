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
  async assign(id, assignedType, assignedId, config = {}) {
    if (!id) throw new Error('id required');
    // try a dedicated assign endpoint first
    try {
      const res = await api.patch(`${BASE}/${id}/assign`, { assigned_type: assignedType, assigned_id: assignedId }, config);
      return res.data;
    } catch (e) {
      // fallback to generic update
      const res = await api.patch(`${BASE}/${id}`, { assigned_type: assignedType, assigned_id: assignedId }, config);
      return res.data;
    }
  }
};

export default jobAPI;
