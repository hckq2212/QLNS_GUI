import React, { useEffect, useState } from 'react';
import contractAPI from '../api/contract.js';
import opportunityAPI from '../api/opportunity.js';

export default function ContractsPending() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await opportunityAPI.getAllPending();
        setContracts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('failed to load pending contracts', err);
        setError(err?.message || 'Failed to load pending contracts');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Pending Contracts</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : contracts.length === 0 ? (
        <div className="text-sm text-gray-600">No pending contracts</div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <div key={c.id} className="p-4 border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">Contract #{c.id} — {c.contract_number || 'No number'}</div>
                  <div className="text-sm text-gray-700">Customer: {c.customer?.name || c.customer_name || c.customer_temp || 'Unknown'}</div>
                </div>
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
              {c.description && <div className="mt-2 text-sm text-gray-600">{c.description}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
