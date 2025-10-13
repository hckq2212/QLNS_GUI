import api from './apiConfig.js';

// Client-side wrapper for Service endpoints (backend route: /api/service)
const BASE = '/api/service';

const serviceAPI = {
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

export default serviceAPI;
