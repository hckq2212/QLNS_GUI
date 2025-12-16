import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useGetMyOpportunitiesQuery, useGetOpportunityServicesQuery } from '../../services/opportunity.js';
import { useGetAllCustomerQuery } from '../../services/customer';
import { useGetAllUserQuery } from '../../services/user';
import { OPPPORTUNITY_STATUS_LABELS } from '../../utils/enums.js';

export default function MyOpportunity() {
  const token = useSelector((s) => s.auth.accessToken);
  const { data, isLoading, isError, error } = useGetMyOpportunitiesQuery(undefined, { skip: !token });
  const { data: customers } = useGetAllCustomerQuery(undefined, { skip: !token });
  const { data: users } = useGetAllUserQuery(undefined, { skip: !token });

  const [list, setList] = useState([]);

  useEffect(() => {
    const arr = Array.isArray(data) ? data : [];

    const customerById = {};
    if (Array.isArray(customers)) customers.forEach((c) => { customerById[c.id] = c.name || c.customer_name || c.customer?.name; });

    const userById = {};
    if (Array.isArray(users)) users.forEach((u) => { userById[u.id] = u.full_name || u.name || null; });

    const enriched = arr.map((o) => ({
      ...o,
      customer_name: o.customer?.name || (o.customer_id ? customerById[o.customer_id] : undefined) ,
    }));

    setList(enriched);
  }, [data, customers, users]);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load'}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-blue-600">Cơ hội đã tạo</h2>
      {list.length === 0 ? (
        <div className="text-sm text-gray-600">Bạn chưa có cơ hội nào</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse text-left">
            <thead>
                <tr className="text-blue-600 bg-[#e7f1fd]">
                  <th className="px-3 py-2 border">Tên</th>
                  <th className="px-3 py-2 border">Khách hàng</th>
                  <th className="px-3 py-2 border">Trạng thái</th>
                  <th className="px-3 py-2 border">Hành động</th>
                </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-3 py-2 align-top">{o.name  || '—'}</td>
                  <td className="px-3 py-2 align-top">{o.customer_name || 'Chưa có'}</td>
                  <td className="px-3 py-2 align-top">{OPPPORTUNITY_STATUS_LABELS[o.status] || o.status || '—'}</td>
                  <td className="px-3 py-2 align-top">
                    <Link to={`/opportunity/${o.id}`} className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm">
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
