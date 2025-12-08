import React from 'react';
import { Link } from 'react-router-dom';
import { useGetReferralsQuery, useDeleteReferralMutation } from '../../services/referral';
import { toast } from 'react-toastify';

export default function ReferalList() {
  const { data: referrals = [], isLoading, isError, error } = useGetReferralsQuery();
  const [deleteReferral, { isLoading: deleting }] = useDeleteReferralMutation();

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa đối tác "${name}"?`)) return;
    
    try {
      await deleteReferral(id).unwrap();
      toast.success('Đã xóa đối tác thành công');
    } catch (err) {
      console.error('Delete referral error', err);
      toast.error(err?.data?.error || 'Không thể xóa đối tác');
    }
  };

  if (isLoading) return <div className="p-6">Đang tải danh sách đối tác...</div>;
  if (isError) return <div className="p-6 text-red-600">Lỗi: {error?.data?.error || error?.message || 'Không thể tải danh sách'}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-blue-600">Danh sách đối tác giới thiệu</h2>
          <Link to="/referral/create" className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
            Thêm đối tác
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm text-left">
            <thead>
              <tr className="bg-gray-50 text-blue-600">
                <th className="px-4 py-2">Tên đối tác</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Số điện thoại</th>
                <th className="px-4 py-2">Địa chỉ</th>
                <th className="px-4 py-2">Trạng thái</th>
                <th className="px-4 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Chưa có đối tác nào
                  </td>
                </tr>
              ) : (
                referrals.map((referral) => (
                  <tr key={referral.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{referral.name || referral.partner_name || '—'}</td>
                    <td className="px-4 py-2">{referral.email || '—'}</td>
                    <td className="px-4 py-2">{referral.phone || referral.phone_number || '—'}</td>
                    <td className="px-4 py-2">{referral.address || '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        referral.is_active === false 
                          ? 'bg-gray-200 text-gray-700' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {referral.is_active === false ? 'Không hoạt động' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Link
                          to={`/referral/${referral.id}`}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                        >
                          Xem
                        </Link>
                        <button
                          onClick={() => handleDelete(referral.id, referral.name || referral.partner_name)}
                          disabled={deleting}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs disabled:opacity-50"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
