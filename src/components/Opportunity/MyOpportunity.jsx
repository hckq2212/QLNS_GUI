import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useGetMyOpportunitiesQuery, useGetOpportunityServicesQuery } from '../../services/opportunity.js';
import { useGetAllCustomerQuery } from '../../services/customer';
import { useGetAllUserQuery } from '../../services/user';
import { useGetAllBusinessFieldsQuery } from '../../services/businessField.js';
import { OPPPORTUNITY_STATUS_LABELS, PRIORITY_OPTIONS } from '../../utils/enums.js';
import { formatPrice, formatRate } from '../../utils/FormatValue.js';

export default function MyOpportunity() {
  const token = useSelector((s) => s.auth.accessToken);
  const { data, isLoading, isError, error } = useGetMyOpportunitiesQuery(undefined, { skip: !token });
  const { data: customers } = useGetAllCustomerQuery(undefined, { skip: !token });
  const { data: users } = useGetAllUserQuery(undefined, { skip: !token });
  const { data: businessFieldsData } = useGetAllBusinessFieldsQuery(undefined, { skip: !token });

  const [list, setList] = useState([]);
  
  // Sorting states
  const [sortBy, setSortBy] = useState(null); // 'name', 'customer', 'budget', 'revenue', 'success_rate'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCreator, setFilterCreator] = useState('');
  const [filterBusinessField, setFilterBusinessField] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  useEffect(() => {
    const arr = Array.isArray(data) ? data : [];

    const customerById = {};
    if (Array.isArray(customers)) customers.forEach((c) => { customerById[c.id] = c.name || c.customer_name || c.customer?.name; });

    const userById = {};
    if (Array.isArray(users)) users.forEach((u) => { userById[u.id] = u.full_name || u.name || null; });

    const businessFields = Array.isArray(businessFieldsData) ? businessFieldsData : (Array.isArray(businessFieldsData?.items) ? businessFieldsData.items : []);
    const businessFieldByCode = {};
    businessFields.forEach((bf) => { businessFieldByCode[bf.code] = bf.name; });

    const enriched = arr.map((o) => ({
      ...o,
      customer_name: o.customer?.name || (o.customer_id ? customerById[o.customer_id] : undefined) ,
      business_field_name: o.business_field ? businessFieldByCode[o.business_field] : null,
      creator_name: o.created_by ? userById[o.created_by] : null,
    }));

    // Apply filters
    let filtered = enriched;
    if (filterStatus) {
      filtered = filtered.filter(o => o.status === filterStatus);
    }
    if (filterCreator) {
      filtered = filtered.filter(o => o.created_by === Number(filterCreator));
    }
    if (filterBusinessField) {
      filtered = filtered.filter(o => o.business_field === filterBusinessField);
    }
    if (filterPriority) {
      filtered = filtered.filter(o => o.priority === filterPriority);
    }

    // Apply sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
          case 'name':
            aVal = (a.name || '').toLowerCase();
            bVal = (b.name || '').toLowerCase();
            break;
          case 'customer':
            aVal = (a.customer_name || '').toLowerCase();
            bVal = (b.customer_name || '').toLowerCase();
            break;
          case 'budget':
            aVal = Number(a.expected_budget) || 0;
            bVal = Number(b.expected_budget) || 0;
            break;
          case 'revenue':
            aVal = Number(a.expected_revenue) || 0;
            bVal = Number(b.expected_revenue) || 0;
            break;
          case 'success_rate':
            aVal = Number(a.success_rate) || 0;
            bVal = Number(b.success_rate) || 0;
            break;
          default:
            return 0;
        }
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setList(filtered);
  }, [data, customers, users, businessFieldsData, sortBy, sortOrder, filterStatus, filterCreator, filterBusinessField, filterPriority]);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load'}</div>;

  // Get unique values for filters
  const allData = Array.isArray(data) ? data : [];
  const uniqueStatuses = [...new Set(allData.map(o => o.status))].filter(Boolean);
  const uniqueCreators = [...new Set(allData.map(o => o.created_by))].filter(Boolean);
  const businessFields = Array.isArray(businessFieldsData) ? businessFieldsData : (Array.isArray(businessFieldsData?.items) ? businessFieldsData.items : []);
  const uniqueBusinessFields = [...new Set(allData.map(o => o.business_field))].filter(Boolean);
  const uniquePriorities = [...new Set(allData.map(o => o.priority))].filter(Boolean);

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <span className="ml-1 text-gray-400">⇅</span>;
    return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="p-3 max-w-7xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-blue-600">Cơ hội đã tạo</h2>      
      {/* Filter Section */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Trạng thái</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full border rounded p-2 text-sm"
          >
            <option value="">Tất cả</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>
                {OPPPORTUNITY_STATUS_LABELS[status] || status}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-600 mb-1">Người tạo</label>
          <select 
            value={filterCreator} 
            onChange={(e) => setFilterCreator(e.target.value)}
            className="w-full border rounded p-2 text-sm"
          >
            <option value="">Tất cả</option>
            {uniqueCreators.map(creatorId => {
              const user = Array.isArray(users) ? users.find(u => u.id === creatorId) : null;
              return (
                <option key={creatorId} value={creatorId}>
                  {user?.full_name || user?.name || `#${creatorId}`}
                </option>
              );
            })}
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-600 mb-1">Lĩnh vực</label>
          <select 
            value={filterBusinessField} 
            onChange={(e) => setFilterBusinessField(e.target.value)}
            className="w-full border rounded p-2 text-sm"
          >
            <option value="">Tất cả</option>
            {uniqueBusinessFields.map(code => {
              const field = businessFields.find(bf => bf.code === code);
              return (
                <option key={code} value={code}>
                  {field?.name || code}
                </option>
              );
            })}
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-600 mb-1">Mức độ ưu tiên</label>
          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full border rounded p-2 text-sm"
          >
            <option value="">Tất cả</option>
            {uniquePriorities.map(priority => (
              <option key={priority} value={priority}>
                {PRIORITY_OPTIONS.find(p => p.value === priority)?.label || priority}
              </option>
            ))}
          </select>
        </div>
      </div>
      {list.length === 0 ? (
        <div className="text-sm text-gray-600">Bạn chưa có cơ hội nào</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm border-collapse text-left min-w-max">
            <thead>
                <tr className="text-blue-600 bg-[#e7f1fd]">
                  <th className="px-3 py-2 border whitespace-nowrap cursor-pointer hover:bg-blue-100" onClick={() => handleSort('name')}>
                    Tên <SortIcon column="name" />
                  </th>
                  <th className="px-3 py-2 border whitespace-nowrap cursor-pointer hover:bg-blue-100" onClick={() => handleSort('customer')}>
                    Khách hàng <SortIcon column="customer" />
                  </th>
                  <th className="px-3 py-2 border whitespace-nowrap">Người tạo</th>
                  <th className="px-3 py-2 border whitespace-nowrap">Lĩnh vực</th>
                  <th className="px-3 py-2 border whitespace-nowrap cursor-pointer hover:bg-blue-100" onClick={() => handleSort('budget')}>
                    Ngân sách dự kiến <SortIcon column="budget" />
                  </th>
                  <th className="px-3 py-2 border whitespace-nowrap cursor-pointer hover:bg-blue-100" onClick={() => handleSort('revenue')}>
                    Doanh thu kỳ vọng <SortIcon column="revenue" />
                  </th>
                  <th className="px-3 py-2 border whitespace-nowrap cursor-pointer hover:bg-blue-100" onClick={() => handleSort('success_rate')}>
                    Khả năng thành công <SortIcon column="success_rate" />
                  </th>
                  <th className="px-3 py-2 border whitespace-nowrap">Mức độ ưu tiên</th>
                  <th className="px-3 py-2 border whitespace-nowrap">Trạng thái</th>
                  <th className="px-3 py-2 border whitespace-nowrap">Xem</th>
                </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 border whitespace-nowrap">
                    <Link to={`/opportunity/${o.id}`} className="text-blue-600 hover:underline">
                      {o.code} - {o.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 border">
                    {o.customer_id ? (
                      <Link to={`/customer/${o.customer_id}`} className="text-blue-600 hover:underline">
                        {o.customer_name || 'Chưa có'}
                      </Link>
                    ) : (
                      <span>{o.customer_name || 'Chưa có'}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 border">
                    {o.created_by ? (
                      <Link to={`/user/${o.created_by}`} className="text-blue-600 hover:underline">
                        {o.creator_name || 'Chưa có'}
                      </Link>
                    ) : (
                      <span>{o.creator_name || 'Chưa có'}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 border">{o.business_field_name || '—'}</td>
                  <td className="px-3 py-2 border text-right whitespace-nowrap">{o.expected_budget ? formatPrice(o.expected_budget) + ' VNĐ' : '—'}</td>
                  <td className="px-3 py-2 border text-right whitespace-nowrap">{o.expected_revenue ? formatPrice(o.expected_revenue) + ' VNĐ' : '—'}</td>
                  <td className="px-3 py-2 border text-center">
                    <Link to={`/opportunity/${o.id}`} className="text-blue-600 hover:underline">
                      {formatRate(o.success_rate) || '—'}
                    </Link>
                  </td>
                  <td className="px-3 py-2 border">
                    <Link to={`/opportunity/${o.id}`} className="text-blue-600 hover:underline">
                      {PRIORITY_OPTIONS.find((p) => p.value === o.priority)?.label || '—'}
                    </Link>
                  </td>
                  <td className="px-3 py-2 border">
                    <Link to={`/opportunity/${o.id}`} className="text-blue-600 hover:underline">
                      {OPPPORTUNITY_STATUS_LABELS[o.status] || o.status || '—'}
                    </Link>
                  </td>
                  <td className="px-3 py-2 border">
                    <Link to={`/opportunity/${o.id}`} className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap hover:bg-blue-700">
                      Xem chi tiết
                    </Link>
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
