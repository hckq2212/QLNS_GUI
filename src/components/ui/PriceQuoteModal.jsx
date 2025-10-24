import { useEffect, useState } from 'react';
import serviceAPI from '../../api/service';
import opportunityAPI from '../../api/opportunity';

export default function PriceQuoteModal({ isOpen = false, onClose = () => {}, opportunity = null }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [chosen, setChosen] = useState({});
    const [reloadCounter, setReloadCounter] = useState(0);
    const [globalMode, setGlobalMode] = useState(null); // 'min' | 'suggest' | null
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

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
                // increase timeout for potentially slow endpoints (30s)
                const requestConfig = { timeout: 30000 };
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
                setError(err?.message || String(err));
                setRows([]);
            } finally { if (mounted) setLoading(false); }
        }
        load();
        return () => { mounted = false; };
    }, [isOpen, opportunity, reloadCounter]);

    // function computeDefaultChosen(rowsArr) {
    //     const d = {};
    //     (rowsArr || rows).forEach((r, i) => d[i] = (r.proposedPrice != null ? r.proposedPrice : r.suggestedPrice));
    //     return d;
    // }

    // When globalMode changes, apply the chosen mode to all rows
    useEffect(() => {
        if (!globalMode) return; // only apply when user picks a global mode
        if (!rows || rows.length === 0) return;
        const newChosen = {};
        rows.forEach((r, i) => {
            newChosen[i] = (globalMode === 'min') ? r.minPrice : r.suggestedPrice;
        });
        setChosen(newChosen);
    }, [globalMode, rows]);

    async function handleSubmitQuote() {
        if (!opportunity || !opportunity.id) return setSubmitError('Không có cơ hội để báo giá');
        // compute total revenue from chosen
        const totalRevenue = Object.keys(chosen).reduce((s, k) => {
            const idx = Number(k);
            const qty = rows[idx]?.quantity || 0;
            const price = Number(chosen[k]) || 0;
            return s + (qty * price);
        }, 0);

        const payload = {
            expected_price: totalRevenue.toFixed(2),
            status: 'quoted'
        };

        setSubmitting(true);
        setSubmitError(null);
        try {
            await opportunityAPI.update(opportunity.id, payload, { timeout: 30000 });
            setSubmitSuccess(true);
            // close after short delay
            setTimeout(() => { setSubmitting(false); onClose(); }, 700);
        } catch (err) {
            setSubmitError(err?.message || String(err));
            setSubmitting(false);
        }
    }

    function format(n) { return n == null ? '' : new Intl.NumberFormat('vi-VN').format(Number(n)); }

    return (!isOpen) ? null : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg w-11/12 max-w-3xl shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Báo giá {opportunity ? `${opportunity.name || opportunity.title || ('#'+opportunity.id)}${opportunity.customerName ? ` — ${opportunity.customerName}` : ''}` : ''}</h3>
                    <button onClick={onClose} className="text-sm px-3 py-1 bg-gray-100 rounded">Đóng</button>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="text-sm text-gray-500">Đang tải hạng mục...</div>
                    ) : error ? (
                        <div className="text-sm text-red-600">
                            <div>Lỗi: {error}</div>
                            <div className="mt-2">
                                <button onClick={() => setReloadCounter((c) => c + 1)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Thử lại</button>
                            </div>
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="text-sm text-gray-600">Không có hạng mục nào.</div>
                    ) : (
                        <>
                        <table className="w-full table-auto border-collapse">
                            <thead>
                                <tr>
                                    <th className="text-left border-b px-3 py-2 text-sm">Hạng mục</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Số lượng</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Giá vốn</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Giá bán tối thiểu</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Giá bán đề xuất</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Tỉ suất lợi nhuận</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => {
                                    const sel = chosen[i] ?? r.suggestedPrice;
                                    const profit = sel ? (((sel - r.baseCost) / sel) * 100) : 0;
                                    return (
                                        <tr key={r.id}>
                                            <td className="px-3 py-2 border-b text-sm text-left">{r.name}</td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{r.quantity}</td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{format(r.baseCost)}</td>
                                            <td className="px-3 py-2 border-b text-sm text-right">
                                                <div>{format(r.minPrice)}</div>
                                            </td>
                                            <td className="px-3 py-2 border-b text-sm text-right">
                                                <div>{format(r.suggestedPrice)}</div>
                                            </td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{profit ? profit.toFixed(1) + '%' : '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Global footer: apply min/suggest to all rows */}
                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="radio" name="global-price-mode" checked={globalMode === 'min'} onChange={() => setGlobalMode('min')} />
                                    <span>Chọn giá bán tối thiểu</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="radio" name="global-price-mode" checked={globalMode === 'suggest'} onChange={() => setGlobalMode('suggest')} />
                                    <span>Chọn giá bán đề xuất </span>
                                </label>
                            </div>

                            {/* Totals summary on the right */}
                            <div className="text-sm text-right">
                                {
                                    (() => {
                                        const totalRevenue = Object.keys(chosen).reduce((s, k) => {
                                            const idx = Number(k);
                                            const qty = rows[idx]?.quantity || 0;
                                            const price = Number(chosen[k]) || 0;
                                            return s + (qty * price);
                                        }, 0);
                                        const totalCost = rows.reduce((s, r, idx) => s + (r.baseCost * (r.quantity || 0)), 0);
                                        const overallMargin = totalRevenue ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
                                        return (
                                            <div>
                                                <div><strong>Tổng doanh thu:</strong> {format(totalRevenue)}</div>
                                                <div><strong>Tổng vốn:</strong> {format(totalCost)}</div>
                                                <div><strong>Tỉ suất lợi nhuận:</strong> {totalRevenue ? overallMargin.toFixed(1) + '%' : '\u2014'}</div>
                                            </div>
                                        );
                                    })()
                                }
                            </div>
                        </div>
                        {/* button submit   */}
                        <div className="mt-4 flex items-center justify-end gap-3">
                            {submitError ? <div className="text-sm text-red-600">Lỗi: {submitError}</div> : null}
                            {submitSuccess ? <div className="text-sm text-green-600">Báo giá gửi thành công</div> : null}
                            <button onClick={handleSubmitQuote} disabled={submitting} className={`px-3 py-1 text-sm rounded ${submitting ? 'bg-gray-300' : 'bg-blue-600 text-white'}`}>
                                {submitting ? 'Đang gửi...' : 'Báo giá'}
                            </button>
                        </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}