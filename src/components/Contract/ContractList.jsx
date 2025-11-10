import React from 'react';
import { Link } from 'react-router-dom';
import { useGetAllContractsQuery } from '../../services/contract';
import { useGetContractsByStatusQuery } from '../../services/contract';
import { formatPrice } from '../../utils/FormatValue';

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Danh sách hợp đồng</h2>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Đang tải hợp đồng...</div>
      ) : error ? (
        <div className="text-sm text-red-600">Lỗi khi tải hợp đồng: {errAll?.message || errByStatus?.message || 'Unknown'}</div>
      ) : contracts.length === 0 ? (
        <div className="text-sm text-gray-600">Không có hợp đồng</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 border">ID</th>
                <th className="px-4 py-3 border">Tên hợp đồng</th>
                <th className="px-4 py-3 border">Khách hàng</th>
                <th className="px-4 py-3 border">Trạng thái</th>
                <th className="px-4 py-3 border">Doanh thu</th>
                <th className="px-4 py-3 border">Người tạo</th>
                <th className="px-4 py-3 border">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">{c.id}</td>
                  <td className="px-4 py-3 align-top">{c.name || c.contract_name || c.title || '—'}</td>
                  <td className="px-4 py-3 align-top">{c.customer?.name || c.customer_name || c.customer_temp?.name || '—'}</td>
                  <td className="px-4 py-3 align-top">{c.status || '—'}</td>
                  <td className="px-4 py-3 align-top">{formatPrice(c.totalRevenue ?? c.total_revenue ?? c.expected_revenue ?? 0)} VND</td>
                  <td className="px-4 py-3 align-top">{(c.created_by_user && (c.created_by_user.full_name || c.created_by_user.name)) || c.created_by || '—'}</td>
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
