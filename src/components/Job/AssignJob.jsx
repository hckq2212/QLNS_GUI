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
  const [selected, setSelected] = React.useState({}); // map jobId -> boolean
  const [filter, setFilter] = React.useState('all'); // all | assigned | unassigned

  const items = React.useMemo(() => (
    (groups || []).flatMap(group => (group.items || []).map(it => ({ ...it, groupKey: group.key, groupLabel: group.label })))
  ), [groups]);

  const filteredItems = React.useMemo(() => {
    if (!items) return [];
    return items.filter(job => {
      const isAssigned = (job.assigned_id != null);
      if (filter === 'all') return true;
      if (filter === 'assigned') return isAssigned;
      return !isAssigned;
    });
  }, [items, filter]);

  const selectedCount = Object.keys(selected).filter(k => selected[k]).length;
  const allVisibleSelected = filteredItems.length > 0 && filteredItems.every(it => !!selected[it.id]);

  return (
    <div className="p-4">
      <h4 className="font-semibold mb-2">Phân công cho {project?.name || ('#' + project?.id)}</h4>

      <div className="flex items-center gap-3 border-none mb-4">
        <label className="text-sm">Lọc:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border px-2 py-1 rounded">
          <option value="all">Tất cả</option>
          <option value="assigned">Đã phân công</option>
          <option value="unassigned">Chưa phân công</option>
        </select>
        <div className="ml-4 text-sm">Đã chọn: {selectedCount}</div>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gray-600">Không có công việc</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded border">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const next = { ...selected };
                      filteredItems.forEach(it => { next[it.id] = checked; });
                      setSelected(next);
                    }}
                  />
                </th>
                <th className="px-4 py-2">Công việc</th>
                <th className="px-4 py-2">Số lượng</th>
                <th className="px-4 py-2">Chọn người thực hiện</th>
                <th className="px-4 py-2">Ngày bắt đầu</th>
                <th className="px-4 py-2">Deadline</th>
                <th className="px-4 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-600">Không có công việc phù hợp</td>
                </tr>
              ) : filteredItems.map(job => {
                const jid = job.id;
                const gid = job.groupKey;
                const a = assignees[jid] || {};
                const serviceName = job.name || job.service_name || job.groupLabel || `#${job.id}`;
                const inferredAssignedId = a.assigned_id ?? job.assigned_id;
                const inferredAssignedType = a.assigned_type ?? job.assigned_type;
                const inferredStartDate = a.start_date ?? formatDate(job.start_date);
                const inferredDeadline = a.deadline ?? formatDate(job.deadline);
                const jobAssigned = (job.assigned_id != null);
                const loadingKey = (assignLoading && (assignLoading[jid] ?? assignLoading[gid])) || false;

                return (
                  <tr key={jid} className="border-t">
                    <td className="px-4 py-3 align-top">
                      <input type="checkbox" checked={!!selected[jid]} onChange={(e) => setSelected(s => ({ ...s, [jid]: e.target.checked }))} />
                    </td>
                    <td className="px-4 py-3 align-top font-medium">{serviceName}</td>
                    <td className="px-4 py-3 align-top">1</td>
                    <td className="px-4 py-3 align-top">
                      {a.assigned_type === 'partner' ? (
                        <input
                          disabled={!editing[jid] && jobAssigned}
                          type="number"
                          placeholder="Assignee id"
                          value={a.assigned_id ?? inferredAssignedId ?? ''}
                          onChange={(e) => setAssignees(s => ({ ...s, [jid]: { ...(s[jid] || {}), assigned_id: e.target.value ? Number(e.target.value) : '', assigned_type: 'partner' } }))}
                          className="border px-2 py-1 rounded w-36"
                        />
                      ) : (
                        usersLoading ? <div className="text-sm text-gray-500">Đang tải users...</div> : (
                          <select
                            disabled={!editing[jid] && jobAssigned}
                            value={a.assigned_id ?? inferredAssignedId ?? ''}
                            onChange={(e) => setAssignees(s => ({ ...s, [jid]: { ...(s[jid] || {}), assigned_id: e.target.value ? Number(e.target.value) : '', assigned_type: 'user' } }))}
                            className="border px-2 py-1 rounded w-40"
                          >
                            <option value="">Chọn user</option>
                            {allowedUsers.map(u => (
                              <option key={u.id} value={u.id}>{u.full_name}</option>
                            ))}
                          </select>
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        disabled={!editing[jid] && jobAssigned}
                        type="date"
                        value={a.start_date ?? inferredStartDate ?? ''}
                        onChange={(e) => setAssignees(s => ({ ...s, [jid]: { ...(s[jid] || {}), start_date: e.target.value } }))}
                        className="border px-2 py-1 rounded"
                        title="Start date"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        disabled={!editing[jid] && jobAssigned}
                        type="date"
                        value={a.deadline ?? inferredDeadline ?? ''}
                        onChange={(e) => setAssignees(s => ({ ...s, [jid]: { ...(s[jid] || {}), deadline: e.target.value } }))}
                        className="border px-2 py-1 rounded"
                        title="Deadline"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button
                        className="px-2 py-1 bg-indigo-600 text-white rounded"
                        disabled={loadingKey}
                        onClick={async () => {
                          if (jobAssigned && !editing[jid]) {
                            setEditing(s => ({ ...s, [jid]: true }));
                            return;
                          }

                          const localA = assignees[jid] || {};
                          const batchPayload = {};
                          if ((localA.assigned_id ?? inferredAssignedId) != null) batchPayload.assigned_id = localA.assigned_id ?? inferredAssignedId;
                          if (localA.start_date) batchPayload.start_date = localA.start_date;
                          if (localA.deadline) batchPayload.deadline = localA.deadline;

                          if (batchPayload.start_date && batchPayload.deadline) {
                            const sd = new Date(batchPayload.start_date);
                            const dd = new Date(batchPayload.deadline);
                            if (sd > dd) return alert('Ngày bắt đầu phải nhỏ hơn hoặc bằng deadline');
                          }

                          const selectedIds = Object.keys(selected).filter(k => selected[k]);
                          const targets = selectedIds.length > 0 ? selectedIds.map(id => Number(id)) : [jid];

                          try {
                            setAssignLoading(s => {
                              const copy = { ...s };
                              targets.forEach(t => { copy[t] = true; });
                              return copy;
                            });

                            const tasks = targets.map(async (targetId) => {
                              const targetJob = items.find(x => x.id === targetId) || {};
                              const targetAssigned = targetJob.assigned_id != null;
                              const payload = { ...batchPayload };
                              if (!payload.assigned_id && (localA.assigned_id ?? inferredAssignedId)) payload.assigned_id = localA.assigned_id ?? inferredAssignedId;

                              if (targetAssigned) {
                                await jobAPI.update(targetId, payload);
                                toast.success('Cập nhật công việc thành công');
                              } else {
                                await jobAPI.assign(targetId, payload);
                                toast.success('Phân công công việc  thành công');
                              }
                            });

                            await Promise.all(tasks);
                          } catch (e) {
                            console.error('Batch assign/update failed', e);
                            try { alert(e?.message || 'Thao tác thất bại'); } catch(_) {}
                          } finally {
                            setAssignLoading(s => {
                              const copy = { ...s };
                              targets.forEach(t => { copy[t] = false; });
                              return copy;
                            });
                            setEditing(s => {
                              const copy = { ...s };
                              targets.forEach(t => { copy[t] = false; });
                              return copy;
                            });
                            setSelected({});
                          }
                        }}
                      >{loadingKey ? 'Đang...' : (jobAssigned ? (editing[jid] ? 'Lưu' : 'Sửa thông tin') : 'Phân công')}</button>
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