import React, { useEffect, useState } from 'react';
import { useGetContractsByStatusQuery, useApproveContractMutation } from '../../services/contract';
import { useGetAllCustomerQuery } from '../../services/customer';

export default function ContractWaitingBODApproval() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [activeContract, setActiveContract] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [showDetails, setShowDetails] = useState({});


  // helper to find the uploaded proposal URL regardless of naming
  const getProposalUrl = (c) => {
    return (
      c?.proposal_file_url ||
      (Array.isArray(c?.files) && c.files[0] && (c.files[0].url || c.files[0].path)) ||
      null
    );
  };

  // action handler must live inside component to access state setters
  const [approveContract] = useApproveContractMutation();

  const handleAction = async (id, approve) => {
    const confirmMsg = approve ? 'Bạn có chắc muốn duyệt hợp đồng này?' : 'Bạn có chắc muốn từ chối hợp đồng này?';
    if (!window.confirm(confirmMsg)) return;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await approveContract({ id, body: { approved: approve } }).unwrap();
      // refetches via RTK Query invalidation; remove locally for instant UI feedback
      setList((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error('action failed', err);
      alert(err?.data?.message || err?.message || 'Action failed');
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  };


  // Use RTK Query to fetch contracts and customers
  const {
    data: contractsData,
    isLoading: contractsLoading,
    isError: contractsIsError,
    error: contractsError,
  } = useGetContractsByStatusQuery('waiting_bod_approval');

  const { data: customersData, isLoading: customersLoading } = useGetAllCustomerQuery();

  useEffect(() => {
    setLoading(contractsLoading || customersLoading);
  }, [contractsLoading, customersLoading]);

  useEffect(() => {
    if (contractsIsError) {
      console.error('Lỗi get các hợp đồng đợi bod duyệt', contractsError);
      setError(contractsError?.message || 'Failed to load');
      setList([]);
      return;
    }
    const arr = Array.isArray(contractsData) ? contractsData : [];
    const byId = {};
    if (Array.isArray(customersData)) {
      customersData.forEach((c) => {
        byId[c.id] = c.name || c.customer_name || (c.customer && c.customer.name) || null;
      });
    }
    const enriched = arr.map((c) => ({
      ...c,
      customer: c.customer || (c.customer_id ? { name: byId[c.customer_id] || c.customerName || c.customer_temp || null } : c.customer),
    }));
    setList(enriched);
    setError(null);
  }, [contractsData, contractsIsError, contractsError, customersData]);

  return (
    <div className="p-4">
      {loading ? (
        <div className="text-sm text-gray-500">Đang tải...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <div>
          {list.length === 0 ? (
            <div className="text-sm text-gray-600">Không có hợp đồng</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded border">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Mã hợp đồng</th>
                    <th className="px-4 py-2">Khách hàng</th>
                    <th className="px-4 py-2">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-3 align-top">{c.code || '-'}</td>
                      <td className="px-4 py-3 align-top">{c.customer?.name || c.customer_temp?.name || '—'}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={actionLoading[c.id]}
                            onClick={() => handleAction(c.id, true)}
                            className="bg-green-600 text-white px-3 py-1 rounded"
                          >
                            {actionLoading[c.id] ? '...' : 'Duyệt'}
                          </button>
                          <button
                            disabled={actionLoading[c.id]}
                            onClick={() => handleAction(c.id, false)}
                            className="bg-red-600 text-white px-3 py-1 rounded"
                          >
                            {actionLoading[c.id] ? '...' : 'Không duyệt'}
                          </button>
                          {getProposalUrl(c) ? (
                            <button
                              onClick={() => window.open(getProposalUrl(c), '_blank', 'noopener')}
                              className="bg-blue-600 text-white px-3 py-1 rounded"
                            >
                              Xem
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


