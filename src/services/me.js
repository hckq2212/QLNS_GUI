import { api } from './api';

export const meApi = api.injectEndpoints({
	endpoints: (build) => ({
		getMyRole: build.query({
			query: () => '/me/role',
			providesTags: (result) => [{ type: 'Me', id: 'ROLE' }],
		}),
	}),
	overrideExisting: false,
});

export const { useGetMyRoleQuery } = meApi;
export default meApi;
