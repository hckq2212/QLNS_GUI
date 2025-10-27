import React, { useEffect, useState } from 'react';
import contractAPI from '../../api/contract.js';
import debtAPI from '../../api/debt.js';
import customerAPI from '../../api/customer.js';
import DebtCreateModal from '../ui/DebtCreateModal.jsx';
import formatPrice from '../../utils/FormatPrice.js';

export default function ContractWithoutDebt() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [activeContract, setActiveContract] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [debtError, setDebtError] = useState(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await contractAPI.getByStatus({ status: 'without_debt' });
        const arr = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
        // enrich with customer name when customer_id present
        const customerIds = Array.from(new Set(arr.map(c => c.customer_id).filter(Boolean)));
        const byId = {};
        if (customerIds.length > 0) {
          const fetched = await Promise.allSettled(customerIds.map(id => customerAPI.getById(id).catch(() => null)));
          fetched.forEach((r, idx) => {
            const id = customerIds[idx];
            if (r.status === 'fulfilled' && r.value) {
              byId[id] = r.value.name || r.value.customer_name || (r.value.customer && r.value.customer.name) || null;
            }
          });
        }
        const enriched = arr.map(c => ({ ...c, customer: c.customer || (c.customer_id ? { name: byId[c.customer_id] || c.customerName || c.customer_temp || null } : c.customer) }));
        if (mounted) setList(enriched);
      } catch (err) {
        console.error('failed to load contracts without debt', err);
        if (mounted) setError(err?.message || 'Failed to load');
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Hợp đồng chưa tạo công nợ</h3>
            {loading ? <div className="text-sm text-gray-500">Đang tải...</div> : error ? <div className="text-sm text-red-600">{error}</div> : (
        <div>
          {list.length === 0 ? (
            <div className="text-sm text-gray-600">Không có hợp đồng</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded border">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">Mã hợp đồng</th>
                    <th className="px-4 py-2">Khách hàng</th>
                    <th className="px-4 py-2">Tổng doanh thu</th>
                    <th className="px-4 py-2">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-3 align-top">{c.code || '-'}</td>
                      <td className="px-4 py-3 align-top">{c.customer?.name || c.customer_name || '-'}</td>
                      <td className="px-4 py-3 align-top">{formatPrice(c.total_revenue != null ? c.total_revenue : '-')} đ</td>
                      <td className="px-4 py-3 align-top">
                        <button
                          className="px-2 py-1 bg-blue-600 text-white rounded"
                          onClick={() => {
                            setActiveContract(c);
                            setInstallments([{ amount: c.total_revenue || 0, due_date: '' }]);
                            setDebtError(null);
                            setShowDebtModal(true);
                          }}
                        >
                          Tạo công nợ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
              
            {/* Debt modal */}
            {showDebtModal && activeContract && (
                <DebtCreateModal
                  activeContract={activeContract}
                  onClose={() => { setShowDebtModal(false); setActiveContract(null); }}
                  onSuccess={() => { setShowDebtModal(false); setActiveContract(null); setReloadCounter(c => c + 1); }}
                />
            )}
    </div>
  );
}


