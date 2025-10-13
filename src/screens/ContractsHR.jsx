import React, { useEffect, useState } from 'react';
import contractAPI from '../api/contract.js';
import customerAPI from '../api/customer.js';
import generateContractDocxBlob from '../utils/docxHelper.js';

export default function ContractsHR() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputs, setInputs] = useState({});
  const [files, setFiles] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [serviceUsages, setServiceUsages] = useState({});
  const [customerCache, setCustomerCache] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await contractAPI.getPending();
        const list = Array.isArray(data) ? data : [];
        setContracts(list);
        // preload customer info for contracts that only have customer_id
        (async function preloadCustomers() {
          const missing = [];
          for (const ct of list) {
            const cid = ct.customer_id || (ct.customer && ct.customer.id) || null;
            if (cid && !customerCache[cid]) missing.push(cid);
          }
          if (missing.length === 0) return;
          const uniq = Array.from(new Set(missing));
          try {
            const promises = uniq.map((id) => customerAPI.getById(id).catch(() => null));
            const results = await Promise.all(promises);
            const map = {};
            results.forEach((r, idx) => {
              const id = uniq[idx];
              if (r) map[id] = r;
            });
            if (Object.keys(map).length) setCustomerCache((c) => ({ ...c, ...map }));
          } catch (e) {
            console.warn('preload customers failed', e);
          }
        })();
      } catch (err) {
        console.error('failed to load pending contracts', err);
        setError(err?.message || 'Failed to load pending contracts');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function setInputValue(id, key, value) {
    setInputs((p) => ({ ...p, [id]: { ...(p[id] || {}), [key]: value } }));
  }

  function setFileFor(id, file) {
    setFiles((p) => ({ ...p, [id]: file }));
  }

  function isPdf(file) {
    if (!file) return false;
    const t = file.type || '';
    const n = file.name || '';
    return t === 'application/pdf' || n.toLowerCase().endsWith('.pdf');
  }

  function getUploadedFileUrl(resp) {
    if (!resp) return null;
    if (typeof resp === 'string') return resp;
    return (
      resp.url || resp.file_url || resp.fileUrl || resp.file || resp.data?.url || resp.data?.file_url || resp.data?.fileUrl || null
    );
  }

  async function fetchServiceUsage(contractId) {
    setServiceUsages((s) => ({ ...s, [contractId]: { loading: true, rows: null, error: null, open: true } }));
    try {
      const rows = await contractAPI.getServiceUsage(contractId);
      setServiceUsages((s) => ({ ...s, [contractId]: { loading: false, rows: Array.isArray(rows) ? rows : [], error: null, open: true } }));
    } catch (err) {
      console.error('failed to fetch service usage', err);
      setServiceUsages((s) => ({ ...s, [contractId]: { loading: false, rows: null, error: err?.message || String(err), open: true } }));
    }
  }

  function buildContractHtml(contract) {
    const customerName = contract.customer?.name || contract.customer_name || contract.customer_temp || '';
    const contractCode = contract.code || contract.contract_number || '';
    const description = contract.description || '';

    // try several likely item collections
    const items = contract.items || contract.services || contract.contract_items || contract.line_items || contract.jobs || [];

    const styles = `
      <style>
        body { font-family: Arial, Helvetica, sans-serif; padding: 20px; }
        h1 { font-size: 18px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th, td { border: 1px solid #444; padding: 6px 8px; text-align: left; }
        th { background: #f3f3f3; }
      </style>
    `;

    const itemsRows = Array.isArray(items) && items.length > 0
      ? items.map((it, idx) => {
          const name = it.name || it.title || it.service_name || it.description || `Item ${idx + 1}`;
          const qty = it.quantity ?? it.qty ?? it.qty ?? '';
          const unit = it.unit_price ?? it.unitPrice ?? it.price ?? '';
          const amount = it.amount ?? (qty && unit ? (Number(qty) * Number(unit)) : it.total) ?? '';
          return `<tr><td>${idx + 1}</td><td>${name}</td><td>${qty}</td><td>${unit}</td><td>${amount}</td></tr>`;
        }).join('')
      : '<tr><td colspan="5">No items available</td></tr>';

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          ${styles}
        </head>
        <body>
          <h1>Contract ${contractCode}</h1>
          <p><strong>Customer:</strong> ${customerName}</p>
          ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
          <h2>Items / Services</h2>
          <table>
            <thead>
              <tr><th>#</th><th>Name</th><th>Quantity</th><th>Unit Price</th><th>Amount</th></tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </body>
      </html>
    `;
    return html;
  }

  function downloadHtmlAsWord(html, filename) {
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleConfirm(id) {
    const val = inputs[id] || {};
    const code = val.code || null;
    const f = files[id];
    // require PDF file before confirming
    if (!f) {
      alert('Vui lòng upload file PDF hợp đồng đã ký trước khi xác nhận.');
      return;
    }
    if (!isPdf(f)) {
      alert('File phải là PDF. Vui lòng chọn file .pdf');
      return;
    }

    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      // Upload file first so we can get the stored URL
      const uploadRes = await contractAPI.uploadFile(id, f, 'signed');
      const fileUrl = getUploadedFileUrl(uploadRes);
      if (!fileUrl) {
        console.warn('upload did not return a file URL', uploadRes);
      }

      // Call hrConfirm (save code and proposal_file_url if available)
      const hrPayload = { ...(code ? { code } : {}), ...(fileUrl ? { proposal_file_url: fileUrl } : {}) };
      await contractAPI.hrConfirm(id, hrPayload);

      // fetch full contract and generate Word (.doc) print
      try {
        const full = await contractAPI.getById(id);
        const html = buildContractHtml(full || {});
        const fname = `Contract_${id}_${(full && (full.code || full.contract_number)) || ''}.doc`;
        downloadHtmlAsWord(html, fname);
      } catch (errFetch) {
        console.warn('failed to fetch full contract for print', errFetch);
      }

      // Call sign endpoint with signed_file_url as required by backend
      if (fileUrl) {
        await contractAPI.sign(id, { signed_file_url: fileUrl });
      }

      // remove from list
      setContracts((c) => c.filter((x) => x.id !== id));
      alert('Đã xác nhận hợp đồng.');
    } catch (err) {
      console.error('confirm failed', err);
      alert(err?.message || 'Action failed');
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">HR - Confirm Contract Number & Upload</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : contracts.length === 0 ? (
        <div className="text-sm text-gray-600">No contracts pending HR confirmation</div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <div key={c.id} className="p-4 border rounded">
              <div className="font-semibold">Contract #{c.id} — {c.contract_number || c.code || 'No code yet'}</div>
              <div className="text-sm text-gray-700">Customer: {c.customer?.name || customerCache[c.customer_id]?.name || c.customer_name || c.customer_temp || 'Unknown'}</div>
              {c.description && <div className="mt-1 text-sm text-gray-600">{c.description}</div>}

              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs">Contract code</label>
                  { (c.code || c.contract_number) ? (
                    <div className="mt-1 w-full border rounded p-2 bg-gray-100">{c.code || c.contract_number}</div>
                  ) : (
                    <input value={(inputs[c.id] && inputs[c.id].code) || ''} onChange={(e) => setInputValue(c.id, 'code', e.target.value)} className="mt-1 w-full border rounded p-1" />
                  ) }
                </div>
                <div>
                  <label className="block text-xs">Upload signed contract (PDF)</label>
                  <input type="file" accept="application/pdf" onChange={(e) => setFileFor(c.id, e.target.files?.[0] || null)} className="mt-1" />
                  {files[c.id] && !isPdf(files[c.id]) && (
                    <div className="text-xs text-red-600">File đã chọn không phải PDF</div>
                  )}
                </div>
                <div className="flex items-end">
                  <button
                    disabled={actionLoading[c.id] || !files[c.id] || !isPdf(files[c.id])}
                    onClick={() => handleConfirm(c.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
                  >
                    {actionLoading[c.id] ? '...' : 'Xác nhận & Upload'}
                  </button>
                    <button
                      onClick={async () => {
                        try {
                            const full = await contractAPI.getById(c.id);
                            // ensure we have customer object (backend sometimes returns only customer_id)
                            if (!full.customer && full.customer_id) {
                              full.customer = customerCache[full.customer_id] || null;
                              if (!full.customer) {
                                try {
                                  const c = await customerAPI.getById(full.customer_id);
                                  full.customer = c;
                                  setCustomerCache((p) => ({ ...p, [full.customer_id]: c }));
                                } catch (e) {
                                  console.warn('failed to fetch customer for docx', e);
                                }
                              }
                            }

                            // first try the contract-level services endpoint
                            let serviceRows = [];
                            try {
                              serviceRows = await contractAPI.getServices(c.id);
                            } catch (e) {
                              console.debug('contract.getServices failed', e?.message || e);
                            }

                            // if empty, try getServiceUsage as alternative
                            if ((!serviceRows || serviceRows.length === 0) && contractAPI.getServiceUsage) {
                              try {
                                serviceRows = await contractAPI.getServiceUsage(c.id);
                              } catch (e) {
                                console.debug('contract.getServiceUsage failed', e?.message || e);
                              }
                            }

                            // if still empty, open JSON so user can inspect payloads
                            if (!serviceRows || (Array.isArray(serviceRows) && serviceRows.length === 0)) {
                              const w = window.open();
                              w.document.body.innerText = JSON.stringify({ contract: full, services: serviceRows }, null, 2);
                              alert('Không tìm thấy rows dịch vụ — mở JSON trả về để kiểm tra (một cửa sổ mới).');
                            }

                            const blob = await generateContractDocxBlob(full || {}, { serviceRows });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Contract_${c.id}_${(full && (full.code || full.contract_number)) || ''}.docx`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                        } catch (err) {
                          console.warn('docx generation failed, falling back to HTML', err);
                          try {
                            const full = await contractAPI.getById(c.id);
                            const html = buildContractHtml(full || {});
                            const fname = `Contract_${c.id}_${(full && (full.code || full.contract_number)) || ''}.doc`;
                            downloadHtmlAsWord(html, fname);
                          } catch (err2) {
                            alert('Không thể tạo file .docx hoặc .doc: ' + (err2?.message || err2));
                          }
                        }
                      }}
                      className="ml-2 bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Tải .docx
                    </button>
                    <button
                      onClick={() => fetchServiceUsage(c.id)}
                      className="ml-2 bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      Xem thống kê dịch vụ
                    </button>
                </div>
              </div>
                {serviceUsages[c.id] && serviceUsages[c.id].open && (
                  <div className="mt-3 p-3 bg-gray-50 border rounded">
                    {serviceUsages[c.id].loading ? (
                      <div className="text-sm text-gray-500">Đang tải...</div>
                    ) : serviceUsages[c.id].error ? (
                      <div className="text-sm text-red-600">Lỗi: {serviceUsages[c.id].error}</div>
                    ) : Array.isArray(serviceUsages[c.id].rows) && serviceUsages[c.id].rows.length === 0 ? (
                      <div className="text-sm text-gray-600">Không có dữ liệu dịch vụ cho hợp đồng này.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left"><th className="pr-2">Dịch vụ</th><th className="pr-2">Số job</th><th className="pr-2">Tổng sale</th><th className="pr-2">Tổng cost</th><th className="pr-2">Tiến độ TB</th></tr>
                          </thead>
                          <tbody>
                            {serviceUsages[c.id].rows && serviceUsages[c.id].rows.map((r) => (
                              <tr key={r.service_id}>
                                <td className="pr-2">{r.service_name || r.name || r.service}</td>
                                <td className="pr-2">{r.total_jobs ?? r.count ?? r.jobs_count}</td>
                                <td className="pr-2">{r.total_sale_price ?? r.sum_sale_price ?? r.total_sale}</td>
                                <td className="pr-2">{r.total_cost ?? r.sum_cost ?? r.total_cost_price}</td>
                                <td className="pr-2">{r.avg_progress ?? r.average_progress ?? r.progress}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
