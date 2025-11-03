// services/contract.js
import { api } from './api';

export const contractApi = api.injectEndpoints({
  endpoints: (build) => ({
    // lấy theo status: waiting_hr_confirm, waiting_bod_approval, not_assigned, without_debt
    getContractsByStatus: build.query({
      query: (status) => ({
        url: `/contract`,
        params: { status },
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
        formData.append('file', file);
        return {
          url: `/contract/${id}/sign`,
          method: 'POST',
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
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/contract/${id}/upload-contract`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contract', id },
        { type: 'ContractList', id: 'waiting_hr_confirm' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetContractsByStatusQuery,
  useApproveContractMutation,
  useUploadSignedContractMutation,
  useUploadProposalMutation,
} = contractApi;
