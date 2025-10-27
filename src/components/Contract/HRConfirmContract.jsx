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
      const enriched = arr.map(c => ({
        ...c,
        customer: c.customer || (c.customer_id ? { name: byId[c.customer_id] || c.customerName || c.customer_temp || null } : c.customer)
      }));
      setList(enriched);
    } catch (err) {
      console.error('Lỗi get các hợp đồng đợi hr xác nhận', err);
      setError(err?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadContractDoc = async (contract) => {
    try {
      setActionLoading(s => ({ ...s, [contract.id]: true }));
      const blob = await generateContractDocxBlob(contract);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract.code || 'contract'}-${contract.id}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate docx', err);
      alert('Không thể tạo file docx');
    } finally {
      setActionLoading(s => ({ ...s, [contract.id]: false }));
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
      fetchContracts();
      alert(res?.message || 'Tải lên thành công');
    } catch (err) {
      console.error(err);
      alert('Tải lên thất bại: ' + (err?.message || String(err)));
    } finally {
      setActionLoading(s => ({ ...s, [contract.id]: false }));
    }
  };

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Hợp đồng đợi HR xác nhận</h3>
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
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Mã hợp đồng</th>
                    <th className="px-4 py-2">Khách hàng</th>
                    <th className="px-4 py-2">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-3 align-top">{c.code || '-'}</td>
                      <td className="px-4 py-3 align-top">{c.customer?.name || '-'}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <button onClick={() => downloadContractDoc(c)} disabled={actionLoading[c.id]} className="px-2 py-1 bg-indigo-600 text-white rounded">
                            {actionLoading[c.id] ? 'Đang...' : 'Tải Word'}
                          </button>
                          <label className="ml-1">
                            <input type="file" onChange={(e) => handleFileChange(c.id, e)} className="hidden" />
                            <span className="px-2 py-1 bg-gray-100 border rounded cursor-pointer text-sm">Chọn file</span>
                          </label>
                          {/* show selected file name if any */}
                          {fileInputs[c.id] ? (
                            <span className="ml-1 text-sm text-gray-700 max-w-xs truncate" title={fileInputs[c.id].name}>{fileInputs[c.id].name}</span>
                          ) : null}
                          <button onClick={() => handleUploadProposal(c)} disabled={actionLoading[c.id]} className="px-2 py-1 bg-green-600 text-white rounded">
                            {actionLoading[c.id] ? 'Đang...' : 'Tải lên'}
                          </button>
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
