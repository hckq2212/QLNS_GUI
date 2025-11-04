import { api } from './api';

export const userApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAllUser: build.query({
      query: () => `/user`,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((u) => ({ type: 'User', id: u.id })), { type: 'User', id: 'LIST' }]
          : [{ type: 'User', id: 'LIST' }],
    }),
    getUserById: build.query({
      query: (id) => `/user/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    getPersonalInfo: build.query({
      query: () => `/user/me`,
      providesTags: (result) => [{ type: 'User', id: 'ME' }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetAllUserQuery, useGetUserByIdQuery, useGetPersonalInfoQuery } = userApi;
export default userApi;
