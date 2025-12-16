import { api } from './api';

export const jobReviewAPI = api.injectEndpoints({
  endpoints: (build) => ({
    // GET /job/:id/review-form?type=lead|sale
    getReviewForm: build.query({
      query: ({ id, type = 'lead' }) => ({
        url: `/job/${id}/review-form`,
        params: { type },
      }),
      providesTags: (result, error, { id }) => [{ type: 'Job', id }, { type: 'Review', id }],
    }),

    // POST /job/:id/review?type=lead|sale
    createReview: build.mutation({
      query: ({ id, type = 'lead', body }) => ({
        url: `/job/${id}/review`,
        method: 'POST',
        params: { type },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        { type: 'Review', id },
        { type: 'Project' },
      ],
    }),
  }),
});

export const {
  useGetReviewFormQuery,
  useCreateReviewMutation,
} = jobReviewAPI;
