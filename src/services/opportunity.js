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
      query: (status) => `/opportunity/status/${status}`,
      providesTags: (result, error, status) => [{ type: 'Opportunity', status }],
    }),
    getMyOpportunities: build.query({
      query: () => `/opportunity/me`,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Opportunity', id: r.id })), { type: 'Opportunity', id: 'MY' }]
          : [{ type: 'Opportunity', id: 'MY' }],
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
    updateOpportunity: build.mutation({
      query: ({ id, body } = {}) => ({
        url: `/opportunity/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Opportunity', id }],
    }),
    addOpportunityService: build.mutation({
      query: ({ opportunityId, body } = {}) => ({
        url: `/opportunity/${opportunityId}/services`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { opportunityId } = {}) => [
        { type: 'OpportunityServices', id: opportunityId },
        { type: 'Opportunity', id: opportunityId }
      ],
    }),
    updateOpportunityService: build.mutation({
      query: ({ opportunityId, serviceId, body } = {}) => ({
        url: `/opportunity/${opportunityId}/services/${serviceId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { opportunityId } = {}) => [
        { type: 'OpportunityServices', id: opportunityId },
        { type: 'Opportunity', id: opportunityId }
      ],
    }),
    deleteOpportunityService: build.mutation({
      query: ({ opportunityId, serviceId } = {}) => ({
        url: `/opportunity/${opportunityId}/services/${serviceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { opportunityId } = {}) => [
        { type: 'OpportunityServices', id: opportunityId },
        { type: 'Opportunity', id: opportunityId }
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateOpportunityMutation,
  useGetAllOpportunityQuery,
  useGetOpportunityByIdQuery,
  useApproveMutation,
  useGetOpportunityServicesQuery,
  useQuoteOpportunityMutation,
  useUpdateOpportunityMutation,
  useGetOpportunityByStatusQuery,
  useGetMyOpportunitiesQuery,
  useAddOpportunityServiceMutation,
  useUpdateOpportunityServiceMutation,
  useDeleteOpportunityServiceMutation,
} = opportunityAPI;
export default opportunityAPI;