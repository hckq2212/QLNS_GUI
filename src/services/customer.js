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
  }),
});

export const { 
  useGetAllCustomerQuery,
  useGetCustomerByIdQuery
 } = customerApi;
