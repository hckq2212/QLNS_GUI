import React, { useEffect, useState } from 'react';
import contractAPI from '../../api/contract.js';
import customerAPI from '../../api/customer.js';
import generateContractDocxBlob from '../../utils/ProposeContractDocx.js';

export default function HRConfirmContract() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [fileInputs, setFileInputs] = useState({});
  const [uploadedUrls, setUploadedUrls] = useState({});

  const fetchContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contractAPI.getByStatus({ status: 'waiting_hr_confirm' });
      const arr = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
      const customerIds = Array.from(new Set(arr.map(c => c.customer_id).filter(Boolean)));
      console.log(arr)
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
      setList(enriched);
    } catch (err) {
      console.error('Lỗi get các hợp đồng đợi hr xác nhận', err);
      setError(err?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContracts(); }, []);

  const downloadContractDoc = async (c) => {
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
  };

  const handleFileChange = (contractId, e) => {
    const file = e?.target?.files && e.target.files[0];
    setFileInputs(s => ({ ...s, [contractId]: file }));
  };

  const handleUploadProposal = async (contract) => {
    const file = fileInputs[contract.id];
    if (!file) return alert('Vui lòng chọn file trước khi tải lên');
    try {
      setActionLoading(s => ({ ...s, [contract.id]: true }));
      const res = await contractAPI.uploadProposalContract(contract.id, file);
      if (res && res.url) {
        setUploadedUrls(s => ({ ...s, [contract.id]: res.url }));
      }
      setActionLoading(s => ({ ...s, [contract.id]: false }));
      fetchContracts();
      alert(res?.message || 'Tải lên thành công');
    } catch (err) {
      console.error(err);
      setActionLoading(s => ({ ...s, [contract.id]: false }));
      alert('Tải lên thất bại: ' + (err?.message || String(err)));
    }
  };

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Hợp đồng đợi HR xác nhận</h3>
      {loading ? <div className="text-sm text-gray-500">Đang tải...</div> : error ? <div className="text-sm text-red-600">{error}</div> : (
        <div className="space-y-3">
          {list.length === 0 ? <div className="text-sm text-gray-600">Không có hợp đồng</div> : (
            list.map(c => (
              <div key={c.id} className="p-3 border rounded">
                <div className="font-medium">Hợp đồng {c.code}</div>
                <div className="text-sm text-gray-700">Khách hàng: {c.customer?.name ||  (c.customer_temp.name) || '—'}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => downloadContractDoc(c)} disabled={actionLoading[c.id]} className="px-2 py-1 bg-indigo-600 text-white rounded">
                    {actionLoading[c.id] ? 'Đang tải...' : 'Tải Word'}
                  </button>
                  <input type="file" onChange={(e) => handleFileChange(c.id, e)} className="ml-2" />
                  <button onClick={() => handleUploadProposal(c)} disabled={actionLoading[c.id]} className="px-2 py-1 bg-green-600 text-white rounded">
                    {actionLoading[c.id] ? 'Đang tải...' : 'Tải lên proposal'}
                  </button>
                </div>
                {uploadedUrls[c.id] && (
                  <div className="mt-2 text-sm text-blue-600">Uploaded: <a href={uploadedUrls[c.id]} target="_blank" rel="noreferrer" className="underline">{uploadedUrls[c.id]}</a></div>
                )}
                {c.proposalContractUrl && !uploadedUrls[c.id] && (
                  <div className="mt-2 text-sm">Đã có file: <a href={c.proposalContractUrl} target="_blank" rel="noreferrer" className="underline">Xem</a></div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
