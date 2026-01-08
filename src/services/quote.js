import { api } from './api';

export const quoteAPI = api.injectEndpoints({
  endpoints: (build) => ({
    getAllQuotes: build.query({
      query: () => `/quote`,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Quote', id: r.id })), { type: 'Quote', id: 'LIST' }]
          : [{ type: 'Quote', id: 'LIST' }],
    }),
    getQuoteById: build.query({
      query: (id) => `/quote/${id}`,
      providesTags: (result, error, id) => [{ type: 'Quote', id }],
    }),
    createQuote: build.mutation({
      query: (body) => ({
        url: '/quote',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Quote', id: 'LIST' }],
    }),
    updateQuote: build.mutation({
      query: ({ id, body } = {}) => ({
        url: `/quote/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id } = {}) => [
        { type: 'Quote', id },
        { type: 'Quote', id: 'LIST' }
      ],
    }),
    deleteQuote: build.mutation({
      query: (id) => ({
        url: `/quote/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Quote', id },
        { type: 'Quote', id: 'LIST' }
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllQuotesQuery,
  useGetQuoteByIdQuery,
  useCreateQuoteMutation,
  useUpdateQuoteMutation,
  useDeleteQuoteMutation,
} = quoteAPI;

export default quoteAPI;
