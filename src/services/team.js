import { api } from './api';

export const teamAPI = api.injectEndpoints({
  endpoints: (build) => ({
    getAllTeams: build.query({
      query: (params) => ({ url: '/team', params }),
      transformResponse: (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        return [];
      },
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Team', id: r.id })), { type: 'Team', id: 'LIST' }]
          : [{ type: 'Team', id: 'LIST' }],
    }),

    getTeamById: build.query({
      query: (id) => ({ url: `/team/${id}` }),
      transformResponse: (res) => {
        if (!res) return null;
        if (res.data) return res.data;
        return res;
      },
      providesTags: (result, error, id) => [{ type: 'Team', id }],
    }),

    getTeamMembers: build.query({
      query: (id) => ({ url: `/team/${id}/member` }),
      transformResponse: (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        return [];
      },
      providesTags: (result, error, id) =>
        result && Array.isArray(result)
          ? [...result.map((m) => ({ type: 'TeamMember', id: m.id })), { type: 'TeamMember', id: `TEAM-${id}` }]
          : [{ type: 'TeamMember', id: `TEAM-${id}` }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllTeamsQuery,
  useGetTeamByIdQuery,
  useGetTeamMembersQuery,
} = teamAPI;

export default teamAPI;
