import React, { useState } from 'react';
import { useGetAllCustomerQuery } from '../../services/customer';
import { useGetAllContractsQuery } from '../../services/contract';
import { useGetAllDebtsQuery } from '../../services/debt';
import { formatDate, formatPrice } from '../../utils/FormatValue';
import { useNavigate } from 'react-router-dom';

export default function DebtList() {
  const navigate = useNavigate();
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: customers, isLoading: loadingCustomers } = useGetAllCustomerQuery();
  const { data: allContracts, isLoading: loadingContracts } = useGetAllContractsQuery();
  const { data: allDebts, isLoading: loadingDebts } = useGetAllDebtsQuery();

  // Lọc hợp đồng theo khách hàng được chọn
  const filteredContracts = React.useMemo(() => {
    if (!selectedCustomerId || !allContracts) return [];
    return allContracts.filter(c => c.customer_id === selectedCustomerId);
  }, [selectedCustomerId, allContracts]);

  // Lọc debt theo hợp đồng được chọn
  const filteredDebts = React.useMemo(() => {
    if (!selectedContractId || !allDebts) return [];
    return allDebts.filter(d => d.contract_id === selectedContractId);
  }, [selectedContractId, allDebts]);

  // Tính tổng giá trị hợp đồng cho mỗi khách hàng
  const customerContractStats = React.useMemo(() => {
    if (!customers || !allContracts) return {};
    const stats = {};
    customers.forEach(customer => {
      const contracts = allContracts.filter(c => c.customer_id === customer.id);
      stats[customer.id] = {
        count: contracts.length,
        total: contracts.reduce((sum, c) => sum + (parseFloat(c.total_amount || c.contract_value || 0)), 0)
      };
    });
    return stats;
  }, [customers, allContracts]);

  // Tính tổng debt cho mỗi hợp đồng
  const contractDebtStats = React.useMemo(() => {
    if (!filteredContracts || !allDebts) return {};
    const stats = {};
    filteredContracts.forEach(contract => {
      const debts = allDebts.filter(d => d.contract_id === contract.id);
      const total = debts.reduce((sum, d) => sum + (parseFloat(d.amount || 0)), 0);
      const paid = debts.reduce((sum, d) => sum + (parseFloat(d.paid_amount || 0)), 0);
      stats[contract.id] = {
        count: debts.length,
        total: total,
        paid: paid,
        remaining: total - paid
      };
    });
    return stats;
  }, [filteredContracts, allDebts]);

  const handleBackToCustomers = () => {
    setSelectedCustomerId(null);
    setSelectedContractId(null);
  };

  const handleBackToContracts = () => {
    setSelectedContractId(null);
  };

  // Lọc khách hàng theo search query
  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    if (!searchQuery.trim()) return customers;
    
    const query = searchQuery.toLowerCase();
    return customers.filter(customer => {
      const name = (customer.name || customer.company_name || '').toLowerCase();
      const email = (customer.email || '').toLowerCase();
      const phone = (customer.phone || '').toLowerCase();
      return name.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [customers, searchQuery]);

  const getDebtStatusColor = (debt) => {
    if (debt.status === 'paid') return 'text-green-600';
    if (debt.status === 'overdue') return 'text-red-600';
    if (debt.status === 'pending') return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getDebtStatusText = (debt) => {
    if (debt.status === 'paid') return 'Đã thanh toán';
    if (debt.status === 'overdue') return 'Quá hạn';
    if (debt.status === 'pending') return 'Chờ thanh toán';
    return debt.status || 'Không xác định';
  };

  if (loadingCustomers || loadingContracts || loadingDebts) {
    return <div className="p-6">Đang tải dữ liệu...</div>;
  }

  // Màn hình 3: Danh sách debt của hợp đồng
  if (selectedContractId) {
    const selectedContract = allContracts?.find(c => c.id === selectedContractId);
    
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={handleBackToContracts}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              ← Quay lại danh sách hợp đồng
            </button>
            <h1 className="text-2xl font-bold text-blue-600">
              Lộ trình thanh toán - {selectedContract?.code || `Hợp đồng #${selectedContractId}`}
            </h1>
          </div>
        </div>

        {filteredDebts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            Chưa có lộ trình thanh toán nào cho hợp đồng này
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-blue-50 ">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đợt thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đã thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Còn lại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hạn thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDebts.map((debt) => {
                  const amount = parseFloat(debt.amount || 0);
                  const paid = parseFloat(debt.paid_amount || 0);
                  const remaining = amount - paid;

                  return (
                    <tr key={debt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {debt.description || debt.payment_term || `Đợt ${debt.id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatPrice(amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 font-medium">{formatPrice(paid)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-orange-600 font-medium">{formatPrice(remaining)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(debt.due_date || debt.deadline)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getDebtStatusColor(debt)}`}>
                          {getDebtStatusText(debt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => navigate(`/debt/${debt.id}`)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Chi tiết
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
    );
  }

  // Màn hình 2: Danh sách hợp đồng của khách hàng
  if (selectedCustomerId) {
    const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);
    
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={handleBackToCustomers}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              ← Quay lại danh sách khách hàng
            </button>
            <h1 className="text-2xl font-bold text-blue-600">
              Hợp đồng của {selectedCustomer?.name || 'Khách hàng'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredContracts.length} hợp đồng
            </p>
          </div>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            Khách hàng này chưa có hợp đồng nào
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map((contract) => {
              const debtStats = contractDebtStats[contract.id] || { count: 0, total: 0, paid: 0, remaining: 0 };
              
              return (
                <div
                  key={contract.id}
                  onClick={() => setSelectedContractId(contract.id)}
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-blue-500"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-blue-700 mb-1">
                      {contract.name || contract.title || 'Hợp đồng không tên'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Mã: {contract.code || `#${contract.id}`}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá trị:</span>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(contract.total_amount || contract.contract_value || 0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày ký:</span>
                      <span className="text-gray-900">
                        {formatDate(contract.sign_date || contract.signed_date)}
                      </span>
                    </div>

                    {debtStats.count > 0 && (
                      <>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Số đợt thanh toán:</span>
                            <span className="font-medium">{debtStats.count}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">Đã thu:</span>
                            <span className="font-medium text-green-600">
                              {formatPrice(debtStats.paid)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-orange-600">Còn lại:</span>
                            <span className="font-medium text-orange-600">
                              {formatPrice(debtStats.remaining)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <span className="text-xs text-blue-600 font-medium">
                      Click để xem chi tiết thanh toán →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Màn hình 1: Danh sách khách hàng
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-600">Quản lý thanh toán theo khách hàng</h1>

      </div>

      {/* Search Box */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm khách hàng theo tên, email hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2">
            Tìm thấy {filteredCustomers.length} khách hàng
          </p>
        )}
      </div>

      {!filteredCustomers || filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
          {searchQuery ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào trong hệ thống'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const stats = customerContractStats[customer.id] || { count: 0, total: 0 };
            
            return (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomerId(customer.id)}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-green-500"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-600">
                    {customer.name  || `#${customer.id}`}
                  </h3>
                </div>

                <div className="space-y-2 text-sm">
                  {customer.email && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📧</span>
                      <span>{customer.email}</span>
                    </div>
                  )}
                  
                  {customer.phone && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📞</span>
                      <span>{customer.phone}</span>
                    </div>
                  )}

                </div>

                <div className="mt-4 pt-3 border-t">
                  <span className="text-xs text-blue-600 font-medium">
                    Click để xem chi tiết hợp đồng →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
