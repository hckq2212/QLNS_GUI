import { api } from './api';

const partnerServiceJobApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Create a new partner-service-job mapping
    createPartnerServiceJob: build.mutation({
      query: (body) => ({ url: '/partner-service-job', method: 'POST', body }),
      // no tags for now
    }),

    // Get all mappings (optionally accepts query params)
    getPartnerServiceJobs: build.query({
      query: (params) => ({ url: '/partner-service-job', params }),
      transformResponse: (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        return res;
      },
    }),

    // Get mappings by partner id
    getPartnerServiceJobsByPartner: build.query({
      query: (partnerId) => ({ url: `/partner-service-job/partner/${partnerId}` }),
      transformResponse: (res) => (res && res.data) ? res.data : res,
    }),

    // Get partners that can provide a given service_job
    getPartnerServiceJobsByServiceJob: build.query({
      query: (serviceJobId) => ({ url: `/partner-service-job/service-job/${serviceJobId}` }),
      transformResponse: (res) => (res && res.data) ? res.data : res,
    }),
    // Update a partner-service-job mapping (e.g., update base_cost)
    updatePartnerServiceJob: build.mutation({
      query: ({ id, body }) => ({ url: `/partner-service-job/${id}`, method: 'PATCH', body }),
      // no tags for now; callers can refetch explicitly
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreatePartnerServiceJobMutation,
  useGetPartnerServiceJobsQuery,
  useGetPartnerServiceJobsByPartnerQuery,
  useGetPartnerServiceJobsByServiceJobQuery,
  useUpdatePartnerServiceJobMutation,
} = partnerServiceJobApi;

export default partnerServiceJobApi;
