import { api } from './api';

export const referralApi = api.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/referral - list all referral partners
    getReferrals: build.query({
      query: (params) => ({
        url: '/referral',
        params,
      }),
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Referral', id: r.id })), { type: 'Referral', id: 'LIST' }]
          : [{ type: 'Referral', id: 'LIST' }],
    }),

    // GET /api/referral/:id - get referral partner detail
    getReferralById: build.query({
      query: (id) => `/referral/${id}`,
      providesTags: (result, error, id) => [{ type: 'Referral', id }],
    }),

    // POST /api/referral - create new referral partner
    createReferral: build.mutation({
      query: (body) => ({
        url: '/referral',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Referral', id: 'LIST' }],
    }),

    // PUT /api/referral/:id - update referral partner
    updateReferral: build.mutation({
      query: ({ id, body }) => ({
        url: `/referral/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Referral', id },
        { type: 'Referral', id: 'LIST' },
      ],
    }),

    // DELETE /api/referral/:id - soft delete referral partner
    deleteReferral: build.mutation({
      query: (id) => ({
        url: `/referral/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Referral', id },
        { type: 'Referral', id: 'LIST' },
      ],
    }),

    // GET /api/referral/:id/customers - list customers of referral partner
    getReferralCustomers: build.query({
      query: (id) => `/referral/${id}/customers`,
      providesTags: (result, error, id) => [
        { type: 'Referral', id },
        { type: 'Customer', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetReferralsQuery,
  useGetReferralByIdQuery,
  useCreateReferralMutation,
  useUpdateReferralMutation,
  useDeleteReferralMutation,
  useGetReferralCustomersQuery,
} = referralApi;

export default referralApi;
