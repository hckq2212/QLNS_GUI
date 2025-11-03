import React, { useMemo, useState } from 'react';
import PriceQuoteModal from '../ui/PriceQuoteModal.jsx';
import { useGetAllOpportunityQuery } from '../../services/opportunity';
import { useGetCustomerByIdQuery } from '../../services/customer';
import { formatPrice } from '../../utils/FormatValue';

export default function PriceQuote() {
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: oppData = [], isLoading, isError, error } = useGetAllOpportunityQuery();

  const opportunities = useMemo(() => {
    const arr = Array.isArray(oppData) ? oppData : (oppData && Array.isArray(oppData.items) ? oppData.items : []);
    return arr.filter((o) => o && o.status === 'approved');
  }, [oppData]);

  function openModal(opportunity) {
    setSelectedOpportunity(opportunity);
    setIsModalOpen(true);
  }
  function closeModal() {
    setIsModalOpen(false);
    setSelectedOpportunity(null);
  }

  return (
    <div className="mt-6">
      {isLoading && <p>Đang tải...</p>}
      {isError && <p style={{ color: 'red' }}>Lỗi: {String(error)}</p>}

      <div className="overflow-x-auto bg-white rounded border">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Cơ hội</th>
              <th className="px-4 py-2">Khách hàng</th>
              <th className="px-4 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                  Không có cơ hội đã được duyệt.
                </td>
              </tr>
            ) : (
              opportunities.map((op) => <OpportunityRow key={op.id} op={op} onOpen={() => openModal(op)} />)
            )}
          </tbody>
        </table>
      </div>

      <PriceQuoteModal isOpen={isModalOpen} onClose={closeModal} opportunity={selectedOpportunity} />
    </div>
  );
}

function OpportunityRow({ op, onOpen }) {
  const custId = op?.customer_id;
  const { data: cust, isLoading: custLoading } = useGetCustomerByIdQuery(custId, { skip: !custId });

  const pickName = (obj) => obj && (obj.name || obj.full_name || null);
  const customerName = custId ? (custLoading ? 'Đang tải...' : pickName(cust) || op.customerName || '—') : (op.customerName || '—');

  return (
    <tr className="border-t">
      <td className="px-4 py-3 align-top w-[45%]">
        <div className="font-semibold">{op.name || op.title || `Cơ hội ${op.id}`}</div>
        {op.description ? <div className="text-sm text-gray-600 line-clamp-1 overflow-ellipsis">{String(op.description)}</div> : null}
      </td>
      <td className="px-4 py-3 align-top">{customerName}</td>
      <td className="px-4 py-3 align-top">
        <button onClick={onOpen} className="px-3 py-1 bg-blue-600 text-white rounded">Làm báo giá</button>
      </td>
    </tr>
  );
}