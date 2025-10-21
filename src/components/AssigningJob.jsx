import React, { useEffect, useState } from 'react';
import projectAPI from '../api/project';
import jobAPI from '../api/job';
import userAPI from '../api/user';

export default function AssigningJob({ projectId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState({});
  const [assignees, setAssignees] = useState({}); // jobId -> { type, id }
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // effective project id: prop overrides selection
  const effectiveProjectId = projectId || selectedProjectId;

  useEffect(() => {
    if (!effectiveProjectId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await projectAPI.getById(effectiveProjectId);
        const proj = res.project || res || null;
        if (mounted) setProject(proj);
        // try fetching jobs separately from job API (preferred)
        try {
          const jobsRes = await jobAPI.getByProject(effectiveProjectId);
          const jobsArr = Array.isArray(jobsRes) ? jobsRes : (jobsRes && Array.isArray(jobsRes.items) ? jobsRes.items : (jobsRes.jobs || jobsRes.data || []));
          if (mounted) setProject(prev => prev ? ({ ...prev, jobs: jobsArr }) : ({ id: effectiveProjectId, jobs: jobsArr }));
        } catch (je) {
          // ignore — fallback will use project.jobs
          console.debug('jobAPI.getByProject failed, falling back to project.jobs', je?.message || je);
        }
      } catch (e) {
        console.error('Failed to load project', e);
        if (mounted) setError(e?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [effectiveProjectId]);



  // if no projectId prop provided, fetch not_assigned projects to let user choose
  useEffect(() => {
    if (projectId) return; // prop provided — don't load list
    let mounted = true;
    (async () => {
      setProjectsLoading(true);
      setProjectsError(null);
      try {
        const res = await projectAPI.getByStatus('not_assigned');
        const arr = Array.isArray(res) ? res : (res && Array.isArray(res.items) ? res.items : []);
        if (mounted) setProjectsList(arr);
      } catch (e) {
        console.error('Failed to load not_assigned projects', e);
        if (mounted) setProjectsError(e?.message || 'Failed to load projects');
      } finally {
        if (mounted) setProjectsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [projectId]);

  // load users for assignee select
  useEffect(() => {
    let mounted = true;
    (async () => {
      setUsersLoading(true);
      try {
        const res = await userAPI.getAll();
        const arr = Array.isArray(res) ? res : (res && Array.isArray(res.items) ? res.items : (res.data || []));
        if (mounted) setUsers(arr);
      } catch (e) {
        console.warn('Failed to load users for assignee select', e?.message || e);
      } finally {
        if (mounted) setUsersLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // when no prop provided, show selectable list of not_assigned projects
  if (!projectId && !selectedProjectId) {
    return (
      <div className="p-4">
        <h4 className="font-semibold mb-2">Chọn dự án (not_assigned)</h4>
        {projectsLoading ? <div className="text-sm text-gray-500">Đang tải dự án...</div> : projectsError ? <div className="text-sm text-red-600">{projectsError}</div> : (
          projectsList.length === 0 ? <div className="text-sm text-gray-600">Không có dự án chưa gán</div> : (
            <ul className="space-y-2">
              {projectsList.map(p => (
                <li key={p.id} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-medium">{p.name || p.title || `#${p.id}`}</div>
                    <div className="text-sm text-gray-600">ID: {p.id} • Contract: {p.contract_id ?? '—'}</div>
                  </div>
                  <div>
                    <button className="px-2 py-1 bg-indigo-600 text-white rounded" onClick={() => setSelectedProjectId(p.id)}>Chọn</button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    );
  }

  if (loading) return <div className="text-sm text-gray-500">Đang tải...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!project) return <div className="text-sm text-gray-600">Không tìm thấy dự án</div>;

  const jobs = project.jobs || project.job || project.jobs_list || [];

  return (
    <div className="p-4">
      <h4 className="font-semibold mb-2">Phân công - {project.name || project.title || `#${project.id}`}</h4>
      {jobs.length === 0 ? <div className="text-sm text-gray-600">Không có công việc</div> : (
        <div className="space-y-3">
          {jobs.map(j => {
            const jid = j.id;
            return (
              <div key={jid} className="p-3 border rounded">
                <div className="font-medium">{j.name || j.title || `Job #${jid}`}</div>
                <div className="text-sm text-gray-600">Trạng thái: {j.status || '—'}</div>
                <div className="mt-2 flex items-center gap-2">
                  <select value={assignees[jid]?.type || 'user'} onChange={(e) => setAssignees(s => ({ ...s, [jid]: { ...(s[jid]||{}), type: e.target.value } }))} className="border px-2 py-1 rounded">
                    <option value="user">User</option>
                    <option value="partner">Partner</option>
                  </select>
                  {assignees[jid]?.type === 'partner' ? (
                    <input type="number" placeholder="Assignee id" value={assignees[jid]?.id || ''} onChange={(e) => setAssignees(s => ({ ...s, [jid]: { ...(s[jid]||{}), id: e.target.value ? Number(e.target.value) : '', type: 'partner' } }))} className="border px-2 py-1 rounded" />
                  ) : (
                    usersLoading ? <div className="text-sm text-gray-500">Đang tải users...</div> : (
                      <select value={assignees[jid]?.id || ''} onChange={(e) => setAssignees(s => ({ ...s, [jid]: { ...(s[jid]||{}), id: e.target.value ? Number(e.target.value) : '', type: 'user' } }))} className="border px-2 py-1 rounded">
                        <option value="">Chọn user</option>
                        {users.map(u => (
                          <option key={u.id || u._id} value={u.id || u._id}>{u.full_name|| `#${u.id || u._id}`}</option>
                        ))}
                      </select>
                    )
                  )}
                  {/* start date and deadline inputs */}
                  <input
                    type="date"
                    value={assignees[jid]?.startDate || ''}
                    onChange={(e) => setAssignees(s => ({ ...s, [jid]: { ...(s[jid]||{}), startDate: e.target.value } }))}
                    className="border px-2 py-1 rounded"
                    title="Start date"
                  />
                  <input
                    type="date"
                    value={assignees[jid]?.deadline || ''}
                    onChange={(e) => setAssignees(s => ({ ...s, [jid]: { ...(s[jid]||{}), deadline: e.target.value } }))}
                    className="border px-2 py-1 rounded"
                    title="Deadline"
                  />
                  <button className="px-2 py-1 bg-indigo-600 text-white rounded" disabled={assignLoading[jid]} onClick={async () => {
                    const a = assignees[jid] || {};
                    const type = (a.type === 'partner') ? 'partner' : 'user';
                    const idVal = a.id;
                    if (!idVal) return alert('Chọn assignee id');
                    try {
                      setAssignLoading(s => ({ ...s, [jid]: true }));
                      const payload = {
                        jobId: jid,
                        assignedType: type,
                        assignedId: idVal,
                      };
                      // include dates if provided
                      if (a.startDate) payload.start_date = a.startDate;
                      if (a.deadline) payload.deadline = a.deadline;
                      // simple validation: if both provided, ensure start <= deadline
                      if (a.startDate && a.deadline) {
                        const sd = new Date(a.startDate);
                        const dd = new Date(a.deadline);
                        if (sd > dd) {
                          alert('Ngày bắt đầu phải nhỏ hơn hoặc bằng deadline');
                          setAssignLoading(s => ({ ...s, [jid]: false }));
                          return;
                        }
                      }
                      if (a.externalCost != null) payload.externalCost = a.externalCost;
                      if (a.overrideReason) payload.overrideReason = a.overrideReason;
                      if (a.saveToCatalog != null) payload.saveToCatalog = a.saveToCatalog;
                      // send full payload to project-level assign endpoint
                      try {
                        const res = await projectAPI.assignJob(effectiveProjectId, payload);
                        // update jobs from response if present
                        if (res) {
                          const updatedJobs = Array.isArray(res) ? res : (res.jobs || res.items || (res.project && res.project.jobs) || null);
                          if (updatedJobs) setProject(prev => ({ ...prev, jobs: updatedJobs }));
                          else if (res.job) setProject(prev => ({ ...prev, jobs: prev.jobs.map(x => x.id === res.job.id ? ({ ...x, ...res.job }) : x) }));
                          else setProject(prev => ({ ...prev, jobs: prev.jobs.map(x => x.id === jid ? ({ ...x, assigned_id: idVal, assigned_type: type }) : x) }));
                        }
                      } catch (pe) {
                        // fallback to job-level assign
                        console.debug('projectAPI.assignJob failed, fallback to jobAPI.assign', pe?.message || pe);
                        await jobAPI.assign(jid, type, idVal);
                        setProject(prev => ({ ...prev, jobs: prev.jobs.map(x => x.id === jid ? ({ ...x, assigned_id: idVal, assigned_type: type }) : x) }));
                      }
                    } catch (e) {
                      console.error('Assign job failed', e);
                      try { alert('Phân công thất bại'); } catch(_) {}
                    } finally {
                      setAssignLoading(s => ({ ...s, [jid]: false }));
                    }
                  }}>Gán</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
