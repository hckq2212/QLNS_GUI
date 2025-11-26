import { api } from './api';

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation({
      query: (body) => ({
        url: `/auth/register`,
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useRegisterMutation } = authApi;

export default authApi;
