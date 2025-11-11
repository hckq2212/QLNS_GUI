import { api } from './api'; // existing RTK Query api slice (services/api.js)

const serviceApi = api.injectEndpoints({
  endpoints: (build) => ({
    getServices: build.query({
      query: () => '/service',

    }),
    getServiceById: build.query({
      query: (id) => `/service/${id}`,
    }),
    createService: build.mutation({
      query: (payload) => ({
        url: '/service',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'Service', id: 'LIST' }],
    }),

    updateService: build.mutation({
      query: ({ id, ...patch }) => ({
        url: `/service/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Service', id }, { type: 'Service', id: 'LIST' }],
    }),

    removeService: build.mutation({
      query: (id) => ({
        url: `/service/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Service', id }, { type: 'Service', id: 'LIST' }],
    }),
    getServicesByJobId: build.query({
      // expects backend route that returns services for a given service_job id
      query: (serviceJobId) => `/service-job/${serviceJobId}/services`,
    }),
  }),
  overrideExisting: false,
});

export const { useGetServicesQuery, useGetServiceByIdQuery, useCreateServiceMutation, useUpdateServiceMutation, useRemoveServiceMutation, useGetServicesByJobIdQuery } = serviceApi;
export default serviceApi;