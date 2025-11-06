import { api } from './api';

export const opportunityAPI = api.injectEndpoints({
  endpoints: (build) => ({
    getAllOpportunity: build.query({
      query: () => `/opportunity`,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Opportunity', id: r.id })), { type: 'Opportunity', id: 'LIST' }]
          : [{ type: 'Opportunity', id: 'LIST' }],
    }),
    getOpportunityById: build.query({
      query: (id) => `/opportunity/${id}`,
      providesTags: (result, error, id) => [{ type: 'Opportunity', id }],
    }),
    getOpportunityByStatus: build.query({
      query: (status) => `/opportunity/${status}`,
      providesTags: (result, error, status) => [{ type: 'Opportunity', status }],
    }),
    createOpportunity: build.mutation({
      // Accepts either a plain JS object (JSON) or a FormData instance
      // When uploading files the caller should pass a FormData with files
      query: (body) => {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return {
          url: '/opportunity',
          method: 'POST',
          // fetch will correctly send FormData without forcing a JSON content-type
          body,
          // do not set content-type here; browser will set proper multipart boundary when using FormData
        };
      },
      invalidatesTags: [{ type: 'Opportunity', id: 'LIST' }],
    }),
    getOpportunityServices: build.query({
      query: (id) => `/opportunity/${id}/services`,
      providesTags: (result, error, id) => [{ type: 'OpportunityServices', id }],
    }),
    approve: build.mutation({
      query: (id) => ({
        url: `/opportunity/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Opportunity', id }],
    }),
    quoteOpportunity: build.mutation({
      // expects { id, body }
      query: ({ id, body } = {}) => ({
        url: `/opportunity/${id}/quote`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Opportunity', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateOpportunityMutation,
  useGetAllOpportunityQuery,
  useLazyGetOpportunityByIdQuery,
  useApproveMutation,
  useGetOpportunityServicesQuery,
  useQuoteOpportunityMutation,
  useGetOpportunityByStatusQuery
} = opportunityAPI;
export default opportunityAPI;