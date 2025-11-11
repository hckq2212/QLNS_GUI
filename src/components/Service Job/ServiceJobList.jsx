import React from 'react';
import { Link } from 'react-router-dom';
import { useGetServiceJobsQuery, useRemoveServiceJobMutation } from '../../services/serviceJob';
import { useGetServicesQuery } from '../../services/service';
import { formatPrice } from '../../utils/FormatValue';
import { toast } from 'react-toastify';
import { SERVICE_JOB_LABELS } from '../../utils/enums';

export default function ServiceJobList() {
  const { data: serviceJobsData, isLoading, isError, error, refetch } = useGetServiceJobsQuery();
  const { data: servicesData = [] } = useGetServicesQuery();
  const [removeServiceJob, { isLoading: removing }] = useRemoveServiceJobMutation();

  const rows = Array.isArray(serviceJobsData) ? serviceJobsData : (serviceJobsData?.items || []);


  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa service job này?')) return;
    try {
      await removeServiceJob(id).unwrap();
      toast.success('Xóa thành công');
      try { refetch && refetch(); } catch (e) {}
    } catch (err) {
      console.error('remove failed', err);
      toast.error(err?.data?.message || err?.message || 'Xóa thất bại');
    }
  };

  if (isLoading) return <div className="p-6">Đang tải danh sách service jobs...</div>;
  if (isError) return <div className="p-6 text-red-600">Lỗi: {error?.message || 'Failed to load'}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-600">Danh sách các hạng mục dịch vụ</h2>
        <Link to="/service-job/create" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Tạo mới</Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-blue-600 text-center">Không có service jobs</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow text-left">
          <table className="min-w-full text-sm">
            <thead className="bg-[#e7f1fd] text-left">
              <tr>
                <th className="px-4 py-3 text-blue-700">Tên</th>
                <th className="px-4 py-3 text-blue-700">Giá vốn</th>
                <th className="px-4 py-3 text-blue-700">Bên phụ trách</th>
                <th className="px-4 py-3 text-blue-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">{r.name || r.title || `#${r.id}`}</td>
                  <td className="px-4 py-3 align-top">{formatPrice(r.base_cost ?? r.price ?? 0)}</td>
                  <td className="px-4 py-3 align-top">{SERVICE_JOB_LABELS[r.owner_type]}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex gap-2">
                      <Link to={`/service-job/${r.id}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Xem</Link>
                      <button disabled={removing} onClick={() => handleDelete(r.id)} className="px-2 py-1 rounded bg-red-600 text-white text-xs">Xóa</button>
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
