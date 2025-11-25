import { api } from './api';

export const debtAPI = api.injectEndpoints({
  endpoints: (build) => ({
    getAllDebts: build.query({
      query: () => `/debt`,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Debt', id: r.id })), { type: 'Debt', id: 'LIST' }]
          : [{ type: 'Debt', id: 'LIST' }],
    }),
    getDebtById: build.query({
      query: (id) => `/debt/${id}`,
      providesTags: (result, error, id) => [{ type: 'Debt', id }],
    }),
    createDebt: build.mutation({
      query: (body) => ({
        url: '/debt',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Debt', id: 'LIST' }],
    }),
    createDebtForContract: build.mutation({
      // expects { contractId, body }
      query: ({ contractId, body } = {}) => ({
        url: `/debt/${contractId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Debt', id: 'LIST' }],
    }),
    getAllPending: build.query({
      query: () => `/debt/pending`,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Debt', id: r.id })), { type: 'Debt', id: 'PENDING' }]
          : [{ type: 'Debt', id: 'PENDING' }],
    }),
    updateDebt: build.mutation({
      query: ({ id, body } = {}) => ({
        url: `/debt/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Debt', id }, { type: 'Debt', id: 'LIST' }],
    }),
    removeDebt: build.mutation({
      query: (id) => ({
        url: `/debt/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Debt', id }, { type: 'Debt', id: 'LIST' }],
    }),
    // Debt payment endpoints (debt-payment)
    // get all payments for a debt
    getDebtPaymentsByDebt: build.query({
      query: (debtId) => `/debt-payment/${debtId}/payments`,
      transformResponse: (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        return [];
      },
      providesTags: (result, error, debtId) => [{ type: 'DebtPayments', id: debtId }],
    }),

    // create a payment for a debt (POST /debt-payment/:debtId/payments)
    createDebtPayment: build.mutation({
      query: ({ debtId, body } = {}) => ({
        url: `/debt-payment/${debtId}/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { debtId } = {}) => (debtId ? [{ type: 'DebtPayments', id: debtId }, { type: 'Debt', id: debtId }] : []),
    }),

    // update a payment (PUT /debt-payment/payment/:paymentId)
    updateDebtPayment: build.mutation({
      query: ({ paymentId, body } = {}) => ({
        url: `/debt-payment/payment/${paymentId}`,
        method: 'PUT',
        body,
      }),
      // best-effort invalidation: try to invalidate by debt id returned in the response
      invalidatesTags: (result, error, { paymentId } = {}) => {
        const debtId = result?.debt_id || result?.payment?.debt_id || null;
        if (debtId) return [{ type: 'DebtPayments', id: debtId }, { type: 'Debt', id: debtId }];
        // fallback: invalidate payment-specific tag so callers depending on the paymentId may update
        return [{ type: 'DebtPayments', id: paymentId }];
      },
    }),

    // delete a payment (DELETE /debt-payment/payment/:paymentId)
    deleteDebtPayment: build.mutation({
      query: (paymentId) => ({
        url: `/debt-payment/payment/${paymentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, paymentId) => {
        const debtId = result?.debt_id || result?.payment?.debt_id || null;
        if (debtId) return [{ type: 'DebtPayments', id: debtId }, { type: 'Debt', id: debtId }];
        return [{ type: 'DebtPayments', id: paymentId }];
      },
    }),
    // get debts by contract (GET /debt/contract/:contractId)
    getDebtsByContract: build.query({
      query: (contractId) => `/debt/contract/${contractId}`,
      transformResponse: (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        return [];
      },
      providesTags: (result, error, contractId) => [{ type: 'Debt', id: `CONTRACT-${contractId}` }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllDebtsQuery,
  useGetDebtByIdQuery,
  useCreateDebtMutation,
  useCreateDebtForContractMutation,
  useGetAllPendingQuery,
  useUpdateDebtMutation,
  useRemoveDebtMutation,
  useGetDebtPaymentsByDebtQuery,
  useCreateDebtPaymentMutation,
  useUpdateDebtPaymentMutation,
  useDeleteDebtPaymentMutation,
  useGetDebtsByContractQuery,
} = debtAPI;
export default debtAPI;
