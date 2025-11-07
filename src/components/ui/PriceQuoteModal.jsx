import { useEffect, useState } from 'react';
import { useGetServicesQuery } from '../../services/service';
import {
    useGetOpportunityServicesQuery,
    useQuoteOpportunityMutation,
} from '../../services/opportunity';
import { formatPrice } from '../../utils/FormatValue';
import { toast } from 'react-toastify';

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

    // Use RTK Query to fetch opportunity services
    const {
        data: oppServicesData,
        isLoading: queryLoading,
        isError: queryError,
        error: queryErrorObj,
        refetch,
    } = useGetOpportunityServicesQuery(opportunity?.id, { skip: !isOpen || !opportunity?.id });
    const [quoteOpportunity, { isLoading: quoteLoading, error: quoteError }] = useQuoteOpportunityMutation();

    // fetch cached services list via RTK Query and lookup by id instead of calling serviceAPI.getById
    const { data: allServices } = useGetServicesQuery(undefined, { skip: !isOpen || !opportunity?.id });

    useEffect(() => {
        let mounted = true;
        async function process() {
            if (!isOpen || !opportunity || !opportunity.id) return setRows([]);
            setLoading(true);
            setError(null);
            try {
                const requestConfig = { timeout: 30000 };
                const data = oppServicesData;
                const entries = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);

                const enriched = await Promise.all(entries.map(async (e, idx) => {
                    const svcId = e.service_id || null;
                    // look up service from cached allServices (RTK Query) to avoid direct API helper calls
                    const svc = svcId ? (allServices && Array.isArray(allServices) ? allServices.find(s => String(s.id) === String(svcId)) : null) : null;
                    const base = svc?.base_cost ?? svc?.baseCost ?? svc?.price ?? svc?.cost ?? e.base_cost ?? 0;
                    const baseNum = Number(base) || 0;
                    const minPrice = +(baseNum * 1.2);
                    const suggestedPrice = +(baseNum * 1.4);
                    return {
                        id: e.id ?? idx,
                        serviceId: svcId,
                        name: svc?.name || `Service ${svcId || idx+1}`,
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
        process();
        return () => { mounted = false; };
    }, [isOpen, opportunity, oppServicesData, reloadCounter]);

    // if user requested reload, ask RTK Query to refetch
    useEffect(() => {
        if (!isOpen || !opportunity || !opportunity.id) return;
        if (reloadCounter > 0 && refetch) refetch();
    }, [reloadCounter, isOpen, opportunity, refetch]);



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
            // build per-service proposed prices payload
            const servicesPayload = rows.map((r, idx) => ({
                opportunityService_id: r.id,
                proposed_price: Number(chosen[idx]) || 0,
            }));

            const body = { ...payload, services: servicesPayload };

            // use RTK Query mutation
            await quoteOpportunity({ id: opportunity.id, body }).unwrap();
            setSubmitSuccess(true);
            toast.success('Báo giá thành công');
            setTimeout(() => { setSubmitting(false); onClose(); }, 700);
        } catch (err) {
            const message = err?.data?.message || err?.message || String(err);
            setSubmitError(message);
            toast.error('Báo giá thất bại');
            setSubmitting(false);
        }
    }


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
                                            <td className="px-3 py-2 border-b text-sm text-right">{formatPrice(r.baseCost)}</td>
                                            <td className="px-3 py-2 border-b text-sm text-right">
                                                <div>{formatPrice(r.minPrice)}</div>
                                            </td>
                                            <td className="px-3 py-2 border-b text-sm text-right">
                                                <div>{formatPrice(r.suggestedPrice)}</div>
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
                                                <div><strong>Tổng doanh thu:</strong> {formatPrice(totalRevenue)}</div>
                                                <div><strong>Tổng vốn:</strong> {formatPrice(totalCost)}</div>
                                                <div><strong>Tỉ suất lợi nhuận:</strong> {totalRevenue ? overallMargin.toFixed(1) + '%' : '\u2014'}</div>
                                            </div>
                                        );
                                    })()
                                }
                            </div>
                        </div>
                        {/* button submit   */}
                        <div className="mt-4 flex items-center justify-end gap-3">
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