import React from 'react';
import { Link } from 'react-router-dom';
import { useGetAllCustomerQuery } from '../../services/customer';
import { useGetReferralsQuery } from '../../services/referral';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { CUSTOMER_STATUS_OPTIONS } from '../../utils/enums';

export default function CustomerList() {
  const token = useSelector((s) => s.auth.accessToken);
  const { data: customersData, isLoading, isError, error } = useGetAllCustomerQuery();
  const { data: referrals = [] } = useGetReferralsQuery(undefined, { skip: !token });

  const rows = Array.isArray(customersData) ? customersData : (customersData?.items || customersData?.data || []);
  
  // Create a lookup map for referrals
  const referralsById = React.useMemo(() => {
    if (!Array.isArray(referrals)) return {};
    return referrals.reduce((acc, ref) => {
      acc[ref.id] = ref;
      return acc;
    }, {});
  }, [referrals]);

  if (isLoading) return <div className="p-6">Đang tải danh sách khách hàng...</div>;
  if (isError) return <div className="p-6 text-red-600">Lỗi: {error?.message || 'Failed to load'}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-600">Danh sách khách hàng</h2>
        <Link to="/customer/create" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Tạo khách hàng</Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-gray-600">Không có khách hàng</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow text-left">
          <table className="min-w-full text-sm">
            <thead className="bg-[#e7f1fd] text-left">
              <tr>
                <th className="px-4 py-3 text-blue-700">Tên khách hàng</th>
                <th className="px-4 py-3 text-blue-700">Email</th>
                <th className="px-4 py-3 text-blue-700">Điện thoại</th>
                <th className="px-4 py-3 text-blue-700">Nguồn</th>
                <th className="px-4 py-3 text-blue-700">Trạng thái</th>
                <th className="px-4 py-3 text-blue-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const statusOption = CUSTOMER_STATUS_OPTIONS.find(opt => opt.value === c.status);
                const referral = c.referral_id ? referralsById[c.referral_id] : null;
                const sourceDisplay = c.customer_source === 'partner' 
                  ? (referral?.name || referral?.partner_name || `Khách hàng của đối tác`)
                  : 'Khách hàng trực tiếp';
                
                return (
                  <tr key={c.id || c._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 align-top">{c.name || c.customer_name || `#${c.id || c._id}`}</td>
                    <td className="px-4 py-3 align-top">{c.email || '—'}</td>
                    <td className="px-4 py-3 align-top">{c.phone || c.phone_number || '—'}</td>
                    <td className="px-4 py-3 align-top">
                      {c.customer_source === 'partner' ? (
                        <span className="text-sm text-blue-600">{sourceDisplay}</span>
                      ) : (
                        <span className="text-sm text-gray-700">{sourceDisplay}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`px-2 py-1 rounded text-xs ${
                        c.status === 'existing' 
                          ? 'bg-green-100 text-green-800' 
                          : c.status === 'potential'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {statusOption?.label || c.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {/* <div className="flex gap-2">
                        <Link to={`/customer/${c.id || c._id}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Xem chi tiết</Link>
                      </div> */}
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
