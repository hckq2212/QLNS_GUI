import React, { useEffect, useState } from 'react';
import contractAPI from '../api/contract';
import customerAPI from '../api/customer';

export default function AssignedContract() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
    const [uploadLoading, setUploadLoading] = useState({});
    const [uploadResult, setUploadResult] = useState({});

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
      <h3 className="font-semibold mb-3">Hợp đồng đã phân công</h3>
      {loading ? <div className="text-sm text-gray-500">Đang tải...</div> : error ? <div className="text-sm text-red-600">{error}</div> : (
        <div className="space-y-3">
          {contracts.length === 0 ? <div className="text-sm text-gray-600">Không có hợp đồng đã phân công</div> : (
            contracts.map(c => (
              <div key={c.id || c._id} className="p-3 border rounded">
                <div className="font-medium">{c.code || c.title || `#${c.id || c._id}`}</div>
                <div className="text-sm text-gray-700">Khách hàng: {c.customer?.name || c.customerName || c.customer_temp || '—'}</div>
                <div className="text-sm text-gray-600">Trạng thái: {c.status || c.state || '—'}</div>
                <div className="mt-2 flex items-center gap-2">
                  <input type="file" accept=".pdf" onChange={(e) => setUploadResult(r => ({ ...r, [c.id || c._id]: { file: e.target.files[0] } }))} />
                  <button className="px-2 py-1 bg-indigo-600 text-white rounded" disabled={uploadLoading[c.id] || !uploadResult[c.id || c._id]?.file}
                    onClick={async () => {
                      const cid = c.id || c._id;
                      const file = uploadResult[cid]?.file;
                      if (!file) return;
                      try {
                        setUploadLoading(s => ({ ...s, [cid]: true }));
                        const res = await contractAPI.uploadSignedContract(cid, file);
                        // res contains url, cloudinary_url etc
                        setUploadResult(s => ({ ...s, [cid]: { ...s[cid], res } }));
                      } catch (err) {
                        console.error('Upload signed contract failed', err);
                        try { alert('Upload thất bại'); } catch(e) {}
                      } finally {
                        setUploadLoading(s => ({ ...s, [cid]: false }));
                      }
                    }}
                  >{uploadLoading[c.id] ? 'Đang tải...' : 'Upload file đã ký'}</button>
                </div>
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
