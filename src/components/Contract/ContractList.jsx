import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetAllContractsQuery } from '../../services/contract';
import { useGetContractsByStatusQuery } from '../../services/contract';
import { useGetAllCustomerQuery } from '../../services/customer';
import { formatPrice } from '../../utils/FormatValue';
import { CONTRACT_STATUS_LABELS } from '../../utils/enums';

export default function ContractList({ statusFilter = 'all' } = {}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 15;
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

  // Filter contracts based on search term
  const filteredContracts = React.useMemo(() => {
    if (!searchTerm.trim()) return contracts;
    
    const lowerSearch = searchTerm.toLowerCase().trim();
    return contracts.filter((c) => {
      const name = (c.name || c.contract_name || c.title || '').toLowerCase();
      const code = (c.code || '').toLowerCase();
      return name.includes(lowerSearch) || code.includes(lowerSearch);
    });
  }, [contracts, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContracts = filteredContracts.slice(startIndex, endIndex);

  // Reset to page 1 when contracts or search term change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredContracts.length, statusFilter, searchTerm]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-600">Danh sách hợp đồng</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã hợp đồng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-3 py-2 text-gray-500 hover:text-gray-700"
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Đang tải hợp đồng...</div>
      ) : error ? (
        <div className="text-sm text-red-600">Lỗi khi tải hợp đồng: {errAll?.message || errByStatus?.message || 'Unknown'}</div>
      ) : contracts.length === 0 ? (
        <div className="text-sm text-gray-600">Không có hợp đồng</div>
      ) : filteredContracts.length === 0 ? (
        <div className="text-sm text-gray-600">Không tìm thấy hợp đồng phù hợp với "{searchTerm}"</div>
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
              {currentContracts.map((c) => (
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-[#e7f1fd]">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Trang trước
                </button>
                
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded text-sm ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return <span key={pageNum} className="px-2 py-1 text-gray-500">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
