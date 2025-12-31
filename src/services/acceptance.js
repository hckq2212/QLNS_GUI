// services/acceptance.js
import { api } from './api';

export const acceptanceApi = api.injectEndpoints({
  endpoints: (build) => ({
    
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

    // PUT /acceptance/:id/approve - Approve by BOD
    approveAcceptanceByBOD: build.mutation({
      query: (id) => ({
        url: `/acceptance/${id}/approve`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Acceptance', id },
        { type: 'Acceptance', id: 'LIST' },
      ],
    }),

    // PUT /acceptance/:id/reject - Reject by BOD
    rejectAcceptanceByBOD: build.mutation({
      query: (id) => ({
        url: `/acceptance/${id}/reject`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Acceptance', id },
        { type: 'Acceptance', id: 'LIST' },
      ],
    }),

  }),
  overrideExisting: false,
});

export const {
  useCreateAcceptanceDraftMutation,
  useSubmitAcceptanceToBODMutation,
  useApproveAcceptanceByBODMutation,
  useRejectAcceptanceByBODMutation,
} = acceptanceApi;
