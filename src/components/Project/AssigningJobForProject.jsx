import React, { useEffect, useState } from 'react';
import projectAPI from '../../api/project';
import jobAPI from '../../api/job';
import userAPI from '../../api/user';
import teamAPI from '../../api/team';
import AssignJob from '../Job/AssignJob';

export default function AssigningJobForProject({ projectId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState({});
  const [assignees, setAssignees] = useState({}); // jobId -> { type, id }
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [teamUsers, setTeamUsers] = useState([]);
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

  // when project changes, try to load team members for that project (if team_id available)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setTeamUsers([]);
      const teamId = project?.team_id ;
      if (!teamId) return;
      try {
        const res = await teamAPI.getMembers(teamId);
        const members = Array.isArray(res) ? res : (  res?.data || []);
        const normalized = [];
        const missingIds = [];
        for (const m of members) {
          // if API returned full user-like objects, use them directly
          if (m && typeof m === 'object' && (m.full_name || m.email )) {
            normalized.push(m);
            continue;
          }
          const uid = (m && typeof m === 'object') ? (m.user_id ??  m.id) : m;
          if (uid == null) {
            normalized.push(m);
            continue;
          }
          const found = users.find(u => String(u.id) === String(uid) || String(u._id) === String(uid));
          if (found) normalized.push(found);
          else missingIds.push(uid);
        }
        if (missingIds.length > 0) {
          const fetched = await Promise.allSettled(missingIds.map(id => userAPI.getById(id).catch(() => null)));
          fetched.forEach((r, idx) => {
            if (r.status === 'fulfilled' && r.value) normalized.push(r.value);
            else normalized.push({ id: missingIds[idx] });
          });
        }
        if (mounted && Array.isArray(normalized) && normalized.length > 0) setTeamUsers(normalized);
      } catch (e) {
        console.debug('Failed to load team members', e?.message || e);
      }
    })();
    return () => { mounted = false; };
  }, [project?.team_id, project?.team, users]);

  if (!projectId && !selectedProjectId) {
    return (
      <div className="p-4">
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
                    <button className="px-2 py-1 bg-indigo-600 text-white rounded" onClick={() => setSelectedProjectId(p.id)}>Phân công</button>
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

  const jobs = project.jobs  || [];

  // group jobs by job name (normalize to lowercase); nameless jobs grouped under '__no_name__'
  const groups = Object.values((jobs || []).reduce((acc, job) => {
    const rawName = (job.name || '').toString().trim();
    const key = rawName ? rawName.toLowerCase() : '__no_name__';
    const label = rawName || '#no_name';
    if (!acc[key]) acc[key] = { key, label, items: [] };
    acc[key].items.push(job);
    return acc;
  }, {}));

  const projectTeamId = project?.team_id;
  const allowedUsers = (teamUsers && teamUsers.length > 0)
    ? teamUsers
    : users.filter(u => String(u.team_id || (u.team && (u.team.id || u.team._id)) || '') === String(projectTeamId || ''));

  return (
    <AssignJob
      project={project}
      groups={groups}
      assignees={assignees}
      setAssignees={setAssignees}
      allowedUsers={allowedUsers}
      usersLoading={usersLoading}
      assignLoading={assignLoading}
      setAssignLoading={setAssignLoading}
      effectiveProjectId={effectiveProjectId}
      setProject={setProject}
    />
  );
}
