// services/customer.js
import { api } from './api';

export const jobAPI = api.injectEndpoints({
  endpoints: (build) => ({
    getAllJob: build.query({
        query: () => `/job`,
        providesTags: (result, error) => [{ type: 'Job' }],
    }),
    getJobById: build.query({
        query: (id) => `/job/${id}`,
        providesTags: (result, error, id) => [{ type: 'Job', id }],
    })
  }),
});

export const { 
    getAllJob,
    getJobById
 } = jobAPI;
