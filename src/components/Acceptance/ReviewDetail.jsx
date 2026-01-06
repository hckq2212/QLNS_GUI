import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetProjectByIdQuery } from '../../services/project';
import { useGetAcceptancesByProjectQuery } from '../../services/acceptance';
import { formatDate } from '../../utils/FormatValue';
import { ACCEPTANCE_STATUS_LABELS } from '../../utils/enums';


export default function ReviewDetail({ id: propId } = {}) {
  let routeId = null;
  try {
    const p = useParams();
    routeId = p?.id || null;
  } catch (e) {
    routeId = null;
  }
  const id = propId || routeId;
  const navigate = useNavigate();

  const { data: project, isLoading: projectLoading, isError: projectError, error: projectErrorObj } = useGetProjectByIdQuery(id, { skip: !id });
  const { data: acceptances = [], isLoading: acceptancesLoading } = useGetAcceptancesByProjectQuery(id, { skip: !id });

  if (!id) return <div className="p-6">No project id provided</div>;
  if (projectLoading) return <div className="p-6">Loading project...</div>;
  if (projectError) return <div className="p-6 text-red-600">Error: {projectErrorObj?.message || 'Failed to load project'}</div>;
  if (!project) return <div className="p-6 text-gray-600">Project not found</div>;

  const acceptanceList = Array.isArray(acceptances) ? acceptances : (acceptances?.records || []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-md font-semibold text-blue-700">Nghiệm thu - {project.name || project.project_name || `#${project.id}`}</h2>
        <hr className="my-4" />

        {acceptancesLoading ? (
          <div className="p-3 text-gray-600">Đang tải...</div>
        ) : acceptanceList.length > 0 ? (
          <div className="mt-2">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#e7f1fd]">
                  <th className="px-3 py-2 text-left text-blue-700">Người tạo</th>
                  <th className="px-3 py-2 text-left text-blue-700">Ngày tạo</th>
                  <th className="px-3 py-2 text-left text-blue-700">Số công việc</th>
                  <th className="px-3 py-2 text-left text-blue-700">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {acceptanceList.map((acc, i) => (
                  <tr key={acc.id ?? i} className="border-t">
                    <td className="px-3 py-2 align-top">{acc.created_by_name || acc.creator?.name || `#${acc.created_by}`}</td>
                    <td className="px-3 py-2 align-top">{formatDate(acc.created_at) || '—'}</td>
                    {/* <td className="px-3 py-2 align-top">
                      <span className={`px-2 py-1 rounded text-xs ${
                        acc.status === 'approved' ? 'bg-green-100 text-green-800' :
                        acc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        acc.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ACCEPTANCE_STATUS_LABELS[acc.status] || acc.status}
                      </span>
                    </td> */}
                    <td className="px-3 py-2 align-top">
                      {acc.jobs?.length || acc.result?.length || 0}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <button
                        onClick={() => navigate(`/acceptance/${acc.id}`)}
                        className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                        type="button"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3 text-gray-600">Chưa có biên bản nghiệm thu nào cho dự án này</div>
        )}
      </div>
    </div>
  );
}
