import api from './apiConfig';

const BASE = '/api/project';

const projectAPI = {
  async assignTeam(id, teamId) {
    if (!id) throw new Error('project id required');
    const res = await api.patch(`${BASE}/${id}/assign-team`, { teamId });
    return res.data;
  },
  async getById(id, config = {}) {
    if (!id) throw new Error('project id required');
    const res = await api.get(`${BASE}/${id}`, config);
    return res.data;
  },
  async getByContract(contractId, config = {}) {
    if (!contractId) throw new Error('contractId required');
    const res = await api.get(`${BASE}/contract/${contractId}`, config);
    return res.data;
  },
};

export default projectAPI;
