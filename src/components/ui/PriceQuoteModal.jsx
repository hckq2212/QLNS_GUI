import { useEffect, useState } from 'react';
import { useGetServicesQuery } from '../../services/service';
import {
    useGetOpportunityServicesQuery,
    useQuoteOpportunityMutation,
    useAddOpportunityServiceMutation,
    useUpdateOpportunityServiceMutation,
    useDeleteOpportunityServiceMutation,
} from '../../services/opportunity';
import { useGetQuoteByOpportunityIdQuery, useUpdateQuoteMutation, useCreateQuoteMutation } from '../../services/quote';
import { formatPrice } from '../../utils/FormatValue';
import { toast } from 'react-toastify';

export default function PriceQuoteModal({ isOpen = false, onClose = () => {}, opportunity = null }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [chosen, setChosen] = useState({});
    const [customPrices, setCustomPrices] = useState({}); // Store custom prices separately
    const [reloadCounter, setReloadCounter] = useState(0);
    const [globalMode, setGlobalMode] = useState('suggest'); // 'min' | 'suggest' | 'custom' | null - default to suggest
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedQuantities, setEditedQuantities] = useState({});
    const [deletedServices, setDeletedServices] = useState([]);
    const [note, setNote] = useState('');

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
    const [addService] = useAddOpportunityServiceMutation();
    const [updateService] = useUpdateOpportunityServiceMutation();
    const [deleteService] = useDeleteOpportunityServiceMutation();
    const [updateQuote] = useUpdateQuoteMutation();
    const [createQuote] = useCreateQuoteMutation();

    // Fetch quote data for this opportunity
    const { data: quoteData, refetch: refetchQuote } = useGetQuoteByOpportunityIdQuery(
        opportunity?.id,
        { skip: !isOpen || !opportunity?.id }
    );

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
                const defaultCustom = {};
                const defaultQty = {};
                enriched.forEach((r, i) => {
                    const defaultPrice = (r.proposedPrice != null ? r.proposedPrice : r.suggestedPrice);
                    defaultChosen[i] = defaultPrice;
                    defaultCustom[i] = defaultPrice;
                    defaultQty[i] = r.quantity;
                });
                setChosen(defaultChosen);
                setCustomPrices(defaultCustom);
                setEditedQuantities(defaultQty);
                
                // Note is now synced via separate useEffect watching quoteData
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

    // Sync note from quoteData
    useEffect(() => {
        if (quoteData) {
            const noteValue = quoteData.note || (Array.isArray(quoteData) && quoteData.length > 0 ? quoteData[0].note : '');
            setNote(noteValue || '');
        }
    }, [quoteData]);

    // When globalMode changes, apply the chosen mode to all rows
    useEffect(() => {
        if (!globalMode || globalMode === 'custom') return; // only apply when user picks min or suggest mode
        if (!rows || rows.length === 0) return;
        const newChosen = {};
        rows.forEach((r, i) => {
            newChosen[i] = (globalMode === 'min') ? r.minPrice : r.suggestedPrice;
        });
        setChosen(newChosen);
    }, [globalMode, rows]);

    async function handleSubmitQuote() {
        if (!opportunity || !opportunity.id) return setSubmitError('Không có cơ hội để báo giá');
        
        // Validate profit margin based on selected mode
        const requiredMargin = globalMode === 'min' ? 0 : globalMode === 'suggest' ? 0 : 0;
        
        if (requiredMargin > 0) {
            for (let idx = 0; idx < rows.length; idx++) {
                const r = rows[idx];
                const price = globalMode === 'custom' 
                    ? (customPrices[idx] || chosen[idx] || 0)
                    : (Number(chosen[idx]) || 0);
                
                const profit = price ? (((price - r.baseCost) / price) * 100) : 0;
                
                if (profit < requiredMargin) {
                    const modeName = globalMode === 'min' ? 'giá tối thiểu' : 'giá đề xuất';
                    toast.error(`Dịch vụ "${r.name}" có tỉ suất lợi nhuận ${profit.toFixed(1)}% không đạt yêu cầu tối thiểu ${requiredMargin}% khi chọn ${modeName}`);
                    setSubmitError(`Tỉ suất lợi nhuận không đạt yêu cầu`);
                    return;
                }
            }
        }
        
        // compute total revenue from chosen
        const totalRevenue = Object.keys(chosen).reduce((s, k) => {
            const idx = Number(k);
            const qty = rows[idx]?.quantity || 0;
            const price = globalMode === 'custom' 
                ? (customPrices[idx] || chosen[idx] || 0)
                : (Number(chosen[k]) || 0);
            return s + (qty * price);
        }, 0);

        const payload = {
            expected_price: totalRevenue.toFixed(2),
            status: 'quoted',
            note: note || ''
        };

        setSubmitting(true);
        setSubmitError(null);
        try {
            // build per-service proposed prices payload
            const servicesPayload = rows.map((r, idx) => ({
                opportunityService_id: r.id,
                proposed_price: globalMode === 'custom' 
                    ? (customPrices[idx] || chosen[idx] || 0)
                    : (Number(chosen[idx]) || 0),
            }));

            const body = { ...payload, services: servicesPayload };

            // Call both APIs: opportunity quote and create quote
            await quoteOpportunity({ id: opportunity.id, body }).unwrap();
            
            // Create quote record with simple payload
            await createQuote({
                opportunity_id: opportunity.id,
                note: note || ''
            }).unwrap();
            
            setSubmitSuccess(true);
            toast.success('Báo giá thành công');
            
            // Refetch quote data to update UI
            if (refetchQuote) {
                refetchQuote();
            }
            
            setTimeout(() => { setSubmitting(false); onClose(); }, 700);
        } catch (err) {
            const message = err?.data?.message || err?.message || String(err);
            setSubmitError(message);
            toast.error('Báo giá thất bại');
            setSubmitting(false);
        }
    }

    function handleAddService() {
        const newRow = {
            id: `new-${Date.now()}`,
            serviceId: null,
            name: '',
            quantity: 1,
            baseCost: 0,
            minPrice: 0,
            suggestedPrice: 0,
            proposedPrice: null,
            isNew: true,
        };
        const newRows = [...rows, newRow];
        setRows(newRows);
        const idx = newRows.length - 1;
        setChosen({ ...chosen, [idx]: 0 });
        setCustomPrices({ ...customPrices, [idx]: 0 });
        setEditedQuantities({ ...editedQuantities, [idx]: 1 });
    }

    function handleRemoveService(idx, serviceId) {
        const newRows = rows.filter((_, i) => i !== idx);
        setRows(newRows);
        
        // Track deleted services that exist on backend
        if (serviceId && !String(serviceId).startsWith('new-')) {
            setDeletedServices([...deletedServices, serviceId]);
        }
        
        // Rebuild indices
        const newChosen = {};
        const newCustom = {};
        const newQty = {};
        newRows.forEach((r, i) => {
            const oldIdx = i < idx ? i : i + 1;
            newChosen[i] = chosen[oldIdx] || r.suggestedPrice;
            newCustom[i] = customPrices[oldIdx] || r.suggestedPrice;
            newQty[i] = editedQuantities[oldIdx] || r.quantity;
        });
        setChosen(newChosen);
        setCustomPrices(newCustom);
        setEditedQuantities(newQty);
    }

    function handleServiceSelect(idx, serviceId) {
        if (!serviceId) return;
        const svc = allServices?.find(s => String(s.id) === String(serviceId));
        if (!svc) return;
        
        const base = svc?.base_cost ?? svc?.baseCost ?? svc?.price ?? svc?.cost ?? 0;
        const baseNum = Number(base) || 0;
        const minPrice = +(baseNum * 1.2);
        const suggestedPrice = +(baseNum * 1.4);
        
        const newRows = [...rows];
        newRows[idx] = {
            ...newRows[idx],
            serviceId: Number(serviceId),
            name: svc.name,
            baseCost: baseNum,
            minPrice,
            suggestedPrice,
        };
        setRows(newRows);
        setChosen({ ...chosen, [idx]: suggestedPrice });
        setCustomPrices({ ...customPrices, [idx]: suggestedPrice });
    }

    async function handleSaveChanges() {
        if (!opportunity || !opportunity.id) {
            toast.error('Không có cơ hội để cập nhật');
            return;
        }

        // Validate: must have at least 1 valid service
        const validServices = rows.filter(r => 
            (r.isNew && r.serviceId) || // New service with selected serviceId
            (!r.isNew && r.serviceId)   // Existing service
        );
        
        if (validServices.length === 0) {
            toast.error('Phải có ít nhất 1 dịch vụ');
            return;
        }

        try {
            // Delete removed services
            for (const serviceId of deletedServices) {
                await deleteService({ 
                    opportunityId: opportunity.id, 
                    serviceId 
                }).unwrap();
            }

            // Add new services
            const newServices = rows.filter(r => r.isNew && r.serviceId);
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i];
                if (r.isNew && r.serviceId) {
                    await addService({
                        opportunityId: opportunity.id,
                        body: {
                            service_id: r.serviceId,
                            quantity: editedQuantities[i] || r.quantity || 1,
                        }
                    }).unwrap();
                }
            }

            // Update existing services with changed quantities
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i];
                if (!r.isNew && editedQuantities[i] !== r.quantity) {
                    await updateService({
                        opportunityId: opportunity.id,
                        serviceId: r.id,
                        body: { quantity: editedQuantities[i] || r.quantity }
                    }).unwrap();
                }
            }

            toast.success('Cập nhật dịch vụ thành công');
            setIsEditMode(false);
            setDeletedServices([]);
            
            // Refetch to get updated data
            if (refetch) {
                await refetch();
            }
            setReloadCounter(c => c + 1);
        } catch (err) {
            console.error('Update failed:', err);
            toast.error('Cập nhật thất bại: ' + (err?.data?.message || err?.message || 'Lỗi không xác định'));
        }
    }


    return (!isOpen) ? null : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg w-11/12 max-w-3xl shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 gap-4 text-left">
                    <div>
                        <h3 className="text-lg font-medium">Báo giá {opportunity ? `${opportunity.name || opportunity.title || ('#'+opportunity.id)}${opportunity.customerName ? ` — ${opportunity.customerName}` : ''}` : ''}</h3>
                        {quoteData && (
                            <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Trạng thái:</span> 
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                    quoteData.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                    quoteData.status === 'quoted' ? 'bg-blue-100 text-blue-700' :
                                    quoteData.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    quoteData.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {quoteData.status === 'draft' ? 'Nháp' :
                                     quoteData.status === 'quoted' ? 'Đã báo giá' :
                                     quoteData.status === 'approved' ? 'Đã phê duyệt' :
                                     quoteData.status === 'rejected' ? 'Từ chối' :
                                     quoteData.status}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => {
                                if (isEditMode) {
                                    handleSaveChanges();
                                } else {
                                    setIsEditMode(true);
                                }
                            }} 
                            className={`text-xs px-3 py-1 rounded ${isEditMode ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                            {isEditMode ? 'Lưu' : 'Chỉnh sửa'}
                        </button>
                        {isEditMode && (
                            <button 
                                onClick={() => {
                                    setIsEditMode(false);
                                    setDeletedServices([]);
                                    setReloadCounter(c => c + 1);
                                }} 
                                className="text-sm px-3 py-1 bg-gray-100 rounded"
                            >
                                Hủy
                            </button>
                        )}
                        <button onClick={onClose} className="text-xs px-3 py-1 bg-gray-100 rounded">Đóng</button>
                    </div>
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
                        {isEditMode && (
                            <div className="mb-3">
                                <button 
                                    onClick={handleAddService}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                >
                                    + Thêm dịch vụ
                                </button>
                            </div>
                        )}
                        <table className="w-full table-auto border-collapse">
                            <thead>
                                <tr>
                                    <th className="text-left border-b px-3 py-2 text-sm">Hạng mục</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Số lượng</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Giá vốn</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Giá bán tối thiểu</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Giá bán đề xuất</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Giá bán tùy chỉnh</th>
                                    <th className="text-right border-b px-3 py-2 text-sm">Tỉ suất lợi nhuận</th>
                                    {isEditMode && <th className="text-center border-b px-3 py-2 text-sm">Thao tác</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => {
                                    const sel = chosen[i] ?? r.suggestedPrice;
                                    const displayPrice = globalMode === 'custom' ? (customPrices[i] || sel) : sel;
                                    const qty = editedQuantities[i] !== undefined ? editedQuantities[i] : r.quantity;
                                    const profit = displayPrice ? (((displayPrice - r.baseCost) / displayPrice) * 100) : 0;
                                    return (
                                        <tr key={r.id}>
                                            <td className="px-3 py-2 border-b text-sm text-left">
                                                {isEditMode && r.isNew ? (
                                                    <select
                                                        value={r.serviceId || ''}
                                                        onChange={(e) => handleServiceSelect(i, e.target.value)}
                                                        className="w-full border rounded px-2 py-1"
                                                    >
                                                        <option value="">-- Chọn dịch vụ --</option>
                                                        {allServices?.map(svc => (
                                                            <option key={svc.id} value={svc.id}>{svc.name}</option>
                                                        ))}
                                                    </select>
                                                ) : r.name}
                                            </td>
                                            <td className="px-3 py-2 border-b text-sm text-right">
                                                {isEditMode ? (
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={qty}
                                                        onChange={(e) => setEditedQuantities({ ...editedQuantities, [i]: Number(e.target.value) || 1 })}
                                                        className="w-20 border rounded px-2 py-1 text-right"
                                                    />
                                                ) : qty}
                                            </td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{formatPrice(r.baseCost)}</td>
                                            <td className="px-3 py-2 border-b text-sm text-right">
                                                <div>{formatPrice(r.minPrice)}</div>
                                            </td>
                                            <td className="px-3 py-2 border-b text-sm text-right">
                                                <div>{formatPrice(r.suggestedPrice)}</div>
                                            </td>
                                            <td className="px-3 py-2 border-b text-sm text-right">
                                                <input
                                                    type="text"
                                                    value={customPrices[i] ? formatPrice(customPrices[i]) : ''}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                                        const val = rawValue ? Number(rawValue) : 0;
                                                        setCustomPrices((prev) => ({ ...prev, [i]: val }));
                                                        // Set to custom mode when user manually edits
                                                        if (globalMode !== 'custom') {
                                                            setGlobalMode('custom');
                                                        }
                                                    }}
                                                    disabled={globalMode !== 'custom'}
                                                    className={`w-32 border rounded px-2 py-1 text-right ${globalMode !== 'custom' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                    placeholder="Nhập giá"
                                                />
                                            </td>
                                            <td className="px-3 py-2 border-b text-sm text-right">{profit ? profit.toFixed(1) + '%' : '—'}</td>
                                            {isEditMode && (
                                                <td className="px-3 py-2 border-b text-sm text-center">
                                                    <button
                                                        onClick={() => handleRemoveService(i, r.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Xóa
                                                    </button>
                                                </td>
                                            )}
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
                                    <span>Chọn giá bán đề xuất</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="radio" name="global-price-mode" checked={globalMode === 'custom' || globalMode === null} onChange={() => setGlobalMode('custom')} />
                                    <span>Chọn giá bán tùy chỉnh</span>
                                </label>
                            </div>

                            {/* Totals summary on the right */}
                            <div className="text-sm text-right">
                                {
                                    (() => {
                                        const totalRevenue = Object.keys(chosen).reduce((s, k) => {
                                            const idx = Number(k);
                                            const qty = editedQuantities[idx] !== undefined ? editedQuantities[idx] : (rows[idx]?.quantity || 0);
                                            const price = globalMode === 'custom' 
                                                ? (customPrices[idx] || chosen[idx] || 0)
                                                : (Number(chosen[k]) || 0);
                                            return s + (qty * price);
                                        }, 0);
                                        const totalCost = rows.reduce((s, r, idx) => {
                                            const qty = editedQuantities[idx] !== undefined ? editedQuantities[idx] : (r.quantity || 0);
                                            return s + (r.baseCost * qty);
                                        }, 0);
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
                    
                {/* Note field */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                        rows="3"
                        placeholder="Nhập ghi chú cho báo giá..."
                    />
                </div>
                </div>
            </div>
        </div>
    );
}