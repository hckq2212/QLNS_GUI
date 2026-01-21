import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetUserByIdQuery } from '../../services/user';
import { useGetRoleByIdQuery } from '../../services/role';
import { useGetJobByUserIdQuery } from '../../services/job';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading, isError, error } = useGetUserByIdQuery(id, { skip: !id });
  const roleId = user?.role_id ?? user?.roleId ?? user?.role?.id;
  const { data: role } = useGetRoleByIdQuery(roleId, { skip: !roleId });

  // Fetch jobs for this specific user
  const { data: userJobs = [], isLoading: jobsLoading } = useGetJobByUserIdQuery(id, { skip: !id });

  if (isLoading) return <div className="p-6">Đang tải thông tin người dùng...</div>;
  if (isError) return <div className="p-6 text-red-600">Lỗi khi tải người dùng: {String(error)}</div>;

  const fullName = user?.full_name ?? user?.fullName ?? user?.name ?? '-';
  const email = user?.email ?? '-';
  const phone = user?.phone ?? user?.phone_number ?? '-';
  const created = user?.created_at  || '';

  // Use jobs directly from API (API already filters for current jobs)
  const currentJobs = Array.isArray(userJobs) ? userJobs : [];

  return (
    <div className="p-6 max-w-7xl mx-auto text-justify">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7 bg-white rounded shadow p-6 h-fit">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-md font-medium text-blue-600">Thông tin nhân viên</div>
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
              <div className="text-sm mt-1">{role?.code}</div>
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
                      <th className="px-4 py-2">Độ ưu tiên</th>
                      <th className="px-4 py-2">Deadline</th>
                      <th className="px-4 py-2">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentJobs.map((j) => (
                      <tr key={j.id || j.contract_id} className="border-t">
                        <td className="px-4 py-2">{j.name || j.title || `#${j.id}`}</td>
                        <td className="px-4 py-2">{j.priority || '—'}</td>
                        <td className="px-4 py-2">{j.deadline ? new Date(j.deadline).toLocaleDateString('vi-VN') : '—'}</td>
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
