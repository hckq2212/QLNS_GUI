import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetAllOpportunityQuery, useGetOpportunityByStatusQuery } from '../../services/opportunity';
import { formatPrice } from '../../utils/FormatValue';
import { useGetAllUserQuery } from '../../services/user';
import { OPPPORTUNITY_STATUS_LABELS } from '../../utils/enums';

export default function OpporunityList() {
  const [statusFilter, setStatusFilter] = useState('all');

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

  if (loadingAll) return <div className="p-6">Loading opportunities...</div>;
  if (errorAll) return <div className="p-6 text-red-600">Error loading opportunities: {allError?.message || 'Unknown'}</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Danh sách cơ hội</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Lọc theo trạng thái</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded p-2 text-sm">
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'Tất cả' : (OPPPORTUNITY_STATUS_LABELS[s] || s)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full table-auto text-sm text-left">
          <thead>
            <tr className="bg-gray-50">
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
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">Không tìm thấy cơ hội nào</td>
              </tr>
            ) : (
              opportunities.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-2">{o.name || ('#' + o.id)}</td>
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
      </div>
    </div>
  );
}
