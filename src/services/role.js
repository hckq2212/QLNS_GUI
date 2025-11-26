import { api } from './api';

export const roleApi = api.injectEndpoints({
  endpoints: (build) => ({
    // GET /role -> list
    getRoles: build.query({
      query: () => ({ url: '/role' }),
      transformResponse: (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        return [];
      },
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Role', id: r.id })), { type: 'Role', id: 'LIST' }]
          : [{ type: 'Role', id: 'LIST' }],
    }),

    // GET /role/:id
    getRoleById: build.query({
      query: (id) => ({ url: `/role/${id}` }),
      transformResponse: (res) => {
        if (!res) return null;
        if (res.data) return res.data;
        return res;
      },
      providesTags: (result, error, id) => [{ type: 'Role', id }],
    }),

    // POST /role
    createRole: build.mutation({
      query: (body) => ({ url: '/role', method: 'POST', body }),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    // PATCH /role/:id
    updateRole: build.mutation({
      query: ({ id, body } = {}) => ({ url: `/role/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Role', id }, { type: 'Role', id: 'LIST' }],
    }),

    // DELETE /role/:id
    deleteRole: build.mutation({
      query: (id) => ({ url: `/role/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [{ type: 'Role', id }, { type: 'Role', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;

export default roleApi;
