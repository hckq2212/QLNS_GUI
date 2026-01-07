// services/acceptance.js
import { api } from './api';

export const acceptanceApi = api.injectEndpoints({
  endpoints: (build) => ({
    
    // GET /acceptance/:id - Get acceptance by ID
    getAcceptanceById: build.query({
      query: (id) => `/acceptance/${id}`,
      providesTags: (result, error, id) => [{ type: 'Acceptance', id }],
    }),
    
    // GET /acceptance/project/:project_id - Get acceptances by project
    getAcceptancesByProject: build.query({
      query: (projectId) => `/acceptance/project/${projectId}`,
      providesTags: (result, error, projectId) => [
        { type: 'Acceptance', id: 'LIST' },
        { type: 'Acceptance', id: `PROJECT_${projectId}` },
      ],
    }),
    
    // POST /acceptance/draft - Create draft acceptance
    createAcceptanceDraft: build.mutation({
      query: (body) => ({
        url: '/acceptance/draft',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Acceptance', id: 'LIST' }],
    }),

    // PUT /acceptance/:id/submit-bod - Submit to BOD
    submitAcceptanceToBOD: build.mutation({
      query: (id) => ({
        url: `/acceptance/${id}/submit-bod`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Acceptance', id },
        { type: 'Acceptance', id: 'LIST' },
      ],
    }),

    // PATCH /acceptance/:id/approve/:jobId - Approve single job in acceptance by BOD
    approveAcceptanceByBOD: build.mutation({
      // params: { id, jobId }
      query: ({ id, jobId }) => ({
        url: `/acceptance/${id}/approve/${jobId}`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { id } = {}) => [
        { type: 'Acceptance', id },
        { type: 'Acceptance', id: 'LIST' },
      ],
    }),

    // PATCH /acceptance/:id/reject/:jobId - Reject single job in acceptance by BOD
    rejectAcceptanceByBOD: build.mutation({
      // params: { id, jobId }
      query: ({ id, jobId }) => ({
        url: `/acceptance/${id}/reject/${jobId}`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { id } = {}) => [
        { type: 'Acceptance', id },
        { type: 'Acceptance', id: 'LIST' },
      ],
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetAcceptanceByIdQuery,
  useGetAcceptancesByProjectQuery,
  useCreateAcceptanceDraftMutation,
  useSubmitAcceptanceToBODMutation,
  useApproveAcceptanceByBODMutation,
  useRejectAcceptanceByBODMutation,
} = acceptanceApi;
