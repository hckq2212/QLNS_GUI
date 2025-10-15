import { useEffect, useState } from 'react';
import serviceAPI from '../api/service';
import opportunityAPI from '../api/opportunity';

export default function PriceQuoteModal({ isOpen = false, onClose = () => {}, opportunity = null }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [chosen, setChosen] = useState({});
    const [reloadCounter, setReloadCounter] = useState(0);
    const [reloadTimeout, setReloadTimeout] = useState(30000);

    useEffect(() => {
        function onKey(e) { if (e.key === 'Escape') onClose(); }
        if (isOpen) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    useEffect(() => {
        let mounted = true;
        async function load() {
            if (!isOpen || !opportunity || !opportunity.id) return setRows([]);
            setLoading(true);
            setError(null);
            try {
                // increase timeout for potentially slow endpoints (reloadTimeout controlled by retry buttons)
                const requestConfig = { timeout: reloadTimeout };
                const data = await opportunityAPI.getService(opportunity.id, requestConfig);
                const entries = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);

                // enrich entries with service base_cost
                const enriched = await Promise.all(entries.map(async (e, idx) => {
                    const svcId = e.service_id || e.serviceId || e.service || null;
                    let svc = null;
                    try { if (svcId) svc = await serviceAPI.getById(svcId, requestConfig); } catch (err) { svc = null; }
                    const base = svc?.base_cost ?? svc?.baseCost ?? svc?.price ?? svc?.cost ?? e.base_cost ?? 0;
                    const baseNum = Number(base) || 0;
                    const minPrice = +(baseNum * 1.2);
                    const suggestedPrice = +(baseNum * 1.4);
                    return {
                        id: e.id ?? idx,
                        serviceId: svcId,
                        name: svc?.name || e.service_name || e.name || `Service ${svcId || idx+1}`,
                        quantity: Number(e.quantity || e.qty || 1),
                        baseCost: baseNum,
                        minPrice,
                        suggestedPrice,
                        proposedPrice: e.proposed_price != null ? Number(e.proposed_price) : null,
                    };
                }));

                if (!mounted) return;
                setRows(enriched);
                const defaultChosen = {};
                enriched.forEach((r, i) => defaultChosen[i] = (r.proposedPrice != null ? r.proposedPrice : r.suggestedPrice));
                setChosen(defaultChosen);
            } catch (err) {
                if (!mounted) return;
                // normalize axios/network error
                const normalized = {
                    message: err?.message || String(err),
                    code: err?.code || null,
                    responseStatus: err?.response?.status || null,
                    responseData: err?.response?.data || null,
                    config: err?.config || null,
                };
                setError(normalized);
                setRows([]);
            } finally { if (mounted) setLoading(false); }
        }
        load();
        return () => { mounted = false; };
    }, [isOpen, opportunity, reloadCounter, reloadTimeout]);

    function format(n) { return n == null ? '' : new Intl.NumberFormat('vi-VN').format(Number(n)); }

    return (!isOpen) ? null : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg w-11/12 max-w-3xl shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Báo giá {opportunity ? `${opportunity.name || opportunity.title || ('#'+opportunity.id)}${opportunity.customerName ? ` — ${opportunity.customerName}` : ''}` : ''}</h3>
                    <button onClick={onClose} className="text-sm px-3 py-1 bg-gray-100 rounded">Đóng</button>
                </div>

                <div className="mb-4 text-sm space-y-1">
                    {opportunity ? (
                        <div>
                            <div><strong>Khách hàng:</strong> {opportunity.customerName || '—'}</div>
                            <div><strong>Mô tả:</strong> {opportunity.description || '—'}</div>
                        </div>
                    ) : (<div>Không có dữ liệu cơ hội.</div>)}
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="text-sm text-gray-500">Đang tải hạng mục...</div>
                    ) : error ? (
                        <div className="text-sm text-red-600 space-y-2">
                            <div><strong>Lỗi:</strong> {error.message}</div>
                            {error.responseStatus && (<div><strong>HTTP:</strong> {error.responseStatus}</div>)}
                            {error.code && (<div><strong>Code:</strong> {error.code}</div>)}
                            <div className="flex items-center gap-2 mt-2">
                                <button onClick={() => { setReloadTimeout(30000); setReloadCounter(c => c + 1); }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Thử lại</button>
                                <button onClick={() => { setReloadTimeout(60000); setReloadCounter(c => c + 1); }} className="px-3 py-1 bg-yellow-600 text-white rounded text-sm">Thử lại (60s)</button>
                                <button onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify(error, null, 2)); alert('Copied error details'); } catch(e) { alert('Copy failed'); } }} className="px-3 py-1 bg-gray-200 text-sm rounded">Copy lỗi</button>
                            </div>
                            {error.responseData && (
                                <details className="mt-2 p-2 bg-gray-50 border rounded text-xs text-gray-700">
                                    <summary className="cursor-pointer">Xem response body</summary>
                                    <pre className="mt-2 max-h-48 overflow-auto">{JSON.stringify(error.responseData, null, 2)}</pre>
                                </details>
                            )}
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="text-sm text-gray-600">Không có hạng mục nào.</div>
                    ) : (
                        <table className="w-full table-auto border-collapse">
                            <thead>
                                <tr>
                                    <th className="text-left border-b px-3 py-2 text-sm">Hạng mục</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Số lượng</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Giá vốn</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Giá bán tối thiểu</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Giá bán đề xuất</th>
                                    <th className="text-center border-b px-3 py-2 text-sm">Chọn giá</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Tỉ suất lợi nhuận</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => {
                                    const sel = chosen[i] ?? r.suggestedPrice;
                                    const profit = sel ? (((sel - r.baseCost) / sel) * 100) : 0;
                                    return (
                                        <tr key={r.id}>
                                            <td className="px-3 py-2 border-b text-sm">{r.name}</td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{r.quantity}</td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{format(r.baseCost)}</td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{format(r.minPrice)}</td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{format(r.suggestedPrice)}</td>
                                            <td className="px-3 py-2 border-b text-sm text-center">
                                                <div className="flex items-center gap-2 justify-center">
                                                    <label className="text-xs"><input type="radio" name={`price-${i}`} checked={sel === r.minPrice} onChange={() => setChosen(prev => ({...prev, [i]: r.minPrice}))} /> <span className="ml-1">Min</span></label>
                                                    <label className="text-xs"><input type="radio" name={`price-${i}`} checked={sel === r.suggestedPrice} onChange={() => setChosen(prev => ({...prev, [i]: r.suggestedPrice}))} /> <span className="ml-1">Suggest</span></label>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{profit ? profit.toFixed(1) + '%' : '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}