import React, { useEffect, useState } from 'react';
import contractAPI from '../../api/contract.js';
import customerAPI from '../../api/customer.js';
import { toast } from 'react-toastify';
import { formatPrice } from '../../utils/FormatValue.js';

export default function ContractWaitingBODApproval() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});


  // helper to find the uploaded proposal URL regardless of naming
  const getProposalUrl = (c) => {
    return (
      c?.proposal_file_url ||
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
      toast.success('Duyệt hợp đồng thành công')
    } catch (err) {
      console.error('action failed', err);
      toast.error('Duyệt hợp đồng thất bại')
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
                    <th className="px-4 py-2">Tổng vốn (dự kiến)</th>
                    <th className="px-4 py-2">Tổng lợi nhuận (dự kiến)</th>
                    <th className="px-4 py-2">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-3 align-top">{c.code || '-'}</td>
                      <td className="px-4 py-3 align-top">{c.customer?.name || '—'}</td>
                      <td className="px-4 py-3 align-top text-sm text-gray-700">{formatPrice(c.total_cost)}</td>
                      <td className="px-4 py-3 align-top text-sm text-gray-700">{formatPrice(c.total_revenue)}</td>
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


