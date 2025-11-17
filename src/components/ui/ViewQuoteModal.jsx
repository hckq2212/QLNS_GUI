import React, { useEffect, useState } from 'react';
import { useGetOpportunityServicesQuery } from '../../services/opportunity';
import { useGetServicesQuery } from '../../services/service';
import { formatPrice } from '../../utils/FormatValue';

export default function ViewQuoteModal({ isOpen = false, onClose = () => {}, opportunity = null }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { data: oppServicesData, isLoading: queryLoading, isError: queryError, error: queryErrorObj, refetch } = useGetOpportunityServicesQuery(opportunity?.id, { skip: !isOpen || !opportunity?.id });
    const { data: allServices } = useGetServicesQuery(undefined, { skip: !isOpen || !opportunity?.id });

    useEffect(() => {
        let mounted = true;
        async function process() {
            if (!isOpen || !opportunity || !opportunity.id) return setRows([]);
            setLoading(true);
            setError(null);
            try {
                const data = oppServicesData;
                const entries = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
                const mapped = entries.map((e, idx) => {
                    const svcId = e.service_id || null;
                    const svc = svcId ? (allServices && Array.isArray(allServices) ? allServices.find(s => String(s.id) === String(svcId)) : null) : null;
                    return {
                        id: e.id ?? idx,
                        serviceId: svcId,
                        name: svc?.name || e.name || e.service_name || `Service ${svcId ?? idx+1}`,
                        quantity: Number(e.quantity || e.qty || 1),
                        proposedPrice: Number(e.proposed_price ?? e.proposedPrice ?? e.price ?? 0),
                        baseCost: Number(e.base_cost ?? e.baseCost ?? 0),
                    };
                });
                if (!mounted) return;
                setRows(mapped);
            } catch (err) {
                if (!mounted) return;
                setError(err?.message || String(err));
                setRows([]);
            } finally { if (mounted) setLoading(false); }
        }
        process();
        return () => { mounted = false; };
    }, [isOpen, opportunity, oppServicesData, allServices]);

    // compute totals
    const totalRevenue = rows.reduce((s, r) => s + ((Number(r.proposedPrice) || 0) * (Number(r.quantity) || 0)), 0);
    const totalCost = rows.reduce((s, r) => s + ((Number(r.baseCost) || 0) * (Number(r.quantity) || 0)), 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg w-11/12 max-w-3xl shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Xem báo giá {opportunity ? `${opportunity.name || opportunity.title || ('#'+opportunity.id)}` : ''}</h3>
                    <button onClick={onClose} className="text-sm px-3 py-1 bg-gray-100 rounded">Đóng</button>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="text-sm text-gray-500">Đang tải hạng mục...</div>
                    ) : error ? (
                        <div className="text-sm text-red-600">Lỗi: {error}</div>
                    ) : rows.length === 0 ? (
                        <div className="text-sm text-gray-600">Không có hạng mục trong báo giá.</div>
                    ) : (
                        <>
                            <table className="w-full table-auto border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-left border-b px-3 py-2 text-sm">Hạng mục</th>
                                        <th className="text-right border-b px-3 py-2 text-sm">Số lượng</th>
                                        <th className="text-right border-b px-3 py-2 text-sm">Giá</th>
                                        <th className="text-right border-b px-3 py-2 text-sm">Tổng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.id}>
                                            <td className="px-3 py-2 border-b text-sm text-left">{r.name}</td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{r.quantity}</td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{formatPrice(r.proposedPrice)}</td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{formatPrice((Number(r.proposedPrice)||0) * (Number(r.quantity)||0))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-4 text-right text-sm">
                                <div><strong>Tổng doanh thu:</strong> {formatPrice(totalRevenue)}</div>
                                <div><strong>Tổng vốn:</strong> {formatPrice(totalCost)}</div>
                                <div><strong>Tỉ suất lợi nhuận:</strong> {totalRevenue ? (((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(1) + '%' : '\u2014'}</div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
