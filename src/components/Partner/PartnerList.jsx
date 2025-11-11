import React from 'react';
import { Link } from 'react-router-dom';
import { useGetPartnersQuery, useRemovePartnerMutation } from '../../services/partner';
import { toast } from 'react-toastify';
import { PARTNER_TYPE } from '../../utils/enums';

export default function PartnerList() {
  const { data: partnersData, isLoading, isError, error, refetch } = useGetPartnersQuery();
  const [removePartner, { isLoading: removing }] = useRemovePartnerMutation();

  const rows = Array.isArray(partnersData) ? partnersData : (partnersData?.items || []);

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa đối tác này?')) return;
    try {
      await removePartner(id).unwrap();
      toast.success('Xóa đối tác thành công');
      try { refetch && refetch(); } catch (e) {}
    } catch (err) {
      console.error('remove partner failed', err);
      toast.error(err?.data?.message || err?.message || 'Xóa thất bại');
    }
  };

  if (isLoading) return <div className="p-6">Đang tải danh sách đối tác...</div>;
  if (isError) return <div className="p-6 text-red-600">Lỗi: {error?.message || 'Failed to load'}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-600">Danh sách đối tác</h2>
        <Link to="/partner/create" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Tạo đối tác</Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-gray-600">Không có đối tác</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow text-left">
          <table className="min-w-full text-sm">
            <thead className="bg-[#e7f1fd] text-left">
              <tr>
                <th className="px-4 py-3 text-blue-700">Tên</th>
                <th className="px-4 py-3 text-blue-700">Người liên hệ</th>
                <th className="px-4 py-3 text-blue-700">Điện thoại</th>
                <th className="px-4 py-3 text-blue-700">Email</th>
                <th className="px-4 py-3 text-blue-700">Loại</th>
                <th className="px-4 py-3 text-blue-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id || p._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">{p.name || p.title || `#${p.id || p._id}`}</td>
                  <td className="px-4 py-3 align-top">{p.contact_name || p.contact || '—'}</td>
                  <td className="px-4 py-3 align-top">{p.phone || '—'}</td>
                  <td className="px-4 py-3 align-top">{p.email || '—'}</td>
                  <td className="px-4 py-3 align-top">{PARTNER_TYPE[p.type] || '—'}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex gap-2">
                      <Link to={`/partner/${p.id || p._id}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Xem</Link>
                      <button disabled={removing} onClick={() => handleDelete(p.id || p._id)} className="px-2 py-1 rounded bg-red-600 text-white text-xs">Xóa</button>
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
