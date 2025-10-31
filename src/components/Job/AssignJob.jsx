import React from 'react';  
import { formatDate } from '../../utils/FormatValue';
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
}) {
  const [editing, setEditing] = React.useState({});


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
                // derive assigned id/type from existing assignees state or from job data returned by server
                const assignedItem = group.items.find(it => ((it.assigned_id) != null) || (it.assigned_type));
                const inferredAssignedId = a.id ?? (assignedItem && (assignedItem.assigned_id ));
                const inferredAssignedType = a.type ?? (assignedItem && (assignedItem.assigned_type ));
                // infer persisted start/deadline from server-side fields (use only start_date and deadline)
                const inferredStartDate = a.startDate ?? (assignedItem && formatDate(assignedItem.start_date));
                const inferredDeadline = a.deadline ?? (assignedItem && formatDate(assignedItem.deadline));
                const groupAssigned = group.items.every(it => (it.status === 'assigned') || ((it.assigned_id ) != null));
                return (
                  <tr key={gid} className="border-t">
                    <td className="px-4 py-3 align-top font-medium" title={jobIdsTooltip}>{serviceName}</td>
                    <td className="px-4 py-3 align-top">{quantity}</td>
                    <td className="px-4 py-3 align-top">
                      {a.type === 'partner' ? (
                        <input disabled={!editing[gid] && groupAssigned} type="number" placeholder="Assignee id" value={a.id ?? inferredAssignedId ?? ''} onChange={(e) => setAssignees(s => ({ ...s, [gid]: { ...(s[gid]||{}), id: e.target.value ? Number(e.target.value) : '', type: 'partner' } }))} className="border px-2 py-1 rounded w-36" />
                      ) : (
                        usersLoading ? <div className="text-sm text-gray-500">Đang tải users...</div> : (
                          <select disabled={!editing[gid] && groupAssigned} value={a.id ?? inferredAssignedId ?? ''} onChange={(e) => setAssignees(s => ({ ...s, [gid]: { ...(s[gid]||{}), id: e.target.value ? Number(e.target.value) : '', type: 'user' } }))} className="border px-2 py-1 rounded w-40">
                            <option value="">Chọn user</option>
                            {allowedUsers.map(u => (
                              <option key={u.id } value={u.id }>{u.full_name}</option>
                            ))}
                          </select>
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input disabled={!editing[gid] && groupAssigned} type="date" value={a.startDate ?? inferredStartDate ?? ''} onChange={(e) => setAssignees(s => ({ ...s, [gid]: { ...(s[gid]||{}), startDate: e.target.value } }))} className="border px-2 py-1 rounded" title="Start date" />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input disabled={!editing[gid] && groupAssigned} type="date" value={a.deadline ?? inferredDeadline ?? ''} onChange={(e) => setAssignees(s => ({ ...s, [gid]: { ...(s[gid]||{}), deadline: e.target.value } }))} className="border px-2 py-1 rounded" title="Deadline" />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button className="px-2 py-1 bg-indigo-600 text-white rounded" disabled={assignLoading[gid]} onClick={async () => {
                        // If the group is already assigned and not currently in edit mode,
                        // switch to edit mode instead of performing an assign immediately.
                        if (groupAssigned && !editing[gid]) {
                          setEditing(s => ({ ...s, [gid]: true }));
                          return;
                        }
                        const localA = assignees[gid] || {};
                        // fallback to inferred assigned values if none selected in local state
                        const type = (localA.type === 'partner') ? 'partner' : (localA.type ?? inferredAssignedType) || 'user';
                        const idVal = localA.id ?? inferredAssignedId;
                        if (!idVal) return alert('Chọn assignee id');
                        // If we're editing an already-assigned group, we'll call the generic update
                        // endpoint for each job instead of the /:id/assign route.
                        const isUpdateMode = groupAssigned && editing[gid];
                        try {
                          setAssignLoading(s => ({ ...s, [gid]: true }));
                          const tasks = group.items.map(async (item) => {
                            // Build payload
                            const payload = {};
                            // ensure assigned_id is present when relevant
                            if (idVal) payload.assigned_id = idVal;
                            if (localA.startDate) payload.start_date = localA.startDate;
                            if (localA.deadline) payload.deadline = localA.deadline;
                            if (localA.startDate && localA.deadline) {
                              const sd = new Date(localA.startDate);
                              const dd = new Date(localA.deadline);
                              if (sd > dd) throw new Error('Ngày bắt đầu phải nhỏ hơn hoặc bằng deadline');
                            }
                            if (localA.externalCost != null) payload.externalCost = localA.externalCost;
                            try {
                              let result;
                              if (isUpdateMode) {
                                // Update existing job
                                result = await jobAPI.update(item.id, payload);
                                toast.success("Cập nhật thành công");
                              } else {
                                // New assignment via assign route
                                // include assigned_id to be explicit
                                result = await jobAPI.assign(item.id, payload);
                                toast.success("Phân công thành công");
                              }
                              return result;
                            } catch (je) {
                              toast.error(isUpdateMode ? "Cập nhật thất bại" : "Phân công thất bại");
                              throw je;
                            }
                          });
                          await Promise.all(tasks);
                        } catch (e) {
                          console.error('Assign/update group failed', e);
                          try { alert(e?.message || (isUpdateMode ? 'Cập nhật thất bại' : 'Phân công thất bại')); } catch(_) {}
                        } finally {
                          setAssignLoading(s => ({ ...s, [gid]: false }));
                          // exit edit mode after attempting save
                          setEditing(s => ({ ...s, [gid]: false }));
                        }
                      }}>{assignLoading[gid] ? 'Đang...' : (groupAssigned ? (editing[gid] ? 'Lưu' : 'Sửa thông tin') : 'Phân công')}</button>
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