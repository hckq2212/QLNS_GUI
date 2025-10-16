import React, { useEffect, useState } from 'react';
import contractAPI from '../api/contract.js';
import customerAPI from '../api/customer.js';
import generateContractDocxBlob from '../utils/docxHelper.js';



export default function HRConfirmContract() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});


  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await contractAPI.getByStatus({ status: 'waiting_hr_confirm' });
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

  async function downloadContractDoc(c) {
    if (!c) return;
    setActionLoading(p => ({ ...p, [c.id]: true }));
    try {
      const blob = await generateContractDocxBlob(c);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = (c.code || c.contract_number || `contract-${c.id}`) + '.docx';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('generate doc failed', err);
      alert('Tạo file .docx thất bại: ' + (err?.message || String(err)));
    } finally {
      setActionLoading(p => ({ ...p, [c.id]: false }));
    }
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Hợp đồng đợi HR xác nhận</h3>
            {loading ? <div className="text-sm text-gray-500">Đang tải...</div> : error ? <div className="text-sm text-red-600">{error}</div> : (
        <div className="space-y-3">
          {list.length === 0 ? <div className="text-sm text-gray-600">Không có hợp đồng</div> : (
            list.map(c => (
              <div key={c.id} className="p-3 border rounded">
                <div className="font-medium">Hợp đồng {c.code}</div>
                <div className="text-sm text-gray-700">Khách hàng: {c.customer?.name || c.customerName || c.customer_temp || '—'}</div>
                <div className="mt-2">
                  <button onClick={() => downloadContractDoc(c)} disabled={actionLoading[c.id]} className="px-2 py-1 bg-indigo-600 text-white rounded">
                    {actionLoading[c.id] ? 'Đang tải...' : 'Tải Word'}
                  </button>
                </div>
            </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}


