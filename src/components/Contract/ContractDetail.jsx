import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetContractByIdQuery,
  useGetContractServicesQuery,
  useApproveContractMutation,
  useLazyGetProposalContractUrlQuery,
  useLazyGetSignedContractUrlQuery,
} from '../../services/contract';
import { useUploadProposalMutation, useUploadSignedContractMutation } from '../../services/contract';
import { useGetCustomerByIdQuery } from '../../services/customer';
import { useGetDebtsByContractQuery, useGetDebtPaymentsByDebtQuery } from '../../services/debt';
import DebtCreateModal from '../ui/DebtCreateModal';
import { useGetServicesQuery } from '../../services/service';
import { formatPrice,formatDate } from '../../utils/FormatValue';
import { toast } from 'react-toastify';
import { CONTRACT_STATUS_LABELS, DEBT_STATUS } from '../../utils/enums'
import ViewQuoteModal from '../ui/ViewQuoteModal';

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
  const { data: servicesList = [] } = useGetServicesQuery();
  const [triggerGetProposalUrl, { data: proposalUrl, isFetching: isFetchingProposal }] = useLazyGetProposalContractUrlQuery();
  const [triggerGetSignedUrl, { data: signedUrl, isFetching: isFetchingSigned }] = useLazyGetSignedContractUrlQuery();

  const [approveContract, { isLoading: approving }] = useApproveContractMutation();
  const [uploadProposal, { isLoading: uploadingProposal }] = useUploadProposalMutation();
  const [uploadSigned, { isLoading: uploadingSigned }] = useUploadSignedContractMutation();


  const [localProposalFile, setLocalProposalFile] = React.useState(null);
  const [localSignedFile, setLocalSignedFile] = React.useState(null);

  const { data: fetchedCustomer } = useGetCustomerByIdQuery(contract?.customer_id, { skip: !contract?.customer_id });
  const navigate = useNavigate();

  const contractIdForDebt = contract?.id ?? contract?.contract_id ?? null;
  const { data: debtRows = [], refetch: refetchDebts } = useGetDebtsByContractQuery(contractIdForDebt, { skip: !contractIdForDebt });
  const [debtModalOpen, setDebtModalOpen] = React.useState(false);

  // Small row renderer that fetches payments for a debt and computes sums
  const DebtRow = ({ debt }) => {
    const debtId = debt?.id ?? debt?.debt_id;
    const { data: payments = [] } = useGetDebtPaymentsByDebtQuery(debtId, { skip: !debtId });
    const paidSum = Array.isArray(payments) ? payments.reduce((s, p) => s + (Number(p.paid_amount ?? p.amount ?? 0) || 0), 0) : 0;
    const total = Number(debt.amount ?? debt.debt_amount ?? 0) || 0;
    const remaining = total - paidSum;
    return (
      <tr className="border-t">
        <td className="px-3 py-2 align-top">{debt.title || `#${debtId}`}</td>
        <td className="px-3 py-2 align-top">{formatPrice(total)}</td>
        <td className="px-3 py-2 align-top">{formatPrice(paidSum)}</td>
        <td className="px-3 py-2 align-top">{formatPrice(remaining)}</td>
        <td className="px-3 py-2 align-top">{formatDate(debt.due_date)}</td>
        <td className="px-3 py-2 align-top">{DEBT_STATUS[debt.status] || '—'}</td>
        <td className="px-3 py-2 align-top">
          <button className="px-2 py-1 bg-yellow-600 text-white rounded text-sm" onClick={() => navigate(`/debt/${debtId}`)}>Xem</button>
        </td>
      </tr>
    );
  };

  const [viewQuoteOpen, setViewQuoteOpen] = React.useState(false);



  const customer = useMemo(() => {
    // prefer fetched customer (from customer_id), then nested contract.customer, then null
    if (fetchedCustomer) return fetchedCustomer;
    if (!contract) return null;
    if (contract.customer) return contract.customer;
    // some APIs might provide customer as array or missing; fallback to null
    return null;
  }, [contract, fetchedCustomer]);

  const getProposalInfo = (c) => {
    if (!c) return null;
    // common fields used in other components: proposal_file_url, proposal_file_name, files array
    const url = c.proposal_file_url || (Array.isArray(c.files) && c.files[0] && (c.files[0].url || c.files[0].path)) || null;
    const name = c.proposal_file_name || (Array.isArray(c.files) && c.files[0] && (c.files[0].name || c.files[0].filename)) || (url ? url.split('/').pop() : null);
    return { url, name };
  };

  const getSignedInfo = (c) => {
    if (!c) return null;
    const url = c.signed_file_url || (Array.isArray(c.files) && c.files.find(f => f.field === 'signedContract') && c.files.find(f => f.field === 'signedContract').url) || null;
    const name = c.signed_file_name || (Array.isArray(c.files) && c.files.find(f => f.field === 'signedContract') && (c.files.find(f => f.field === 'signedContract').name || c.files.find(f => f.field === 'signedContract').filename)) || (url ? url.split('/').pop() : null);
    return { url, name };
  };

  const proposalInfo = getProposalInfo(contract) || {};
  const signedInfo = getSignedInfo(contract) || {};

  if (!id) return <div className="p-6">No contract id provided</div>;
  if (isLoading) return <div className="p-6">Loading contract...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load contract'}</div>;
  if (!contract) return <div className="p-6 text-gray-600">Contract not found</div>;

  return (
    <>
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-4 text-left grid-rows-2">
        <div className="col-span-6 bg-white rounded shadow p-6 row-span-2 h-fit">
          <h2 className="text-md font-semibold text-blue-700">Thông tin hợp đồng</h2>
          <hr className="my-4" />
            <div className="mb-4 ">
              <div className="text-xs text-gray-500">Tên hợp đồng</div>
            <div className="text-lg font-medium text-blue-600">{contract.name || contract.contract_name || '—'}</div>
        

          </div>
            <div className="mb-4">
                <div className="text-xs text-gray-500">Mã hợp đồng</div>
                <div className="text-lg font-medium text-blue-600">{contract.code || '—'}</div>
            </div>
          
          {contract.description && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">Mô tả</div>
              <div className="text-sm text-gray-700">{contract.description}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">

            <div>
              <div className="text-xs text-gray-500">Trạng thái</div>
              <div className="text-sm text-gray-700">{CONTRACT_STATUS_LABELS[contract.status] || '—'}</div>
            </div>
          </div>

          {Array.isArray(services) && services.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-500">Dịch vụ</div>
              <div className="mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#e7f1fd]">
                      <th className="px-3 py-2 text-left text-blue-700">Tên dịch vụ</th>
                      <th className="px-3 py-2 text-left text-blue-700">Số lượng</th>
                      <th className="px-3 py-2 text-left text-blue-700">Giá bán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s, i) => (
                      <tr key={s.id ?? i} className="border-t">
                        <td className="px-3 py-2 align-top">{
                          s.name || s.service_name || (
                            s.service_id
                              ? (servicesList.find((ss) => ss.id == s.service_id || ss.service_id == s.service_id)?.name)
                              : null
                          ) || `#${s.service_id ?? s.id ?? i}`
                        }</td>
                        <td className="px-3 py-2 align-top">{s.quantity ?? s.qty ?? 1}</td>
                        <td className="px-3 py-2 align-top">{formatPrice(s.sale_price ?? s.price ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
            <div className='mt-6'>
              <div className="text-xs text-gray-500">Tổng tiền</div>
              <div className="text-sm text-gray-700">{formatPrice(contract.total_revenue ?? 0)} VND</div>
            </div>

          {/* Proposal / Signed fields (show name + view when available, otherwise allow upload) */}

          {contract?.status !== 'without_debt' && (
            <div className="mt-6">
              <div className="text-sm text-gray-500">Hợp đồng mẫu</div>
              <div className="text-sm text-gray-700 mt-2">
                {proposalInfo.name ? (
                  <div className="flex items-center gap-3">
                    <span className="truncate max-w-xs">{proposalInfo.name}</span>
                    <button
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                      onClick={async () => {
                        try {
                          const res = await triggerGetProposalUrl(contract.id);
                          const url = res?.data ?? res;
                          const direct = typeof url === 'string' ? url : url?.url || null;
                          if (direct) window.open(direct, '_blank');
                          else toast.info('Không thể lấy link proposal');
                        } catch (err) {
                          console.error('open proposal failed', err);
                          toast.error('Không thể mở proposal');
                        }
                      }}
                    >Xem</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input type="file" accept=".pdf,.docx,.doc" onChange={(e) => setLocalProposalFile(e.target.files?.[0] || null)} />
                    <button
                      disabled={uploadingProposal || !localProposalFile}
                      className="px-2 py-1 bg-blue-600 text-white rounded"
                      onClick={async () => {
                        if (!localProposalFile) return;
                        try {
                          await uploadProposal({ id: contract.id, file: localProposalFile }).unwrap();
                          toast.success('Upload proposal thành công');
                          setLocalProposalFile(null);
                          try { refetch && refetch(); } catch (e) {}
                        } catch (err) {
                          console.error('upload proposal failed', err);
                          toast.error(err?.data?.message || err?.message || 'Upload thất bại');
                        }
                      }}
                    >{uploadingProposal ? 'Đang tải...' : 'Tải lên'}</button>
                  </div>
                )}
              </div>
            </div>
          )}

            
            {contract?.status !== 'waiting_bod_approval' && contract?.status !== 'waiting_hr_confirm' && contract?.status !== 'without_debt' 
            && (
              <div className="mt-4">
              <div className="text-sm text-gray-500">Hợp đồng đã ký</div>
              <div className="text-sm text-gray-700 mt-2">
                {signedInfo.name ? (
                  <div className="flex items-center gap-3">
                    <span className="truncate max-w-xs">{signedInfo.name}</span>
                    <button
                      className=" text-sm bg-blue-600 text-white px-2 py-1 rounded"
                      onClick={async () => {
                        try {
                          const res = await triggerGetSignedUrl(contract.id);
                          const url = res?.data ?? res;
                          const direct = typeof url === 'string' ? url : url?.url || null;
                          if (direct) window.open(direct, '_blank');
                          else toast.info('Không thể lấy link file đã ký');
                        } catch (err) {
                          console.error('open signed failed', err);
                          toast.error('Không thể mở file đã ký');
                        }
                      }}
                    >Xem</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input type="file" accept=".pdf" onChange={(e) => setLocalSignedFile(e.target.files?.[0] || null)} />
                    <button
                      disabled={uploadingSigned || !localSignedFile}
                      className="px-2 py-1 bg-blue-600 text-white rounded"
                      onClick={async () => {
                        if (!localSignedFile) return;
                        try {
                          await uploadSigned({ id: contract.id, file: localSignedFile }).unwrap();
                          toast.success('Upload hợp đồng đã ký thành công');
                          setLocalSignedFile(null);
                          try { refetch && refetch(); } catch (e) {}
                        } catch (err) {
                          console.error('upload signed failed', err);
                          toast.error(err?.data?.message || err?.message || 'Upload thất bại');
                        }
                      }}
                    >{uploadingSigned ? 'Đang tải...' : 'Tải lên'}</button>
                  </div>
                )}
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

        <div className="col-span-6 bg-white rounded shadow p-6 h-fit">
          <div>
            <div className="text-md font-semibold text-blue-700">Khách hàng</div>
            <hr className="my-4" />
            <div className="text-sm text-gray-700 grid grid-cols-2">
              <div className="mb-2"><p className="text-gray-500">Tên:</p> {customer?.name || contract.customer_temp?.name || '—'}</div>
              <div className="mb-2"><p className="text-gray-500">Điện thoại:</p> {customer?.phone || contract.customer_temp?.phone || '—'}</div>
              <div className="mb-2"><p className="text-gray-500">Email:</p> {customer?.email || contract.customer_temp?.email || '—'}</div>
              <div className="mb-2"><p className="text-gray-500">CMND/Hộ chiếu:</p> {customer?.identity_code || '—'}</div>
              {(customer?.address || contract.customer_temp?.address) && <div className="mb-2"><p className="text-gray-500">Địa chỉ:</p> {customer?.address || contract.customer_temp?.address}</div>}
            </div>
          </div>
          <div>
            
          </div>
 

          {/* <button
              className='bg-blue-600 px-2 py-1 text-white rounded'
              onClick={() => {
                const oppId = contract?.opportunity_id || contract?.opportunity?.id;
                if (!oppId) {
                  toast.info('Không có báo giá liên quan đến hợp đồng này');
                  return;
                }
                setViewQuoteOpen(true);
              }}
            >
              Xem báo giá
          </button> */}
        </div>

          {Array.isArray(debtRows) && debtRows.length > 0 ? (
            <div className=" col-span-6 bg-yellow-50 border border-yellow-100 rounded p-4 h-fit shadow items-start">
              <div className="text-md font-semibold text-yellow-700">Lộ trình thanh toán</div>
              <hr className="my-2" />
              <div className="text-sm text-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#fff7e6]">
                      <th className="px-3 py-2 text-left text-yellow-700">Tiêu đề</th>
                      <th className="px-3 py-2 text-left text-yellow-700">Tổng nợ</th>
                      <th className="px-3 py-2 text-left text-yellow-700">Đã trả</th>
                      <th className="px-3 py-2 text-left text-yellow-700">Còn lại</th>
                      <th className="px-3 py-2 text-left text-yellow-700">Ngày hết hạn</th>
                      <th className="px-3 py-2 text-left text-yellow-700">Trạng thái</th>
                      <th className="px-3 py-2 text-left text-yellow-700">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debtRows.map((d, i) => (
                      <DebtRow key={d.id ?? d.debt_id ?? i} debt={d} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <button
                className="px-2 mb-4 w-[8rem] py-1 bg-yellow-600 text-white rounded text-md"
                onClick={() => setDebtModalOpen(true)}
              >Tạo lộ trình thanh toán</button>
            </div>
          )}

          {debtModalOpen && (
            <DebtCreateModal
              activeContract={contract}
              onClose={() => setDebtModalOpen(false)}
              onSuccess={() => { setDebtModalOpen(false); try { refetchDebts && refetchDebts(); } catch (e) {} }}
            />
          )}
        
      </div>
      
        {(role === 'bod' || role === 'admin' && contract.status == 'waiting_bod_approval') && (
            <div className="ml-4 flex items-center gap-2 mt-6">
      <button
        disabled={approving}
        onClick={async () => {
        if (!window.confirm('Bạn có chắc muốn duyệt hợp đồng này?')) return;
        try {
          // call backend approve endpoint
          await approveContract({ id: contract.id, approved: true }).unwrap();
          toast.success('Đã duyệt hợp đồng');
          // RTK Query invalidation should refetch, but call refetch to be safe
          try { refetch && refetch(); } catch (e) { /* ignore */ }
        } catch (err) {
          console.error('approve failed', err);
          toast.error(err?.data?.error || err?.message || 'Duyệt thất bại');
        }
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {approving ? 'Đang...' : 'Duyệt'}
      </button>

      <button
        disabled={approving}
        onClick={async () => {
        if (!window.confirm('Bạn có chắc muốn từ chối hợp đồng này?')) return;
        try {
          // call same approve endpoint but with approved=false (server should interpret as rejection)
          await approveContract({ id: contract.id, approved: false }).unwrap();
          toast.success('Đã từ chối hợp đồng');
          try { refetch && refetch(); } catch (e) { /* ignore */ }
        } catch (err) {
          console.error('reject failed', err);
          toast.error(err?.data?.error || err?.message || 'Từ chối thất bại');
        }
        }}
        className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded "
      >
        Không duyệt
      </button>
        </div>
        )}
    </div>
    {/* <ViewQuoteModal
      isOpen={viewQuoteOpen}
      onClose={() => setViewQuoteOpen(false)}
      opportunity={{ id: contract?.opportunity_id || contract?.opportunity?.id, name: contract?.name || contract?.contract_name }}
    /> */}
    </>
  );
}
