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
} = debtAPI;
export default debtAPI;
