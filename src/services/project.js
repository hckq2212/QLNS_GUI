import { api } from './api';

export const projectAPI = api.injectEndpoints({
  endpoints: (build) => ({
    getAllProjects: build.query({
      query: () => `/project`,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Project', id: r.id })), { type: 'Project', id: 'LIST' }]
          : [{ type: 'Project', id: 'LIST' }],
    }),

    getProjectById: build.query({
      query: (id) => `/project/${id}`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),

    getProjectByContract: build.query({
      query: (contractId) => `/project/contract/${contractId}`,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Project', id: r.id })), { type: 'Project', id: 'LIST' }]
          : [{ type: 'Project', id: 'LIST' }],
    }),

    getProjectByStatus: build.query({
      query: (status) => `/project/status/${status}`,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Project', id: r.id })), { type: 'Project', id: 'LIST' }]
          : [{ type: 'Project', id: 'LIST' }],
    }),

    assignTeam: build.mutation({
      // expects { id, teamId }
      query: ({ id, teamId } = {}) => ({
        url: `/project/${id}/assign-team`,
        method: 'PATCH',
        body: { teamId },
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Project', id }, { type: 'Project', id: 'LIST' }],
    }),

    updateProject: build.mutation({
      query: ({ id, body } = {}) => ({
        url: `/project/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Project', id }, { type: 'Project', id: 'LIST' }],
    }),

    ackProject: build.mutation({
      query: (id) => ({
        url: `/project/${id}/ack`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Project', id }, { type: 'Project', id: 'LIST' }],
    }),

    requestReview: build.mutation({
      // expects { id, userId }
      query: ({ id, userId } = {}) => ({
        url: `/project/${id}/request-review`,
        method: 'POST',
        body: userId ? { user_id: userId } : undefined,
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Project', id }, { type: 'Project', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllProjectsQuery,
  useGetProjectByIdQuery,
  useGetProjectByContractQuery,
  useGetProjectByStatusQuery,
  useAssignTeamMutation,
  useUpdateProjectMutation,
  useAckProjectMutation,
  useRequestReviewMutation
} = projectAPI;

export default projectAPI;
