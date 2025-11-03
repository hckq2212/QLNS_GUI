import React, { useEffect, useState } from 'react';
import DebtCreateModal from '../ui/DebtCreateModal.jsx';
import { formatPrice } from '../../utils/FormatValue.js';
import { useGetContractsByStatusQuery } from '../../services/contract';
import { useGetAllCustomerQuery } from '../../services/customer';

export default function ContractWithoutDebt() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [activeContract, setActiveContract] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [debtError, setDebtError] = useState(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  // Use RTK Query to fetch contracts by status and customers list
  const {
    data: contractsData,
    isLoading: contractsLoading,
    isError: contractsIsError,
    error: contractsError,
    refetch: refetchContracts,
  } = useGetContractsByStatusQuery('without_debt');

  const { data: customersData, isLoading: customersLoading } = useGetAllCustomerQuery();

  // derive UI state from query data
  useEffect(() => {
    setLoading(contractsLoading || customersLoading);
  }, [contractsLoading, customersLoading]);

  useEffect(() => {
    if (contractsIsError) {
      setError(contractsError?.message || 'Failed to load contracts');
      setList([]);
      return;
    }
    const arr = Array.isArray(contractsData) ? contractsData : [];
    // build customer lookup from customersData
    const byId = {};
    if (Array.isArray(customersData)) {
      customersData.forEach((c) => {
        byId[c.id] = c.name || c.customer_name || (c.customer && c.customer.name) || null;
      });
    }
    const enriched = arr.map((c) => ({
      ...c,
      customer: c.customer || (c.customer_id ? { name: byId[c.customer_id] || c.customerName || c.customer_temp || null } : c.customer),
    }));
    setList(enriched);
    setError(null);
  }, [contractsData, contractsIsError, contractsError, customersData]);

  // refetch when reloadCounter increments
  useEffect(() => {
    if (reloadCounter > 0 && typeof refetchContracts === 'function') refetchContracts();
  }, [reloadCounter, refetchContracts]);

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


