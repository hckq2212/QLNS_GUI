import React from 'react';  
import projectAPI from '../../api/project';
import jobAPI from '../../api/job';
import { toast } from 'react-toastify';

export default function AssignJob({
  project,
  groups,
  assignees,
  setAssignees,
  allowedUsers,
  usersLoading,
  assignLoading,
  setAssignLoading,
  effectiveProjectId,
  setProject,
}) {
  return (
    <div className="p-4">
      <h4 className="font-semibold mb-2">Phân công cho {project?.name ||  `#${project?.id}`}</h4>
      {groups.length === 0 ? <div className="text-sm text-gray-600">Không có công việc</div> : (
        <div className="overflow-x-auto bg-white rounded border">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Công việc</th>
                <th className="px-4 py-2">Số lượng</th>
                <th className="px-4 py-2">Loại</th>
                <th className="px-4 py-2">Chọn người thực hiện</th>
                <th className="px-4 py-2">Ngày bắt đầu</th>
                <th className="px-4 py-2">Deadline</th>
                <th className="px-4 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => {
                const gid = group.key;
                const firstJobId = group.items[0]?.id;
                const a = assignees[gid] || assignees[firstJobId] || {};
                const quantity = group.items.length;
                const serviceName = group.label;
                const jobIdsTooltip = group.items.map(it => it.id).join(', ');
                return (
                  <tr key={gid} className="border-t">
                    <td className="px-4 py-3 align-top font-medium" title={jobIdsTooltip}>{serviceName}</td>
                    <td className="px-4 py-3 align-top">{quantity}</td>
                    <td className="px-4 py-3 align-top">
                      <select value={a.type || 'user'} onChange={(e) => setAssignees(s => ({ ...s, [gid]: { ...(s[gid]||{}), type: e.target.value } }))} className="border px-2 py-1 rounded">
                        <option value="user">User</option>
                        <option value="partner">Partner</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {a.type === 'partner' ? (
                        <input type="number" placeholder="Assignee id" value={a.id || ''} onChange={(e) => setAssignees(s => ({ ...s, [gid]: { ...(s[gid]||{}), id: e.target.value ? Number(e.target.value) : '', type: 'partner' } }))} className="border px-2 py-1 rounded w-36" />
                      ) : (
                        usersLoading ? <div className="text-sm text-gray-500">Đang tải users...</div> : (
                          <select value={a.id || ''} onChange={(e) => setAssignees(s => ({ ...s, [gid]: { ...(s[gid]||{}), id: e.target.value ? Number(e.target.value) : '', type: 'user' } }))} className="border px-2 py-1 rounded w-40">
                            <option value="">Chọn user</option>
                            {allowedUsers.map(u => (
                              <option key={u.id } value={u.id }>{u.full_name|| `#${u.id}`}</option>
                            ))}
                          </select>
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input type="date" value={a.startDate || ''} onChange={(e) => setAssignees(s => ({ ...s, [gid]: { ...(s[gid]||{}), startDate: e.target.value } }))} className="border px-2 py-1 rounded" title="Start date" />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input type="date" value={a.deadline || ''} onChange={(e) => setAssignees(s => ({ ...s, [gid]: { ...(s[gid]||{}), deadline: e.target.value } }))} className="border px-2 py-1 rounded" title="Deadline" />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button className="px-2 py-1 bg-indigo-600 text-white rounded" disabled={assignLoading[gid]} onClick={async () => {
                        const a = assignees[gid] || {};
                        const type = (a.type === 'partner') ? 'partner' : 'user';
                        const idVal = a.id;
                        if (!idVal) return alert('Chọn assignee id');
                        try {
                          setAssignLoading(s => ({ ...s, [gid]: true }));
                          const tasks = group.items.map(async (item) => {
                            // Build payload for job PATCH /:id/assign
                            const payload = {
                              // include both keys to tolerate server-side typo (asssigned_type) and correct one
                              assigned_type: type,
                              assigned_id: idVal,
                            };
                            if (a.startDate) payload.start_date = a.startDate;
                            if (a.deadline) payload.deadline = a.deadline;
                            if (a.startDate && a.deadline) {
                              const sd = new Date(a.startDate);
                              const dd = new Date(a.deadline);
                              if (sd > dd) throw new Error('Ngày bắt đầu phải nhỏ hơn hoặc bằng deadline');
                            }
                            if (a.externalCost != null) payload.externalCost = a.externalCost;
                          try {
                            // Gọi API và đợi kết quả
                            const result = await jobAPI.assign(item.id, payload);

                            // Chỉ toast khi thành công
                            toast.success("Phân công thành công");

                            // Trả về kết quả cho caller
                            return result;
                          } catch (je) {
                            toast.error("Phân công thất bại");
                            throw je; // để outer try/catch xử lý tiếp
                          }

                          });
                          await Promise.all(tasks);
                        } catch (e) {
                          console.error('Assign group failed', e);
                          try { alert(e?.message || 'Phân công thất bại'); } catch(_) {}
                        } finally {
                          setAssignLoading(s => ({ ...s, [gid]: false }));
                        }
                      }}>{assignLoading[gid] ? 'Đang...' : 'Phân công'}</button>
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