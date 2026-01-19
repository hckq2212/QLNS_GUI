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
    }));

    setList(enriched);
  }, [data, customers, users, businessFieldsData]);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load'}</div>;

  return (
    <div className="p-3 max-w-7xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-blue-600">Cơ hội đã tạo</h2>
      {list.length === 0 ? (
        <div className="text-sm text-gray-600">Bạn chưa có cơ hội nào</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm border-collapse text-left min-w-max">
            <thead>
                <tr className="text-blue-600 bg-[#e7f1fd]">
                  <th className="px-3 py-2 border whitespace-nowrap">Tên</th>
                  <th className="px-3 py-2 border whitespace-nowrap">Khách hàng</th>
                  <th className="px-3 py-2 border whitespace-nowrap">Lĩnh vực</th>
                  <th className="px-3 py-2 border whitespace-nowrap">Ngân sách dự kiến</th>
                  <th className="px-3 py-2 border whitespace-nowrap">Doanh thu kỳ vọng</th>
                  <th className="px-3 py-2 border whitespace-nowrap">Khả năng thành công</th>
                  <th className="px-3 py-2 border whitespace-nowrap">Mức độ ưu tiên</th>
                  <th className="px-3 py-2 border whitespace-nowrap">Trạng thái</th>
                  <th className="px-3 py-2 border whitespace-nowrap">Xem</th>
                </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 border whitespace-nowrap">{o.code} - {o.name}</td>
                  <td className="px-3 py-2 border">{o.customer_name || 'Chưa có'}</td>
                  <td className="px-3 py-2 border">{o.business_field_name || '—'}</td>
                  <td className="px-3 py-2 border text-right whitespace-nowrap">{o.expected_budget ? formatPrice(o.expected_budget) + ' VNĐ' : '—'}</td>
                  <td className="px-3 py-2 border text-right whitespace-nowrap">{o.expected_revenue ? formatPrice(o.expected_revenue) + ' VNĐ' : '—'}</td>
                  <td className="px-3 py-2 border text-center">{formatRate(o.success_rate) || '—'}</td>
                  <td className="px-3 py-2 border">{PRIORITY_OPTIONS.find((p) => p.value === o.priority)?.label || '—'}</td>
                  <td className="px-3 py-2 border">{OPPPORTUNITY_STATUS_LABELS[o.status] || o.status || '—'}</td>
                  <td className="px-3 py-2 border">
                    <Link to={`/opportunity/${o.id}`} className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap">
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
