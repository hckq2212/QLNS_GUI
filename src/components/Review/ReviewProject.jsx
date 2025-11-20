import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetProjectByStatusQuery } from '../../services/project';
import { PROJECT_STATUS_LABELS } from '../../utils/enums';

export default function ReviewProject() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading, isError, error, refetch } = useGetProjectByStatusQuery('review');

  if (isLoading) return <div className="p-6">Đang tải danh sách dự án cần xem xét...</div>;
  if (isError) return <div className="p-6 text-red-600">Lỗi: {error?.message || 'Không thể tải danh sách'}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-semibold text-blue-700">Dự án chờ xem xét</h2>
        <hr className="my-4" />
        {Array.isArray(projects) && projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#e7f1fd]">
                  <th className="px-3 py-2 text-left text-blue-700">Tên dự án</th>
                  <th className="px-3 py-2 text-left text-blue-700">Trạng thái</th>
                  <th className="px-3 py-2 text-left text-blue-700">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2 align-top">{p.name || p.project_name || `#${p.id}`}</td>
                    <td className="px-3 py-2 align-top">{PROJECT_STATUS_LABELS[p.status] || '—'}</td>
                    <td className="px-3 py-2 align-top">
                      <button className="px-3 py-1 rounded bg-blue-600 text-white text-xs" onClick={() => navigate(`/review/${p.id}`)}>
                        Đánh giá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3 text-gray-600">Không có dự án chờ xem xét</div>
        )}
      </div>
    </div>
  );
}
