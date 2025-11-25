import React from 'react';
import { Link } from 'react-router-dom';
import { useGetAllContractsQuery } from '../../services/contract';
import { useGetContractsByStatusQuery } from '../../services/contract';
import { useGetAllCustomerQuery } from '../../services/customer';
import { formatPrice } from '../../utils/FormatValue';
import { CONTRACT_STATUS_LABELS } from '../../utils/enums';

export default function ContractList({ statusFilter = 'all' } = {}) {
  // If statusFilter is provided (e.g. 'waiting_bod_approval'), you can use the status query
  const {
    data: contractsAll,
    isLoading: loadingAll,
    isError: errorAll,
    error: errAll,
  } = useGetAllContractsQuery(undefined, { skip: statusFilter !== 'all' });

  const {
    data: contractsByStatus,
    isLoading: loadingByStatus,
    isError: errorByStatus,
    error: errByStatus,
  } = useGetContractsByStatusQuery(statusFilter, { skip: statusFilter === 'all' });

  const loading = statusFilter === 'all' ? loadingAll : loadingByStatus;
  const error = statusFilter === 'all' ? errorAll : errorByStatus;
  const contracts = statusFilter === 'all' ? (contractsAll || []) : (contractsByStatus || []);
  const { data: customersData = [] } = useGetAllCustomerQuery();

  const customerById = React.useMemo(() => {
    const m = {};
    if (Array.isArray(customersData)) {
      customersData.forEach((c) => {
        // prefer id, but also support customer.id or customer.customer_id
        if (c.id) m[c.id] = c;
        if (c.customer_id) m[c.customer_id] = c;
      });
    }
    return m;
  }, [customersData]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-600">Danh sách hợp đồng</h2>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Đang tải hợp đồng...</div>
      ) : error ? (
        <div className="text-sm text-red-600">Lỗi khi tải hợp đồng: {errAll?.message || errByStatus?.message || 'Unknown'}</div>
      ) : contracts.length === 0 ? (
        <div className="text-sm text-gray-600">Không có hợp đồng</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-[#e7f1fd] text-left">
              <tr>
                <th className="px-4 py-3 border text-blue-700">Tên hợp đồng</th>
                <th className="px-4 py-3 border text-blue-700">Mã hợp đồng</th>
                <th className="px-4 py-3 border text-blue-700">Khách hàng</th>
                <th className="px-4 py-3 border text-blue-700">Trạng thái</th>
                <th className="px-4 py-3 border text-blue-700">Doanh thu</th>
                <th className="px-4 py-3 border text-blue-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">{c.name || c.contract_name || c.title || '—'}</td>
                  <td className="px-4 py-3 align-top">{c.code || '—'}</td>
                  <td className="px-4 py-3 align-top">{(
                    (c.customer_id && customerById[c.customer_id] && (customerById[c.customer_id].name || customerById[c.customer_id].customer_name)) ||
                    '—'
                  )}</td>
                  <td className="px-4 py-3 align-top">{CONTRACT_STATUS_LABELS[c.status] || '—'}</td>
                  <td className="px-4 py-3 align-top">{formatPrice(c.totalRevenue ?? c.total_revenue ?? c.expected_revenue ?? 0)} VND</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex gap-2">
                      <Link to={`/contract/${c.id}`} className="px-3 py-1 rounded bg-blue-600 text-white text-xs">Xem</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
