import React, { useEffect, useState } from 'react';
import contractAPI from '../api/contract.js';
import customerAPI from '../api/customer.js';


  async function handleAction(id, approve) {
    const confirmMsg = approve ? 'Bạn có chắc muốn duyệt hợp đồng này?' : 'Bạn có chắc muốn từ chối hợp đồng này?';
    if (!window.confirm(confirmMsg)) return;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      // send payload indicating approval or rejection. Backend should accept { approved: true/false }
      await contractAPI.approve(id, { approved: approve });
      // remove from list
      setContracts((c) => c.filter((x) => x.id !== id));
    } catch (err) {
      console.error('action failed', err);
      alert(err?.message || 'Action failed');
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

export default function ContractWaitingBODApproval() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [activeContract, setActiveContract] = useState(null);
  const [actionLoading, setActionLoading] = useState({});


  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await contractAPI.getByStatus({ status: 'waiting_bod_approval' });
        console.log(data)
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
            list.map(c => (
              <div key={c.id} className="p-3 border rounded">
                <div className="font-medium">Hợp đồng {c.code}</div>
                <div className="text-sm text-gray-700">Khách hàng: {c.customer?.name || c.customerName || c.customer_temp || '—'}</div>
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
                </div>
            </div>
            ))
          )}
        </div>
      )}
              
            {/* Debt modal */}
            {showDebtModal && activeContract && (
                <DebtCreateModal
                  activeContract={activeContract}
                  onClose={() => { setShowDebtModal(false); setActiveContract(null); }}
                  onSuccess={() => { setShowDebtModal(false); setActiveContract(null); setReloadCounter(c => c + 1); }}
                />
            )}
    </div>
  );
}


