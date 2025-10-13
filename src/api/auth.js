import api from './apiConfig.js';

const authAPI = {
	async login(params) {
		const res = await api.post('/api/auth/login', params);

		// if the server returned tokens in res.data, persist them and set default header
		if (res && res.data) {
			const { accessToken, refreshToken } = res.data;
			try {
				if (accessToken) {
					localStorage.setItem('accessToken', accessToken);
					// set Authorization header for subsequent requests
					api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
				}
				if (refreshToken) {
					localStorage.setItem('refreshToken', refreshToken);
				}
			} catch (e) {
				// In environments without localStorage (very rare in this app), ignore
				// eslint-disable-next-line no-console
				console.warn('Could not save auth tokens to localStorage', e);
			}
		}

		return res;
	},

	async register(params) {
		const res = await api.post('/api/auth/register', params);
		return res;
	},

	async refreshToken() {
		// call refresh endpoint; refresh token stored as HttpOnly cookie so include credentials
		const res = await api.post('/api/auth/refresh-token', {}, { withCredentials: true });
		return res;
	},

	// convenience helpers
	logout() {
		try {
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
		} catch (e) {
			// ignore
		}
		// remove default header
		if (api && api.defaults && api.defaults.headers && api.defaults.headers.common) {
			delete api.defaults.headers.common['Authorization'];
		}
	},

	getAccessToken() {
		try {
			return localStorage.getItem('accessToken');
		} catch (e) {
			return null;
		}
	},
};

export default authAPI;
