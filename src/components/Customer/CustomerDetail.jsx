import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetCustomerByIdQuery } from '../../services/customer';
import { useGetAllContractsQuery } from '../../services/contract';
import { useGetAllDebtsQuery } from '../../services/debt';
import { formatPrice, formatDate } from '../../utils/FormatValue';
import { CONTRACT_STATUS_LABELS, DEBT_STATUS } from '../../utils/enums';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: customer, isLoading: customerLoading, isError: customerError } = useGetCustomerByIdQuery(id, { skip: !id });
  const { data: allContracts = [], isLoading: contractsLoading } = useGetAllContractsQuery();
  const { data: allDebts = [], isLoading: debtsLoading } = useGetAllDebtsQuery();

  // Filter contracts by customer_id
  const customerContracts = useMemo(() => {
    if (!Array.isArray(allContracts) || !id) return [];
    return allContracts.filter(c => String(c.customer_id) === String(id));
  }, [allContracts, id]);

  // Filter debts by customer_id (debts might have contract_id, need to match through contracts)
  const customerDebts = useMemo(() => {
    if (!Array.isArray(allDebts) || !id) return [];
    const contractIds = customerContracts.map(c => c.id || c.contract_id);
    return allDebts.filter(d => {
      // Check if debt has customer_id directly
      if (d.customer_id && String(d.customer_id) === String(id)) return true;
      // Or check if debt's contract_id matches customer's contracts
      const debtContractId = d.contract_id ;
      return debtContractId && contractIds.includes(debtContractId);
    });
  }, [allDebts, id, customerContracts]);

  if (!id) return <div className="p-6">No customer id provided</div>;
  if (customerLoading) return <div className="p-6">Loading customer...</div>;
  if (customerError) return <div className="p-6 text-red-600">Failed to load customer</div>;
  if (!customer) return <div className="p-6 text-gray-600">Customer not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto ">
      {/* Header */}
      <div className="flex justify-start">
        <button onClick={() => navigate('/customer')} className="mb-3 text-blue-600 hover:underline">
          ← Quay lại
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 text-left pb-4">
        {/* Card 1: Customer Information */}
        <div className="col-span-5 bg-white rounded shadow p-6 row-span-2 h-fit">
          <h2 className="text-md font-semibold text-blue-700">Thông tin khách hàng</h2>
          <hr className="my-4" />
          
          <div className="mb-4">
            <div className="text-xs text-gray-500">Tên khách hàng</div>
            <div className="text-lg font-medium text-blue-600">{customer.name || '—'}</div>
          </div>
    


          <div className="grid grid-cols-2 gap-4">
            {customer.email && (
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="text-sm text-gray-700">{customer.email}</div>
              </div>
            )}

            {customer.phone && (
              <div>
                <div className="text-xs text-gray-500">Số điện thoại</div>
                <div className="text-sm text-gray-700">{customer.phone}</div>
              </div>
            )}

            {customer.tax_code && (
              <div>
                <div className="text-xs text-gray-500">Mã số thuế</div>
                <div className="text-sm text-gray-700">{customer.tax_code}</div>
              </div>
            )}
            
            {customer.address && (
            <div>
              <div className="text-xs text-gray-500">Địa chỉ</div>
              <div className="text-sm text-gray-700">{customer.address}</div>
            </div>
          )}



          </div>


        </div>

        {/* Card 2: Contracts */}
        <div className="col-span-7 bg-white rounded shadow p-6 h-fit">
          <h2 className="text-md font-semibold text-blue-700">Hợp đồng </h2>
          <hr className="my-4" />
          
          {contractsLoading ? (
            <div className="text-sm text-gray-500">Đang tải...</div>
          ) : customerContracts.length === 0 ? (
            <div className="text-sm text-gray-500">Chưa có hợp đồng nào</div>
          ) : (
            <div className="mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#e7f1fd]">
                    <th className="px-3 py-2 text-left text-blue-700">Mã HĐ</th>
                    <th className="px-3 py-2 text-left text-blue-700">Tên hợp đồng</th>
                    <th className="px-3 py-2 text-left text-blue-700">Trạng thái</th>
                    <th className="px-3 py-2 text-left text-blue-700">Xem</th>
                  </tr>
                </thead>
                <tbody>
                  {customerContracts.map((contract) => (
                    <tr key={contract.id || contract.contract_id} className="border-t">
                      <td className="px-3 py-2 align-top">{contract.code || '—'}</td>
                      <td className="px-3 py-2 align-top">
                        <Link to={`/contract/${contract.id || contract.contract_id}`} className="text-blue-600 hover:underline">
                          {contract.name || contract.contract_name || '—'}
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-top">{CONTRACT_STATUS_LABELS[contract.status] || contract.status || '—'}</td>
                      <td className="px-3 py-2 align-top">
                        <button
                          onClick={() => navigate(`/contract/${contract.id || contract.contract_id}`)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Debts (Full Width) */}
      <div className="col-span-6 bg-yellow-50 border border-yellow-100 rounded p-4 shadow items-start h-fit">
        <h2 className="text-md font-semibold text-yellow-700 text-left">Công nợ</h2>
        <hr className="my-2" />
        
        {debtsLoading ? (
          <div className="text-sm text-gray-500">Đang tải...</div>
        ) : customerDebts.length === 0 ? (
          <div className="text-sm text-gray-500">Chưa có công nợ nào</div>
        ) : (
          <div className="text-sm text-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#fff7e6]">
                  <th className="px-3 py-2 text-left text-yellow-700">Tiêu đề</th>
                  <th className="px-3 py-2 text-left text-yellow-700">Số tiền</th>
                  <th className="px-3 py-2 text-left text-yellow-700">Hạn thanh toán</th>
                  <th className="px-3 py-2 text-left text-yellow-700">Trạng thái</th>
                  <th className="px-3 py-2 text-left text-yellow-700">Hợp đồng</th>
                  <th className="px-3 py-2 text-left text-yellow-700">Xem</th>
                </tr>
              </thead>
              <tbody>
                {customerDebts.map((debt) => {
                  const debtId = debt.id || debt.debt_id;
                  const contractId = debt.contract_id || debt.contractId;
                  const relatedContract = customerContracts.find(c => (c.id || c.contract_id) === contractId);
                  
                  return (
                    <tr key={debtId} className="border-t text-left">
                      <td className="px-3 py-2 align-top">
                        <Link to={`/debt/${debtId}`} className="text-blue-600 hover:underline">
                          {debt.title || debt.debt_title || `#${debtId}`}
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-top">{formatPrice(debt.amount || 0)} VNĐ</td>
                      <td className="px-3 py-2 align-top">{formatDate(debt.due_date)}</td>
                      <td className="px-3 py-2 align-top">{DEBT_STATUS[debt.status] || '—'}</td>
                      <td className="px-3 py-2 align-top">
                        {relatedContract ? (
                          <Link to={`/contract/${contractId}`} className="text-blue-600 hover:underline">
                            {relatedContract.code || relatedContract.name || `#${contractId}`}
                          </Link>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <button
                          onClick={() => navigate(`/debt/${debtId}`)}
                          className="px-2 py-1 bg-yellow-600 text-white rounded text-sm"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
