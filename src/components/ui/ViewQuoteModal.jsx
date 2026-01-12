import React, { useEffect, useState } from 'react';
import { useGetOpportunityServicesQuery } from '../../services/opportunity';
import { useGetServicesQuery } from '../../services/service';
import { useGetQuoteByOpportunityIdQuery, useApproveQuoteMutation, useRejectQuoteMutation } from '../../services/quote';
import { useGetMyRoleQuery } from '../../services/me';
import { formatPrice } from '../../utils/FormatValue';
import { QUOTE_STATUS } from '../../utils/enums';
import { toast } from 'react-toastify';

export default function ViewQuoteModal({ isOpen = false, onClose = () => {}, opportunity = null }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [note, setNote] = useState('');
    const [quoteId, setQuoteId] = useState(null);

    const { data: oppServicesData, isLoading: queryLoading, isError: queryError, error: queryErrorObj, refetch } = useGetOpportunityServicesQuery(opportunity?.id, { skip: !isOpen || !opportunity?.id });
    const { data: allServices } = useGetServicesQuery(undefined, { skip: !isOpen || !opportunity?.id });
    const { data: quoteData, refetch: refetchQuote } = useGetQuoteByOpportunityIdQuery(opportunity?.id, { skip: !isOpen || !opportunity?.id });
    const { data: myRole } = useGetMyRoleQuery();
    const [approveQuote] = useApproveQuoteMutation();
    const [rejectQuote] = useRejectQuoteMutation();

    // Extract quote ID from quoteData
    useEffect(() => {
        if (quoteData) {
            // Handle different possible structures
            const id = quoteData.id || (Array.isArray(quoteData) && quoteData.length > 0 ? quoteData[0].id : null);
            console.log('Extracted quoteId:', id);
            setQuoteId(id);
            const noteValue = quoteData.note || (Array.isArray(quoteData) && quoteData.length > 0 ? quoteData[0].note : '');
            setNote(noteValue || '');
        }
    }, [quoteData]);

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
                    // determine base cost using service master data first, then fallback to opportunity row
                    const baseRaw = svc?.base_cost ?? svc?.baseCost ?? svc?.price ?? svc?.cost ?? e.base_cost ?? e.baseCost ?? 0;
                    const proposedRaw = e.proposed_price ?? e.proposedPrice ?? e.price ?? null;
                    const proposedFromSvc = svc ? (svc.suggested_price ?? svc.suggestedPrice ?? svc.price ?? null) : null;
                    return {
                        id: e.id ?? idx,
                        serviceId: svcId,
                        name: svc?.name || e.name || e.service_name || `Service ${svcId ?? idx+1}`,
                        quantity: Number(e.quantity || e.qty || 1),
                        proposedPrice: Number(proposedRaw != null ? proposedRaw : (proposedFromSvc != null ? proposedFromSvc : 0)),
                        baseCost: Number(baseRaw || 0),
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

    // Check if user has permission to approve/reject
    const canApproveReject = myRole && (myRole === 'BOD' || myRole === 'admin');

    const handleApprove = async () => {
        console.log('handleApprove - quoteId:', quoteId, 'type:', typeof quoteId, 'note:', note);
        if (!quoteId) {
            toast.error('Không tìm thấy ID báo giá');
            return;
        }
        try {
            console.log('Calling approveQuote with:', { id: quoteId, note });
            await approveQuote({ id: quoteId, note }).unwrap();
            toast.success('Đã duyệt báo giá');
            if (refetchQuote) refetchQuote();
        } catch (err) {
            console.error('Approve error:', err);
            toast.error('Duyệt báo giá thất bại: ' + (err?.data?.message || err?.message || 'Lỗi không xác định'));
        }
    };

    const handleReject = async () => {
        console.log('handleReject - quoteId:', quoteId, 'type:', typeof quoteId, 'note:', note);
        if (!quoteId) {
            toast.error('Không tìm thấy ID báo giá');
            return;
        }
        try {
            console.log('Calling rejectQuote with:', { id: quoteId, note });
            await rejectQuote({ id: quoteId, note }).unwrap();
            toast.success('Đã từ chối báo giá');
            if (refetchQuote) refetchQuote();
        } catch (err) {
            console.error('Reject error:', err);
            toast.error('Từ chối báo giá thất bại: ' + (err?.data?.message || err?.message || 'Lỗi không xác định'));
        }
    };

    const handleClose = () => {
        if (refetch) refetch();
        if (refetchQuote) refetchQuote();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
            <div className="bg-white p-6 rounded-lg w-11/12 max-w-3xl shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-medium">Xem báo giá {opportunity ? `${opportunity.name || opportunity.title || ('#'+opportunity.id)}` : ''}</h3>

                    </div>
                    <div className="flex gap-2">
                        
                        <button onClick={handleClose} className="text-sm px-3 py-1 bg-gray-100 rounded">Đóng</button>
                    </div>
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
                                        <th className="text-right border-b px-3 py-2 text-sm">Giá vốn</th>
                                        <th className="text-right border-b px-3 py-2 text-sm">Giá</th>
                                        <th className="text-right border-b px-3 py-2 text-sm">Lợi nhuận</th>
                                        <th className="text-right border-b px-3 py-2 text-sm">Tổng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => {
                                        const profitPerUnit = (Number(r.proposedPrice) || 0) - (Number(r.baseCost) || 0);
                                        const totalProfit = profitPerUnit * (Number(r.quantity) || 0);
                                        return (
                                            <tr key={r.id}>
                                                <td className="px-3 py-2 border-b text-sm text-left">{r.name}</td>
                                                <td className="px-3 py-2 border-b text-sm text-right">{r.quantity}</td>
                                                <td className="px-3 py-2 border-b text-sm text-right">{formatPrice(r.baseCost)}</td>
                                                <td className="px-3 py-2 border-b text-sm text-right">{formatPrice(r.proposedPrice)}</td>
                                                <td className="px-3 py-2 border-b text-sm text-right">{formatPrice(totalProfit)}</td>
                                                <td className="px-3 py-2 border-b text-sm text-right">{formatPrice((Number(r.proposedPrice)||0) * (Number(r.quantity)||0))}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="mt-4 text-right text-sm">
                                <div><strong>Tổng doanh thu:</strong> {formatPrice(totalRevenue)}</div>
                                <div><strong>Tổng vốn:</strong> {formatPrice(totalCost)}</div>
                                <div><strong>Tỉ suất lợi nhuận:</strong> {totalRevenue ? (((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(1) + '%' : '\u2014'}</div>
                            </div>
                        </>
                    )}
                                            {quoteId && (
                            <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Trạng thái:</span> 
                                <span className="ml-2 px-2 py-0.5 rounded text-md">
                                    {QUOTE_STATUS[quoteData?.status || (Array.isArray(quoteData) && quoteData[0]?.status)]}
                                </span>
                            </div>
                        )}
                           {quoteId && (
                            <div className="mb-4 p-3 mt-4 bg-gray-50 rounded">
                                <div className="text-sm font-medium text-gray-700 mb-1">Ghi chú:</div>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full text-sm text-gray-600 border rounded p-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập ghi chú..."
                                />
                            </div>
                            )}
                            {canApproveReject && quoteId && (quoteData?.status === 'pending' || (Array.isArray(quoteData) && quoteData[0]?.status === 'pending')) && (
                            <>
                                <button 
                                    onClick={handleApprove}
                                    className="text-sm px-3 py-1 bg-blue-600 text-white rounded  mr-3"
                                >
                                    Duyệt
                                </button>
                                <button 
                                    onClick={handleReject}
                                    className="text-sm px-3 py-1 border border-blue-600 text-blue-600 rounded "
                                >
                                    Không duyệt
                                </button>
                            </>
                        )}
                </div>
            </div>
        </div>
    );
}
