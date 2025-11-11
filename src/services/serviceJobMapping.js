import { api } from './api';

const serviceJobMappingApi = api.injectEndpoints({
  endpoints: (build) => ({
    getServiceJobMappings: build.query({
      // accepts an optional params object to be sent as query params, e.g. { service_job_id, service_id }
      query: (params) => ({
        url: '/service-job-mapping',
        params,
      }),
    }),

    createServiceJobMapping: build.mutation({
      query: (body) => ({
        url: '/service-job-mapping',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ServiceJob', id: 'LIST' }],
    }),

    removeServiceJobMapping: build.mutation({
      // backend expects identifying info in body or query (e.g. { id } or { service_job_id, service_id })
      query: ({ body, params } = {}) => ({
        url: '/service-job-mapping',
        method: 'DELETE',
        body,
        params,
      }),
      invalidatesTags: [{ type: 'ServiceJob', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetServiceJobMappingsQuery,
  useCreateServiceJobMappingMutation,
  useRemoveServiceJobMappingMutation,
} = serviceJobMappingApi;

export default serviceJobMappingApi;
