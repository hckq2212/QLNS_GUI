import { api } from './api';

const serviceCriteriaApi = api.injectEndpoints({
  endpoints: (build) => ({
    // GET /service-criteria/service/:service_id
    getServiceCriteriaByServiceId: build.query({
      query: (serviceId) => `/service-criteria/service/${serviceId}`,
    }),

    // GET /service-criteria/:id
    getServiceCriteriaById: build.query({
      query: (id) => `/service-criteria/${id}`,
    }),

    // POST /service-criteria
    createServiceCriteria: build.mutation({
      query: (body) => ({
        url: '/service-criteria',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ServiceCriteria', id: 'LIST' }],
    }),

    // PUT /service-criteria/:id
    updateServiceCriteria: build.mutation({
      query: ({ id, body }) => ({
        url: `/service-criteria/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'ServiceCriteria', id }, { type: 'ServiceCriteria', id: 'LIST' }],
    }),

    // DELETE /service-criteria/:id
    removeServiceCriteria: build.mutation({
      query: (id) => ({
        url: `/service-criteria/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'ServiceCriteria', id }, { type: 'ServiceCriteria', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetServiceCriteriaByServiceIdQuery,
  useGetServiceCriteriaByIdQuery,
  useCreateServiceCriteriaMutation,
  useUpdateServiceCriteriaMutation,
  useRemoveServiceCriteriaMutation,
} = serviceCriteriaApi;

export default serviceCriteriaApi;
