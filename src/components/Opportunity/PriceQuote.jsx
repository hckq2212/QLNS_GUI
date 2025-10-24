import { useState, useEffect } from 'react';
import PriceQuoteModal from '../ui/PriceQuoteModal.jsx'
import opportunityAPI from '../../api/opportunity.js';
import customerAPI from '../../api/customer.js';

export default function PriceQuote() {
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
                    const approved = arr.filter(o => o && o.status === 'approved');
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
        <div className='mt-6'>
            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}
            {!loading && opportunities.length === 0 && <p>Không có cơ hội đã được duyệt.</p>}

            <ul className='flex items-center flex-col'>
                {opportunities.map(op => (
                    <li key={op.id} className="mb-12 border-black-500 border w-[40%] flex justify-between p-6">
                        <div className='flex flex-col items-start gap-2'>
                            <strong>{op.name || op.title || `Cơ hội ${op.id}`}</strong>
                            <small>Khách hàng: {op.customerName || '—'}</small>
                        </div>

                        <button onClick={() => openModal(op)} style={{ marginTop: 6 }}>
                            Làm báo giá
                        </button>
                    </li>
                ))}
            </ul>

            <PriceQuoteModal
                isOpen={isModalOpen}
                onClose={closeModal}
                opportunity={selectedOpportunity}
            />
        </div>
    );
}
