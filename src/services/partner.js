import { api } from './api';

const partnerApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPartners: build.query({
      query: (params) => ({ url: '/partner', params }),
      transformResponse: (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        return [];
      },
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Partner', id: r.id })), { type: 'Partner', id: 'LIST' }]
          : [{ type: 'Partner', id: 'LIST' }],
    }),

    getPartnerById: build.query({
      query: (id) => ({ url: `/partner/${id}` }),
      transformResponse: (res) => {
        if (!res) return null;
        if (res.data) return res.data;
        return res;
      },
      providesTags: (result, error, id) => [{ type: 'Partner', id }],
    }),
    createPartner: build.mutation({
      query: (payload) => ({
        url: '/partner',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'Partner', id: 'LIST' }],
    }),

    updatePartner: build.mutation({
      query: ({ id, ...patch }) => ({
        url: `/partner/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Partner', id }, { type: 'Partner', id: 'LIST' }],
    }),

    removePartner: build.mutation({
      query: (id) => ({
        url: `/partner/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Partner', id }, { type: 'Partner', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPartnersQuery, useGetPartnerByIdQuery, useCreatePartnerMutation, useUpdatePartnerMutation, useRemovePartnerMutation } = partnerApi;
export default partnerApi;
