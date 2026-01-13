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
    getUserJobs: build.query({
      query: (userId) => `/user/${userId}/jobs`,
      providesTags: (result, error, userId) => [
        { type: 'Job', id: `USER-${userId}` },
        { type: 'User', id: userId }
      ],
    }),
    getPersonalInfo: build.query({
      query: () => `/user/me`,
      providesTags: (result) => [{ type: 'User', id: 'ME' }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetAllUserQuery, useGetUserByIdQuery, useGetUserJobsQuery, useGetPersonalInfoQuery } = userApi;
export default userApi;
