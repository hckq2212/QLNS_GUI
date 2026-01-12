import { api } from './api';

export const quoteAPI = api.injectEndpoints({
  endpoints: (build) => ({
    // GET / - Get all quotes with filters
    getAllQuotes: build.query({
      query: ({ status, opportunityId } = {}) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (opportunityId) params.append('opportunity_id', String(opportunityId));
        return `/quote?${params.toString()}`;
      },
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Quote', id: r.id })), { type: 'Quote', id: 'LIST' }]
          : [{ type: 'Quote', id: 'LIST' }],
    }),

    // GET /:id - Get quote by ID
    getQuoteById: build.query({
      query: (id) => `/quote/${id}`,
      providesTags: (result, error, id) => [{ type: 'Quote', id }],
    }),

    // GET /opportunity/:opportunityId - Get quote by opportunity ID
    getQuoteByOpportunityId: build.query({
      query: (opportunityId) => `/quote/opportunity/${opportunityId}`,
      providesTags: (result, error, opportunityId) => [
        { type: 'Quote', id: `opportunity-${opportunityId}` }
      ],
    }),

    // POST / - Create quote
    createQuote: build.mutation({
      query: (body) => ({
        url: '/quote',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Quote', id: 'LIST' },
        { type: 'Opportunity', id: 'LIST' },
      ],
    }),

    // PUT /:id - Update quote
    updateQuote: build.mutation({
      query: ({ id, body }) => ({
        url: `/quote/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quote', id },
        { type: 'Quote', id: 'LIST' },
      ],
    }),

    // DELETE /:id - Delete quote
    deleteQuote: build.mutation({
      query: (id) => ({
        url: `/quote/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Quote', id },
        { type: 'Quote', id: 'LIST' },
      ],
    }),

    // PATCH /:id/approve - Approve quote
    approveQuote: build.mutation({
      query: ({ id, note }) => ({
        url: `/quote/${id}/approve`,
        method: 'PATCH',
        body: { note },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quote', id },
        { type: 'Quote', id: 'LIST' },
        { type: 'Opportunity', id: 'LIST' },
      ],
    }),

    // PATCH /:id/reject - Reject quote
    rejectQuote: build.mutation({
      query: ({ id, note }) => ({
        url: `/quote/${id}/reject`,
        method: 'PATCH',
        body: { note },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quote', id },
        { type: 'Quote', id: 'LIST' },
        { type: 'Opportunity', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllQuotesQuery,
  useGetQuoteByIdQuery,
  useGetQuoteByOpportunityIdQuery,
  useCreateQuoteMutation,
  useUpdateQuoteMutation,
  useDeleteQuoteMutation,
  useApproveQuoteMutation,
  useRejectQuoteMutation,
} = quoteAPI;

export default quoteAPI;
