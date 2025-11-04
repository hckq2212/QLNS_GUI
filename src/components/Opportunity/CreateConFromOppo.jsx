// ...existing code...
import { useState, useEffect } from 'react';
import { useGetOpportunityByStatusQuery } from '../../services/opportunity.js';
import { useGetAllCustomerQuery } from '../../services/customer';
import { formatPrice } from '../../utils/FormatValue';
import CreateConFromOppoModal from '../ui/CreateConFromOppoModal';

export default function CreateConFromOppo() {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: oppRaw, isLoading: oppLoading, isError: oppIsError, error: oppError } = useGetOpportunityByStatusQuery('quoted');
    const { data: customersData } = useGetAllCustomerQuery();

    useEffect(() => {
        // derive opportunities from RTK query results and local caches
        setLoading(oppLoading);
        setError(null);
        try {
            const arr = Array.isArray(oppRaw) ? oppRaw : (oppRaw && Array.isArray(oppRaw.items) ? oppRaw.items : []);
            const approved = arr.filter((o) => o && o.status === 'quoted');

            const customerById = {};
            if (Array.isArray(customersData)) {
                customersData.forEach((c) => { customerById[c.id] = c.name || c.customer_name || (c.customer && c.customer.name) || null; });
            }

            const withCustomerName = approved.map((o) => {
                const pickName = (obj) => obj && (obj.name || obj.full_name || null);
                let customerName = null;
                if (o.customer) customerName = pickName(o.customer);
                else if (o.customer_id && customerById[o.customer_id]) customerName = customerById[o.customer_id];
                else customerName = o.customerName || null;
                return { ...o, customerName };
            });

            setOpportunities(withCustomerName);
        } catch (err) {
            console.error('failed to load opportunities', err);
            setError(oppIsError ? (oppError?.message || String(oppError)) : (err?.message || String(err)));
        } finally {
            setLoading(false);
        }
    }, [oppRaw, oppLoading, oppIsError, oppError, customersData]);

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

            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            <div className=" bg-white rounded border">
                <table className="min-w-full text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2">Cơ hội</th>
                            <th className="px-4 py-2">Khách hàng</th>
                            <th className="px-4 py-2">Giá dự kiến</th>
                            <th className="px-4 py-2">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {opportunities.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">Không có cơ hội đã báo giá.</td>
                            </tr>
                        ) : (
                            opportunities.map((op) => (
                                <tr key={op.id} className="border-t">
                                    <td className="px-4 py-3 align-top w-[45%]">
                                        <div className="font-semibold">{op.name || `Cơ hội ${op.id}`}</div>
                                        <div className="text-sm text-gray-600 line-clamp-1 overflow-ellipsis">{op.description ? String(op.description) : ''}</div>
                                    </td>
                                    <td className="px-4 py-3 align-top">{op.customerName || '—'}</td>
                                    <td className="px-4 py-3 align-top">{formatPrice(op.expected_price) || '-'} đ</td>
                                    <td className="px-4 py-3 align-top">
                                        <button onClick={() => openModal(op)} className="px-3 py-1 bg-blue-600 text-white rounded">Tạo hợp đồng</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && selectedOpportunity && (
                <CreateConFromOppoModal
                    selectedOpportunity={selectedOpportunity}
                    onClose={closeModal}
                    onCreated={(res) => {
                        closeModal();
                    }}
                />
            )}
        </div>
    );
}
