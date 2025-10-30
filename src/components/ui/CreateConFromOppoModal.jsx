import contractAPI from '../../api/contract';

export default function CreateConFromOppoModal({ selectedOpportunity = null, onClose = () => {}, onCreated = () => {} }) {
    if (!selectedOpportunity) return null;

    const handleCreate = async () => {
        try {
            const payload = {
                customerId: selectedOpportunity.customer_id || null,
                totalCost: 0,
                totalRevenue: selectedOpportunity.expected_price ? Number(selectedOpportunity.expected_price) : 0,
                customer_temp: selectedOpportunity.customer_temp || null,
            };
            const res = await contractAPI.createFromOpportunity(selectedOpportunity.id, payload, { timeout: 30000 });
            try { onCreated(res); } catch (e) {}
            try { onClose(); } catch (e) {}
        } catch (err) {
            console.error('create contract failed', err);
            try { alert('Tạo hợp đồng thất bại: ' + (err?.message || String(err))); } catch(_) {}
        }
    };

    return(
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow-lg w-96">
                <h3 className="font-semibold mb-2">Tạo hợp đồng từ cơ hội {selectedOpportunity.id}</h3>
                <p className="text-sm mb-4">Khách hàng: {selectedOpportunity.customerName || '—'}</p>
                <div className="flex justify-end gap-2">
                    <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={handleCreate}>Tạo</button>
                    <button className="px-3 py-1 rounded bg-gray-200" onClick={onClose}>Hủy</button>
                </div>
            </div>
        </div>
    )
}