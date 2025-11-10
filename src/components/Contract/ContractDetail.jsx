import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetContractByIdQuery,
  useGetContractServicesQuery,
  useApproveContractMutation,
  useLazyGetProposalContractUrlQuery,
  useLazyGetSignedContractUrlQuery,
} from '../../services/contract';
import { formatPrice } from '../../utils/FormatValue';
import { toast } from 'react-toastify';

export default function ContractDetail({ id: propId } = {}) {
  let routeId = null;
  try {
    const p = useParams();
    routeId = p?.id || null;
  } catch (e) {
    routeId = null;
  }
  const id = propId || routeId;

  const role = useSelector((s) => s.auth.role);

  const { data: contract, isLoading, isError, error, refetch } = useGetContractByIdQuery(id, { skip: !id });
  const { data: services } = useGetContractServicesQuery(id, { skip: !id });
  const [triggerGetProposalUrl, { data: proposalUrl, isFetching: isFetchingProposal }] = useLazyGetProposalContractUrlQuery();
  const [triggerGetSignedUrl, { data: signedUrl, isFetching: isFetchingSigned }] = useLazyGetSignedContractUrlQuery();

  const [approveContract, { isLoading: approving }] = useApproveContractMutation();

  const customer = useMemo(() => {
    if (!contract) return null;
    if (contract.customer) return contract.customer;
    if (contract.customer_id && Array.isArray(contract.customer)) return contract.customer;
    return null;
  }, [contract]);

  if (!id) return <div className="p-6">No contract id provided</div>;
  if (isLoading) return <div className="p-6">Loading contract...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load contract'}</div>;
  if (!contract) return <div className="p-6 text-gray-600">Contract not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 bg-white rounded shadow p-6">
          <h2 className="text-md font-semibold text-blue-700">Thông tin hợp đồng</h2>
          <hr className="my-4" />

          <div className="mb-4">
            <div className="text-xs text-gray-500">Tên hợp đồng</div>
            <div className="text-lg font-medium">{contract.name || contract.contract_name || '—'}</div>
          </div>

          {contract.description && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">Mô tả</div>
              <div className="text-sm text-gray-700">{contract.description}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Doanh thu</div>
              <div className="text-sm text-gray-700">{formatPrice(contract.total_revenue ?? contract.totalRevenue ?? contract.expected_revenue ?? 0)} VND</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Trạng thái</div>
              <div className="text-sm text-gray-700">{contract.status || '—'}</div>
            </div>
          </div>

          {Array.isArray(services) && services.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-500">Dịch vụ</div>
              <div className="mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left">Dịch vụ</th>
                      <th className="px-3 py-2 text-left">Số lượng</th>
                      <th className="px-3 py-2 text-left">Giá đề xuất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s, i) => (
                      <tr key={s.id ?? i} className="border-t">
                        <td className="px-3 py-2 align-top">{s.name || s.service_name || `#${s.service_id ?? s.id ?? i}`}</td>
                        <td className="px-3 py-2 align-top">{s.quantity ?? s.qty ?? 1}</td>
                        <td className="px-3 py-2 align-top">{formatPrice(s.proposed_price ?? s.price ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {contract.attachments && contract.attachments.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-500">Tệp đính kèm</div>
              <div className="mt-2 text-sm text-gray-700 space-y-2">
                {contract.attachments.map((a, i) => (
                  <div key={a.url || a.name || i}>
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {a.name || a.filename || `File ${i + 1}`}
                      </a>
                    ) : (
                      <span>{a.name || a.filename || `File ${i + 1}`}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-4 bg-white rounded shadow p-6">
          <div className="text-md font-semibold text-blue-700">Khách hàng</div>
          <hr className="my-4" />
          <div className="text-sm text-gray-700">
            <div className="mb-2"><p className="text-gray-500">Tên:</p> {customer?.name || contract.customer_temp?.name || '—'}</div>
            <div className="mb-2"><p className="text-gray-500">Điện thoại:</p> {customer?.phone || contract.customer_temp?.phone || '—'}</div>
            <div className="mb-2"><p className="text-gray-500">Email:</p> {customer?.email || contract.customer_temp?.email || '—'}</div>
            {(customer?.address || contract.customer_temp?.address) && <div className="mb-2"><p className="text-gray-500">Địa chỉ:</p> {customer?.address || contract.customer_temp?.address}</div>}
          </div>

          <div className="mt-6 flex gap-2">
            { (role === 'bod' || role === 'admin') && (
              <>
                <button
                  disabled={approving}
                  onClick={async () => {
                    if (!window.confirm('Bạn có chắc muốn duyệt hợp đồng này?')) return;
                    try {
                      await approveContract({ id: contract.id, approved: true }).unwrap();
                      toast.success('Đã duyệt hợp đồng');
                      try { refetch && refetch(); } catch (e) {}
                    } catch (err) {
                      console.error('approve contract failed', err);
                      toast.error(err?.message || 'Duyệt thất bại');
                    }
                  }}
                  className="px-3 py-1 rounded bg-green-600 text-white"
                >Duyệt</button>

                <button
                  onClick={async () => {
                    if (!window.confirm('Bạn có chắc muốn từ chối hợp đồng này?')) return;
                    try {
                      await approveContract({ id: contract.id, approved: false }).unwrap();
                      toast.success('Đã từ chối hợp đồng');
                      try { refetch && refetch(); } catch (e) {}
                    } catch (err) {
                      console.error('reject contract failed', err);
                      toast.error(err?.message || 'Từ chối thất bại');
                    }
                  }}
                  className="px-3 py-1 rounded bg-red-600 text-white"
                >Không duyệt</button>
              </>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex flex-col gap-2">
              {proposalUrl ? (
                <a href={proposalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Tải proposal</a>
              ) : (
                <button
                  disabled={isFetchingProposal}
                  onClick={async () => {
                    if (!id) return;
                    try {
                      const res = await triggerGetProposalUrl(id);
                      const url = res?.data ?? res;
                      if (url) {
                        // if backend returns direct string or { url }
                        const direct = typeof url === 'string' ? url : url?.url || url?.data || null;
                        if (direct) window.open(direct, '_blank');
                        else toast.info('Proposal được yêu cầu, refresh to xem nếu có');
                      } else {
                        toast.info('Không tìm thấy proposal');
                      }
                    } catch (err) {
                      console.error('fetch proposal url failed', err);
                      toast.error(err?.message || 'Lấy proposal thất bại');
                    }
                  }}
                  className="text-left text-blue-600 underline"
                >
                  Tải proposal
                </button>
              )}

              {signedUrl ? (
                <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Tải hợp đồng đã ký</a>
              ) : (
                <button
                  disabled={isFetchingSigned}
                  onClick={async () => {
                    if (!id) return;
                    try {
                      const res = await triggerGetSignedUrl(id);
                      const url = res?.data ?? res;
                      if (url) {
                        const direct = typeof url === 'string' ? url : url?.url || url?.data || null;
                        if (direct) window.open(direct, '_blank');
                        else toast.info('File ký được yêu cầu, refresh để kiểm tra');
                      } else {
                        toast.info('Không tìm thấy hợp đồng đã ký');
                      }
                    } catch (err) {
                      console.error('fetch signed url failed', err);
                      toast.error(err?.message || 'Lấy file đã ký thất bại');
                    }
                  }}
                  className="text-left text-blue-600 underline"
                >
                  Tải hợp đồng đã ký
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
