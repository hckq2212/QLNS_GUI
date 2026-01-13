import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logout } from '../features/auth/authSlice';
import 'dotenv/config'

// const baseUrl = 'https://qlns-kwbh.onrender.com/api' || 'https://qlns-production.up.railway.app/api' || 'http://localhost:3000/api';
// const baseUrl = 'http://192.168.130.239:3000/api';
// const baseUrl = 'http://192.168.1.5:3000/api';
// const baseUrl = 'https://qlns-kwbh.onrender.com/api'
const baseUrl = 'https://qlns-kwbh.onrender.com/api'
// plain fetchBaseQuery that attaches current access token from state
const baseFetch = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// prevent concurrent refresh calls
let refreshPromise = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // try original request
  let result = await baseFetch(args, api, extraOptions);

  // if unauthorized, try refresh
  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    // get refresh token from localStorage (auth flows in this repo store it there)
    const storedRefresh = (() => {
      try { return localStorage.getItem('refreshToken'); } catch { return null; }
    })();

    if (!storedRefresh) {
      // no refresh token -> force logout
      api.dispatch(logout());
      return result;
    }

    try {
      // if another refresh is already in progress, wait for it
      if (!refreshPromise) {
        refreshPromise = baseFetch({ url: '/auth/refresh-token', method: 'POST', body: { refreshToken: storedRefresh } }, api, extraOptions)
          .then((res) => { refreshPromise = null; return res; })
          .catch((err) => { refreshPromise = null; throw err; });
      }

      const refreshResult = await refreshPromise;

      if (refreshResult?.data) {
        const { accessToken, refreshToken: newRefreshToken, user, role } = refreshResult.data;
        // persist refresh token if provided
        try { if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken); } catch (_) {}

        // update redux auth state with new access token (and optional user/role)
        api.dispatch(setCredentials({ accessToken, user, role }));

        // retry original request
        result = await baseFetch(args, api, extraOptions);
        return result;
      } else {
        // refresh failed -> logout
        api.dispatch(logout());
        return refreshResult;
      }
    } catch (err) {
      api.dispatch(logout());
      return { error: { status: 'CUSTOM_ERROR', data: 'Failed to refresh token' } };
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Contract',
    'Customer', 
    'Job', 
    'Team', 
    'Project',
    'Role',
    'Referral',
    'Review',
    'ServiceJob',
    'ServiceJobCriteria'
  ],
  endpoints: () => ({}),
});
