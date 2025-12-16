import { api } from './api';

const serviceJobCriteriaApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCriteriaByServiceJob: builder.query({
      query: (serviceJobId) => `/service-job-criteria/service-job/${serviceJobId}`,
      providesTags: (result, error, serviceJobId) => [
        { type: 'ServiceJobCriteria', id: 'LIST' },
        { type: 'ServiceJob', id: serviceJobId }
      ]
    }),
    
    getCriteriaById: builder.query({
      query: (id) => `/service-job-criteria/${id}`,
      providesTags: (result, error, id) => [{ type: 'ServiceJobCriteria', id }]
    }),
    
    createCriteria: builder.mutation({
      query: (body) => ({
        url: '/service-job-criteria',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'ServiceJobCriteria', id: 'LIST' }, 'ServiceJob']
    }),
    
    updateCriteria: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/service-job-criteria/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ServiceJobCriteria', id },
        { type: 'ServiceJobCriteria', id: 'LIST' },
        'ServiceJob'
      ]
    }),
    
    deleteCriteria: builder.mutation({
      query: (id) => ({
        url: `/service-job-criteria/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: [{ type: 'ServiceJobCriteria', id: 'LIST' }, 'ServiceJob']
    })
  })
});

export const {
  useGetCriteriaByServiceJobQuery,
  useGetCriteriaByIdQuery,
  useCreateCriteriaMutation,
  useUpdateCriteriaMutation,
  useDeleteCriteriaMutation
} = serviceJobCriteriaApi;

export default serviceJobCriteriaApi;
