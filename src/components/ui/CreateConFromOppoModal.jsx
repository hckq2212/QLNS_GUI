import { toast } from 'react-toastify';
import React from 'react';
import { useCreateContractFromOpportunityMutation } from '../../services/contract';

export default function CreateConFromOppoModal({
  selectedOpportunity = null,
  onClose = () => {},
  onCreated = () => {},
}) {
  const [createFromOppo, { isLoading }] = useCreateContractFromOpportunityMutation();

  if (!selectedOpportunity) return null;

  const handleCreate = async () => {
    try {
      const payload = {
        customerId: selectedOpportunity.customer_id ?? selectedOpportunity.customer?.id ?? null,
        totalCost: 0,
        totalRevenue: selectedOpportunity.expected_price
          ? Number(selectedOpportunity.expected_price)
          : (selectedOpportunity.expected_revenue ? Number(selectedOpportunity.expected_revenue) : 0),
        customer_temp: selectedOpportunity.customer_temp ?? null,
      };

      const res = await createFromOppo({
        opportunityId: selectedOpportunity.id,
        ...payload,
      }).unwrap(); // bắt lỗi chuẩn

      try { onCreated(res); } catch {}
      try { onClose(); } catch {}
      toast.success('Tạo hợp đồng thành công');
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.error || 'Tạo hợp đồng thất bại');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h3 className="font-semibold mb-2">
          Tạo hợp đồng từ cơ hội {selectedOpportunity.name}
        </h3>

        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-60"
            onClick={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? 'Đang tạo...' : 'Tạo'}
          </button>
          <button className="px-3 py-1 rounded bg-gray-200" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}