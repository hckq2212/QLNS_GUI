import React from 'react';
import { Link } from 'react-router-dom';
import { useGetAllUserQuery } from '../../services/user';
import { useGetRoleByIdQuery } from '../../services/role';

export default function UserList() {
  const { data: users = [], isLoading, isError, refetch } = useGetAllUserQuery();
  if (isLoading) return <div className="p-6">Đang tải danh sách người dùng...</div>;
  if (isError) return <div className="p-6 text-red-600">Không thể tải danh sách người dùng</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-blue-600">Danh sách nhân viên</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-left text-blue-600">
              <tr className="bg-[#e7f1fd]">
                <th className="px-3 py-2">Họ và tên</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">SĐT</th>
                <th className="px-3 py-2">Vai trò</th>
                <th className="px-3 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(users) && users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 align-top">{u.full_name ?? u.fullName ?? u.name ?? '-'}</td>
                    <td className="px-3 py-2 align-top">{u.email ?? '-'}</td>
                    <td className="px-3 py-2 align-top">{u.phone ?? '-'}</td>
                    <td className="px-3 py-2 align-top">{u.role} </td>
                    <td className="px-3 py-2 align-top">
                      <Link
                        to={`/user/${u.id}`}
                        className="inline-block px-3 py-1 text-sm text-blue-600 hover:underline"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td className="p-4 text-center" colSpan={5}>Chưa có người dùng</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



