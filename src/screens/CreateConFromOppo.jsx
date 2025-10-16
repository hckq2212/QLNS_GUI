// ...existing code...
import { useState, useEffect } from 'react';
import opportunityAPI from '../api/opportunity';
import customerAPI from '../api/customer';
import contractAPI from '../api/contract';

export default function CreateConFromOppo() {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                setLoading(true);
                const data = await opportunityAPI.getAll();
                if (mounted) {
                    const arr = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
                    const approved = arr.filter(o => o && o.status === 'quoted');
                        // For opportunities that have a customer_id, fetch the customer and use its name.
                        // Otherwise fall back to any provided customerName / customer_temp.name.
                        const withCustomerName = await Promise.all(approved.map(async (o) => {
                            // helper to pull name from various shapes
                            const pickName = (obj) => obj && (obj.name || obj.fullName || obj.full_name || null);

                            if (o.customer_id) {
                                try {
                                    const cust = await customerAPI.getById(o.customer_id);
                                    const custName = pickName(cust) || o.customerName || pickName(o.customer) || pickName(o.customer_temp) || null;
                                    return { ...o, customerName: custName };
                                } catch (e) {
                                    // If customer fetch fails, fall back to temp/name fields
                                    const fallback = o.customerName || pickName(o.customer) || pickName(o.customer_temp) || null;
                                    return { ...o, customerName: fallback };
                                }
                            }

                            // no customer_id — use existing data
                            const name = o.customerName || pickName(o.customer) || pickName(o.customer_temp) || null;
                            return { ...o, customerName: name };
                        }));

                        setOpportunities(withCustomerName);
                }
            } catch (err) {
                // opportunityAPI throws Error objects; normalize message
                if (mounted) setError(err?.message || String(err));
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, []);

    function openModal(opportunity) {
        setSelectedOpportunity(opportunity);
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setSelectedOpportunity(null);
    }

    return (
        <div>
            <h2 className='text-2xl font-bold mb-12 mt-12 '>Tạo hợp đồng từ các cơ hội đã báo giá</h2>

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}
            {!loading && opportunities.length === 0 && <p>Không có cơ hội đã báo giá.</p>}

            <ul className='flex items-center flex-col'>
                {opportunities.map(op => (
                    <li key={op.id} className="mb-12 border-black-500 border w-[40%] flex justify-between p-6">
                        <div className='flex flex-col items-start gap-2'>
                            <strong>{op.name || op.title || `Cơ hội ${op.id}`}</strong>
                            <small>Khách hàng: {op.customerName || '—'}</small>
                        </div>
                        <div>
                            <small>Mô tả: {op.description || '—'}</small>
                        </div>
                        <button onClick={() => openModal(op)} style={{ marginTop: 6 }}>
                            Tạo hợp đồng
                        </button>
                    </li>
                ))}
            </ul>

            {/* Modal-less simple create flow: confirmation prompt and API call */}
            {selectedOpportunity && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h3 className="font-semibold mb-2">Tạo hợp đồng từ cơ hội {selectedOpportunity.id}</h3>
                        <p className="text-sm mb-4">Khách hàng: {selectedOpportunity.customerName || '—'}</p>
                        <div className="flex justify-end gap-2">
                            <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={async () => {
                                try {
                                    // Prepare payload
                                    const payload = {
                                        customerId: selectedOpportunity.customer_id || null,
                                        totalCost: 0,
                                        totalRevenue: selectedOpportunity.expected_price ? Number(selectedOpportunity.expected_price) : 0,
                                        customer_temp: selectedOpportunity.customer_temp || null,
                                    };
                                    const res = await contractAPI.createFromOpportunity(selectedOpportunity.id, payload, { timeout: 30000 });
                                } catch (err) {
                                    console.error('create contract failed', err);
                                    alert('Tạo hợp đồng thất bại: ' + (err?.message || String(err)));
                                }
                            }}>Tạo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
