import React, { useEffect, useState } from 'react';
import opportunityAPI from '../../api/opportunity.js';
import customerAPI from '../../api/customer.js';
import pickName from '../../utils/pickName.js';

export default function PendingOpportunities() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await opportunityAPI.getAllPending();
        const listData = Array.isArray(data) ? data : [];

        // enrich customer names for entries that only have customer_id
        const customerIds = Array.from(new Set(listData.map(o => o.customer_id).filter(Boolean)));
        if (customerIds.length > 0) {
          try {
            const fetched = await Promise.allSettled(customerIds.map(id => customerAPI.getById(id).catch(() => null)));
            const byId = {};
            fetched.forEach((r, idx) => {
              const id = customerIds[idx];
              if (r.status === 'fulfilled' && r.value) {
                byId[id] = r.value.name || r.value.customer_name || (r.value.customer && r.value.customer.name) || null;
              }
            });
            const enriched = listData.map(o => ({
              ...o,
              customer: o.customer || (o.customer_id ? { name: byId[o.customer_id] || o.customer_name || o.customer_temp || null } : o.customer)
            }));
            setList(enriched);
          } catch (e) {
            // if enrichment fails, still set the raw list
            setList(listData);
          }
        } else {
          setList(listData);
        }
      } catch (err) {
        console.error('failed to load pending opportunities', err);
        setError(err?.message || 'Failed to load pending opportunities');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleApprove(id) {
    if (!window.confirm('Bạn có chắc muốn duyệt cơ hội này?')) return;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      // Optionally, approver can include payment plan in body; we'll send empty body
      await opportunityAPI.approve(id, {});
      setList((l) => l.filter((x) => x.id !== id));
      alert('Đã duyệt');
    } catch (err) {
      console.error('approve failed', err);
      alert(err?.message || 'Approve failed');
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  async function handleReject(id) {
    if (!window.confirm('Bạn có chắc muốn từ chối cơ hội này?')) return;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await opportunityAPI.reject(id, {});
      setList((l) => l.filter((x) => x.id !== id));
      alert('Đã từ chối');
    } catch (err) {
      console.error('reject failed', err);
      alert(err?.message || 'Reject failed');
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cơ hội chờ duyệt</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-gray-600">Không có cơ hội nào đang chờ duyệt</div>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <div key={o.id} className="p-4 border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">Cơ hội #{o.id}</div>
                  <div className="text-sm text-gray-700">Customer: {o.customer?.name || o.customer_name || pickName(o.customer_temp) || o.customer_temp || 'Unknown'}</div>
                </div>
                <div className="space-x-2">
                  <button
                    disabled={actionLoading[o.id]}
                    onClick={() => handleApprove(o.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    {actionLoading[o.id] ? '...' : 'Duyệt'}
                  </button>
                  <button
                    disabled={actionLoading[o.id]}
                    onClick={() => handleReject(o.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    {actionLoading[o.id] ? '...' : 'Không duyệt'}
                  </button>
                </div>
              </div>
              {o.description && <div className="mt-2 text-sm text-gray-600">{o.description}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
