import React, { useEffect, useState } from 'react';
import contractAPI from '../api/contract';
import customerAPI from '../api/customer';

export default function AssignedContract() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
        try {
        const res = await contractAPI.getByStatusName('assigned');
        const arr = Array.isArray(res) ? res : (res && Array.isArray(res.items) ? res.items : []);
        // resolve customer names for contracts that only have customer_id
        const customerIds = Array.from(new Set(arr.map(c => c.customer_id).filter(Boolean)));
        const customerCache = {};
        if (customerIds.length > 0) {
          const fetched = await Promise.allSettled(customerIds.map(id => customerAPI.getById(id).catch(() => null)));
          fetched.forEach((r, idx) => {
            const id = customerIds[idx];
            if (r.status === 'fulfilled' && r.value) customerCache[id] = r.value;
          });
        }
        const enriched = arr.map(c => ({ ...c, customer: c.customer || (c.customer_id ? (customerCache[c.customer_id] || { name: c.customerName || c.customer_temp }) : c.customer) }));
        if (mounted) setContracts(enriched);
      } catch (err) {
        console.error('Failed to fetch assigned contracts', err);
        if (mounted) setError(err?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Hợp đồng (assigned)</h3>
      {loading ? <div className="text-sm text-gray-500">Đang tải...</div> : error ? <div className="text-sm text-red-600">{error}</div> : (
        <div className="space-y-3">
          {contracts.length === 0 ? <div className="text-sm text-gray-600">Không có hợp đồng assigned</div> : (
            contracts.map(c => (
              <div key={c.id || c._id} className="p-3 border rounded">
                <div className="font-medium">{c.code || c.title || `#${c.id || c._id}`}</div>
                <div className="text-sm text-gray-700">Khách hàng: {c.customer?.name || c.customerName || c.customer_temp || '—'}</div>
                <div className="text-sm text-gray-600">Trạng thái: {c.status || c.state || '—'}</div>
                {/* Optionally render services if present on contract */}
                {Array.isArray(c.services) && c.services.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Dịch vụ:</div>
                    <ul className="mt-1 text-sm list-disc list-inside space-y-1">
                      {c.services.map(s => (
                        <li key={s.id || s._id || s.service_id}>{s.name || s.service_name || s.title || `#${s.service_id || s.id || s._id}`}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
