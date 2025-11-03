// services/customer.js
import CreateOpportunity from '../components/Opportunity/CreateOpportunity';
import { api } from './api';

export const opportunityAPI = api.injectEndpoints({
  endpoints: (build) => ({
    getAllOpportunity: build.query({
        query: () => `/opportunity`,
        providesTags: (result, error) => [{ type: 'Opportunity' }],
    }),
    getOpportunityById: build.query({
        query: (id) => `/opportunity/${id}`,
        providesTags: (result, error, id) => [{ type: 'Opportunity', id }],
    }),
    createOpportunity: build.mutation({
        query: (body) => ({
            url: '/opportunity',
            method: 'POST',
            body,
        }),
            invalidatesTags: [{ type: 'Opportunity', id: 'LIST' }],
        }),
    }),
});

export const { 
    useCreateOpportunityMutation,
    useGetAllOpportunityQuery,
    useLazyGetOpportunityByIdQuery
 } = opportunityAPI;
