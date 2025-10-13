import React, { useEffect, useState } from 'react';
import opportunityAPI from '../api/opportunity.js';

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
        setList(Array.isArray(data) ? data : []);
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
      <h2 className="text-2xl font-bold mb-4">Pending Opportunities</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-gray-600">No pending opportunities</div>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <div key={o.id} className="p-4 border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">Opportunity #{o.id}</div>
                  <div className="text-sm text-gray-700">Customer: {o.customer?.name || o.customer_name || o.customer_temp || 'Unknown'}</div>
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
