import { api } from './api'; 

const serviceJobApi = api.injectEndpoints({
  endpoints: (build) => ({
    getServiceJobs: build.query({
      query: () => '/service-job',

    }),
    getServiceJobById: build.query({
      query: (id) => `/service-job/${id}`,
    }),
    // create a new service job
    createServiceJob: build.mutation({
      query: (body) => ({
        url: '/service-job',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ServiceJob', id: 'LIST' }],
    }),

    // update an existing service job
    updateServiceJob: build.mutation({
      query: ({ id, body } = {}) => ({
        url: `/service-job/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'ServiceJob', id }, { type: 'ServiceJob', id: 'LIST' }],
    }),

    // remove a service job
    removeServiceJob: build.mutation({
      query: (id) => ({
        url: `/service-job/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'ServiceJob', id }, { type: 'ServiceJob', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetServiceJobsQuery,
  useGetServiceJobByIdQuery,
  useCreateServiceJobMutation,
  useUpdateServiceJobMutation,
  useRemoveServiceJobMutation,
} = serviceJobApi;