import { api } from './api'; // existing RTK Query api slice (services/api.js)

const serviceApi = api.injectEndpoints({
  endpoints: (build) => ({
    getServices: build.query({
      query: () => '/service',

    }),
    getServiceById: build.query({
      query: (id) => `/service/${id}`,
    }),
  }),
  overrideExisting: false,
});

export const { useGetServicesQuery, useGetServiceByIdQuery } = serviceApi;
export default serviceApi;