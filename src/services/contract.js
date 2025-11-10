// services/contract.js
import { api } from './api';

export const contractApi = api.injectEndpoints({
  endpoints: (build) => ({

    // lấy theo status: waiting_hr_confirm, waiting_bod_approval, not_assigned, without_debt
    getContractsByStatus: build.query({
      query: (status) => ({
        url: `/contract/status/${status}`,
        providesTags: (result, err, status) => [{ type: 'Contract', id: `LIST-${status}` }],
      }),
      // cache danh sách theo status
      providesTags: (result, error, status) =>
        result
          ? [
              // 1 tag cho list
              { type: 'ContractList', id: status },
              // 1 tag cho từng contract
              ...result.map((c) => ({ type: 'Contract', id: c.id })),
            ]
          : [{ type: 'ContractList', id: status }],
      // nếu backend của bạn trả `{ items: [...] }` thì map lại ở đây
      transformResponse: (res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.items)) return res.items;
        return [];
      },
    }),

    // get all contracts
    getAllContracts: build.query({
      query: () => ({ url: `/contract` }),
      transformResponse: (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        return [];
      },
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Contract', id: r.id })), { type: 'Contract', id: 'LIST' }]
          : [{ type: 'Contract', id: 'LIST' }],
    }),

    // get single contract by id
    getContractById: build.query({
      query: (contractId) => ({ url: `/contract/${contractId}` }),
      transformResponse: (res) => {
        if (!res) return null;
        if (res.contract) return res.contract;
        if (res.data) return res.data;
        return res;
      },
      providesTags: (result, error, id) => [{ type: 'Contract', id }],
    }),

    // get proposal contract signed URL (cloudinary signed url)
    getProposalContractUrl: build.query({
      query: (id) => ({ url: `/contract/${id}/proposal-contract` }),
      transformResponse: (res) => {
        if (!res) return null;
        // endpoint returns { url }
        return res.url || null;
      },
    }),

    // get signed contract download URL (private download URL)
    getSignedContractUrl: build.query({
      query: (id) => ({ url: `/contract/${id}/signed-contract` }),
      transformResponse: (res) => {
        if (!res) return null;
        return res.url || null;
      },
    }),

    // batch fetch contracts by ids via GET /contract?ids=1,2,3
    getContractsByIds: build.query({
      query: (ids) => ({ url: `/contract?ids=${Array.isArray(ids) ? ids.join(',') : ids}` }),
      transformResponse: (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        return [];
      },
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [...result.map((r) => ({ type: 'Contract', id: r.id })), { type: 'Contract', id: 'LIST' }]
          : [{ type: 'Contract', id: 'LIST' }],
    }),

    // get service usage rows for a contract (maps to legacy /contract/:id/services)
    getContractServices: build.query({
      query: (id) => ({ url: `/contract/${id}/services` }),
      transformResponse: (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (res.data && Array.isArray(res.data)) return res.data;
        return [];
      },
      providesTags: (result, error, id) => [{ type: 'ContractServices', id }],
    }),

    // update contract (PATCH /contract/:id)
    updateContract: build.mutation({
      query: ({ id, body } = {}) => ({
        url: `/contract/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id } = {}) => [{ type: 'Contract', id }, { type: 'ContractList', id: 'assigned' }],
    }),


    // duyệt / không duyệt hợp đồng (BOD)
    approveContract: build.mutation({
      query: ({ id, approved }) => ({
        url: `/contract/${id}/approve`,
        method: 'POST',
        body: { approved },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contract', id },
        { type: 'ContractList', id: 'waiting_bod_approval' },
      ],
    }),

    // upload hợp đồng đã ký
    uploadSignedContract: build.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('signedContract', file);
        return {
          url: `/contract/${id}/sign`,
          method: 'PATCH',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contract', id },
        { type: 'ContractList', id: 'assigned' },
      ],
    }),

    // upload proposal từ HR
    uploadProposal: build.mutation({
      query: ({ id, file }) => {
        // backend expects the multipart field name 'proposalContract'
      const formData = new FormData();
      // include filename explicitly to ensure multer/file parsers receive correct original filename
      formData.append('proposalContract', file, file.name || 'proposal');
        return {
          url: `/contract/${id}/upload-contract`,
          method: 'PATCH',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contract', id },
        { type: 'ContractList', id: 'waiting_hr_confirm' },
      ],
    }),
    createContractFromOpportunity: build.mutation({
      query: ({ opportunityId, ...body }) => ({
        url: `contract/opportunity/${opportunityId}`, // tương ứng backend route
        method: 'POST',
        body,
      }),
      // cho phép invalidate cache nếu có liên quan đến Contract
      invalidatesTags: ['Contract', 'Opportunity'],
    }),
  }),
  
  overrideExisting: false,
});

export const {
  useGetContractsByStatusQuery,
  useApproveContractMutation,
  useUploadSignedContractMutation,
  useUploadProposalMutation,
  useCreateContractFromOpportunityMutation,
  useLazyGetProposalContractUrlQuery,
  useLazyGetSignedContractUrlQuery,
  useGetAllContractsQuery,
  useGetContractsByIdsQuery,
  useGetContractServicesQuery,
  useUpdateContractMutation,
  useGetContractByIdQuery
} = contractApi;
