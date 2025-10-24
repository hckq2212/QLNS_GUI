import React, { useEffect, useState } from 'react';
import contractAPI from '../../api/contract.js';
import customerAPI from '../../api/customer.js';

export default function ContractWaitingBODApproval() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [activeContract, setActiveContract] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [showDetails, setShowDetails] = useState({});

  const toggleDetails = (id) => setShowDetails(s => ({ ...s, [id]: !s[id] }));

  // helper to find the uploaded proposal URL regardless of naming
  const getProposalUrl = (c) => {
    return (
      c?.proposalContractUrl ||
      c?.proposal_contract_url ||
      c?.proposal_file_url ||
      c?.proposalFileUrl ||
      c?.proposalUrl ||
      c?.file_url ||
      c?.url ||
      (Array.isArray(c?.files) && c.files[0] && (c.files[0].url || c.files[0].path)) ||
      null
    );
  };

  // action handler must live inside component to access state setters
  const handleAction = async (id, approve) => {
    const confirmMsg = approve ? 'Bạn có chắc muốn duyệt hợp đồng này?' : 'Bạn có chắc muốn từ chối hợp đồng này?';
    if (!window.confirm(confirmMsg)) return;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await contractAPI.approve(id, { approved: approve });
      setList((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error('action failed', err);
      alert(err?.message || 'Action failed');
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  };


  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await contractAPI.getByStatus({ status: 'waiting_bod_approval' });
        const arr = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
        // enrich with customer name when customer_id present
        const customerIds = Array.from(new Set(arr.map(c => c.customer_id).filter(Boolean)));
        const byId = {};
        if (customerIds.length > 0) {
          const fetched = await Promise.allSettled(customerIds.map(id => customerAPI.getById(id).catch(() => null)));
          fetched.forEach((r, idx) => {
            const id = customerIds[idx];
            if (r.status === 'fulfilled' && r.value) {
              byId[id] = r.value.name || r.value.customer_name || (r.value.customer && r.value.customer.name) || null;
            }
          });
        }
        const enriched = arr.map(c => ({ ...c, customer: c.customer || (c.customer_id ? { name: byId[c.customer_id] || c.customerName || c.customer_temp || null } : c.customer) }));
        if (mounted) setList(enriched);
      } catch (err) {
        console.error('Lỗi get các hợp đồng đợi bod duyệt', err);
        if (mounted) setError(err?.message || 'Failed to load');
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Hợp đồng đợi BOD duyệt</h3>
            {loading ? <div className="text-sm text-gray-500">Đang tải...</div> : error ? <div className="text-sm text-red-600">{error}</div> : (
        <div className="space-y-3">
          {list.length === 0 ? <div className="text-sm text-gray-600">Không có hợp đồng</div> : (
            list.map(c => {
              const url = getProposalUrl(c);
              return (
              <div key={c.id} className="p-3 border rounded">
                <div className="font-medium">Hợp đồng {c.code}</div>
                <div className="text-sm text-gray-700">Khách hàng: {c.customer?.name || (c.customer_temp.name) || '—'}</div>
                                    <div className="space-x-2">
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
                  <button
                    onClick={() => toggleDetails(c.id)}
                    className="bg-gray-200 text-gray-800 px-3 py-1 rounded"
                  >
                    {showDetails[c.id] ? 'Ẩn chi tiết' : 'Chi tiết'}
                  </button>
                </div>
                {url && (
                  <div className="mt-2 text-sm">URL: <a href={url} target="_blank" rel="noreferrer" className="underline">{url}</a></div>
                )}
                {showDetails[c.id] && (
                  <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(c, null, 2)}</pre>
                )}
              </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}


