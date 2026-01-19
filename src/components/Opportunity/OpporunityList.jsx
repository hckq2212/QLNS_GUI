import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetAllOpportunityQuery, useGetOpportunityByStatusQuery } from '../../services/opportunity';
import { formatPrice } from '../../utils/FormatValue';
import { useGetAllUserQuery } from '../../services/user';
import { OPPPORTUNITY_STATUS_LABELS } from '../../utils/enums';

export default function OpporunityList() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 15;

  const { data: allOpportunities = [], isLoading: loadingAll, isError: errorAll, error: allError } = useGetAllOpportunityQuery();
  const { data: statusOpportunities = [], isLoading: loadingStatus } = useGetOpportunityByStatusQuery(statusFilter, { skip: statusFilter === 'all' });

  const opportunities = statusFilter === 'all' ? (Array.isArray(allOpportunities) ? allOpportunities : []) : (Array.isArray(statusOpportunities) ? statusOpportunities : []);

  const { data: users = [] } = useGetAllUserQuery();

  const getCreatorName = (createdBy) => {
    if (!createdBy) return '—';
    // attempt to find in users cache
    const u = Array.isArray(users) ? users.find((x) => String(x.id) === String(createdBy)) : null;
    return u?.full_name || u?.name || String(createdBy) || '—';
  };

  // derive distinct statuses for a quick filter list (from allOpportunities)
  const statusOptions = useMemo(() => {
    const set = new Set();
    if (Array.isArray(allOpportunities)) {
      allOpportunities.forEach((o) => { if (o?.status) set.add(String(o.status)); });
    }
    return ['all', ...Array.from(set)];
  }, [allOpportunities]);

  // Filter opportunities based on search term
  const filteredOpportunities = useMemo(() => {
    if (!searchTerm.trim()) return opportunities;
    
    const lowerSearch = searchTerm.toLowerCase().trim();
    return opportunities.filter((o) => {
      const name = (o.name || '').toLowerCase();
      const customerName = (o.customer?.name || o.customer_name || o.customer_temp?.name || '').toLowerCase();
      return name.includes(lowerSearch) || customerName.includes(lowerSearch);
    });
  }, [opportunities, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOpportunities = filteredOpportunities.slice(startIndex, endIndex);

  // Reset to page 1 when opportunities or search term change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredOpportunities.length, statusFilter, searchTerm]);

  if (loadingAll) return <div className="p-6">Loading opportunities...</div>;
  if (errorAll) return <div className="p-6 text-red-600">Error loading opportunities: {allError?.message || 'Unknown'}</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-600">Danh sách cơ hội</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên cơ hội hoặc khách hàng..."
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

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full table-auto text-sm text-left">
          <thead>
            <tr className="bg-[#e7f1fd] text-blue-600">
              <th className="px-4 py-2 text-left">Tên cơ hội</th>
              <th className="px-4 py-2 text-left">Khách hàng</th>
              <th className="px-4 py-2 text-left">Trạng thái</th>
              <th className="px-4 py-2 text-left">Người tạo</th>
              <th className="px-4 py-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">Không có cơ hội nào</td>
              </tr>
            ) : filteredOpportunities.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">Không tìm thấy cơ hội phù hợp với "{searchTerm}"</td>
              </tr>
            ) : (
              currentOpportunities.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-2">{o.code}-{o.name}</td>
                  <td className="px-4 py-2">{o.customer?.name || o.customer_name || o.customer_temp?.name || '—'}</td>
                  <td className="px-4 py-2">{OPPPORTUNITY_STATUS_LABELS[o.status] || o.status || '—'}</td>
                  <td className="px-4 py-2">{getCreatorName(o.created_by)}</td>
                  <td className="px-4 py-2 align-top">
                    <Link to={`/opportunity/${o.id}`} className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm">
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center px-4 py-3 border-t bg-[#e7f1fd]">
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
    </div>
  );
}
