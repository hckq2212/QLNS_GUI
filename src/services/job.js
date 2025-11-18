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
    ,
    getMyJob: build.query({
      query: () => `/job/me`,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((j) => ({ type: 'Job', id: j.id })), { type: 'Job', id: 'ME' }]
          : [{ type: 'Job', id: 'ME' }],
    })
    ,
    finishJob: build.mutation({
      // expects an object: { id, formData } where formData is a FormData instance containing 'evidence' files
      query: ({ id, formData }) => ({
        url: `/job/${id}/finish`,
        method: 'PATCH',
        body: formData,
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Job', id }, { type: 'Job', id: 'ME' }],
    })
    ,
    updateJob: build.mutation({
      // expects { id, body }
      query: ({ id, body }) => ({ url: `/job/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Job', id }, { type: 'Job', id: 'ME' }],
    })
  }),
});

export const { 
    getAllJob,
    getJobById,
    useGetMyJobQuery,
    useFinishJobMutation,
    useUpdateJobMutation
 } = jobAPI;

