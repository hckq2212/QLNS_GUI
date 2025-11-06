import { api } from './api'; 

const serviceJobApi = api.injectEndpoints({
  endpoints: (build) => ({
    getServiceJobs: build.query({
      query: () => '/service-job',

    }),
    getServiceJobById: build.query({
      query: (id) => `/service-job/${id}`,
    }),
  }),
  overrideExisting: false,
});

export const { useGetServiceJobsQuery, useGetServiceJobByIdQuery } = serviceJobApi;