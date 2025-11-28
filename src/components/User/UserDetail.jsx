import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetUserByIdQuery } from '../../services/user';
import { useGetRoleByIdQuery } from '../../services/role';
import { useGetAllJobQuery } from '../../services/job';
import { JOB_STATUS_LABELS } from '../../utils/enums';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading, isError, error } = useGetUserByIdQuery(id, { skip: !id });
  const roleId = user?.role_id ?? user?.roleId ?? user?.role?.id;
  const { data: role } = useGetRoleByIdQuery(roleId, { skip: !roleId });

  // fetch jobs early so Hooks order is stable across renders
  const { data: allJobs = [], isLoading: jobsLoading } = useGetAllJobQuery(undefined, { skip: !id });

  if (isLoading) return <div className="p-6">Đang tải thông tin người dùng...</div>;
  if (isError) return <div className="p-6 text-red-600">Lỗi khi tải người dùng: {String(error)}</div>;

  const fullName = user?.full_name ?? user?.fullName ?? user?.name ?? '-';
  const email = user?.email ?? '-';
  const phone = user?.phone ?? user?.phone_number ?? '-';
  const created = user?.created_at || user?.createdAt || user?.created || '';

  const userIdForMatch = user?.id ?? id;
  const currentJobs = (Array.isArray(allJobs) ? allJobs : []).filter((j) => {
    const assigned = j.assigned_id ?? j.assigned_to ?? j.user_id ?? null;
    if (assigned == null) return false;
    // match id as string/number
    if (String(assigned) !== String(userIdForMatch)) return false;
    // consider these statuses as "in progress"
    return ['in_progress', 'assigned', 'doing'].includes(j.status) || j.status == null;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto text-justify">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7 bg-white rounded shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-md font-medium text-blue-600">Thông tin người dùng</div>
            </div>
            <div className="flex items-center gap-2">
            </div>
          </div>

          <hr className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Họ và tên</div>
              <div className="text-sm mt-1">{fullName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Vai trò</div>
              <div className="text-sm mt-1">{role?.code || role?.name || roleId || '-'}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="text-sm mt-1">{email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Số điện thoại</div>
              <div className="text-sm mt-1">{phone}</div>
            </div>


          </div>

        </div>

        <div className="col-span-5 bg-white rounded shadow p-6 h-fit">
          <div className="text-md font-semibold flex justify-between text-blue-700">Công việc đang thực hiện</div>
          <hr className="my-3" />
          <div className="overflow-x-auto bg-white rounded">
              {jobsLoading ? (
                <div className="p-4">Đang tải công việc...</div>
              ) : currentJobs.length === 0 ? (
                <div className="p-4 text-gray-600">Chưa có công việc đang thực hiện</div>
              ) : (
                <table className="w-full table-auto text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 text-blue-600">
                      <th className="px-4 py-2">Tên công việc</th>
                      <th className="px-4 py-2">Trạng thái</th>
                      <th className="px-4 py-2">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentJobs.map((j) => (
                      <tr key={j.id} className="border-t">
                        <td className="px-4 py-2">{j.name || j.title || `#${j.id}`}</td>
                        <td className="px-4 py-2">{JOB_STATUS_LABELS[j.status] || '—'}</td>
                        <td className="px-4 py-2">
                          <Link to={`/job/${j.id}`} className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm">Xem</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
