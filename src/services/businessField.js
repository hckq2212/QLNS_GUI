import { api } from './api';

const businessFieldApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAllBusinessFields: build.query({
      query: () => '/business-fields',
      providesTags: [{ type: 'BusinessField', id: 'LIST' }],
    }),
    getBusinessFieldByCode: build.query({
      query: (code) => `/business-fields/${code}`,
      providesTags: (result, error, code) => [{ type: 'BusinessField', id: code }],
    }),
    createBusinessField: build.mutation({
      query: (payload) => ({
        url: '/business-fields',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'BusinessField', id: 'LIST' }],
    }),
    updateBusinessField: build.mutation({
      query: ({ code, ...patch }) => ({
        url: `/business-fields/${code}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { code } = {}) => [
        { type: 'BusinessField', id: code },
        { type: 'BusinessField', id: 'LIST' },
      ],
    }),
    deleteBusinessField: build.mutation({
      query: (code) => ({
        url: `/business-fields/${code}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, code) => [
        { type: 'BusinessField', id: code },
        { type: 'BusinessField', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllBusinessFieldsQuery,
  useGetBusinessFieldByCodeQuery,
  useCreateBusinessFieldMutation,
  useUpdateBusinessFieldMutation,
  useDeleteBusinessFieldMutation,
} = businessFieldApi;

export default businessFieldApi;
