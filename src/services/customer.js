// services/customer.js
import { api } from './api';

export const customerApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCustomerById: build.query({
      query: (id) => `/customer/${id}`,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),
    getAllCustomer: build.query({
      query: () => `/customer`,
      providesTags: (result, error) => [{ type: 'Customer'}],
    }),
    createCustomer: build.mutation({
      query: (payload) => ({
        url: '/customer',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'Customer' }],
    }),
    updateCustomer: build.mutation({
      query: ({ id, ...patch }) => ({
        url: `/customer/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      // invalidate the specific customer and the list
      invalidatesTags: (result, error, { id }) => [{ type: 'Customer', id }, { type: 'Customer' }],
    }),
    deleteCustomer: build.mutation({
      query: (id) => ({
        url: `/customer/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Customer', id }, { type: 'Customer' }],
    }),
  }),
});

export const { 
  useGetAllCustomerQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi;

