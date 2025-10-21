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
  async getByStatus(status, config = {}) {
    if (!status) throw new Error('status required');
    const res = await api.get(`${BASE}/status/${status}`, config);
    return res.data;
  },
  async update(id, payload = {}, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.patch(`${BASE}/${id}`, payload, config);
    return res.data;
  },
  async ack(id, config = {}) {
    if (!id) throw new Error('id required');
    const res = await api.post(`${BASE}/${id}/ack`, {}, config);
    return res.data;
  },
  async assignJob(projectId, payload = {}, config = {}) {
    if (!projectId) throw new Error('projectId required');
    const res = await api.post(`${BASE}/${projectId}/jobs/assign`, payload, config);
    return res.data;
  },
};

export default projectAPI;
