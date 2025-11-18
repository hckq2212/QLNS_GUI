import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetProjectByIdQuery, useAssignTeamMutation } from '../../services/project';
import { useGetCustomerByIdQuery } from '../../services/customer';
import { useGetServicesQuery } from '../../services/service';
import { useGetContractServicesQuery } from '../../services/contract';
import { useGetAllTeamsQuery } from '../../services/team';
import { useGetUserByIdQuery } from '../../services/user';
import { formatPrice, formatDate } from '../../utils/FormatValue';
import { toast } from 'react-toastify';
import { PROJECT_STATUS_LABELS } from '../../utils/enums';
import jobAPI from '../../api/job';
import { JOB_STATUS_LABELS } from '../../utils/enums';
import AssignJobModal from '../ui/AssignJobModal';

export default function ProjectDetail({ id: propId } = {}) {
  let routeId = null;
  try {
    const p = useParams();
    routeId = p?.id || null;
  } catch (e) {
    routeId = null;
  }
  const id = propId || routeId;

  const { data: project, isLoading, isError, error, refetch } = useGetProjectByIdQuery(id, { skip: !id });
  const { data: servicesList = [] } = useGetServicesQuery();
  const { data: teams = [] } = useGetAllTeamsQuery();
  const [assignTeam, { isLoading: assigning }] = useAssignTeamMutation();

  const { data: fetchedCustomer } = useGetCustomerByIdQuery(project?.customer_id, { skip: !project?.customer_id });

  const customer = useMemo(() => {
    if (fetchedCustomer) return fetchedCustomer;
    if (!project) return null;
    if (project.customer) return project.customer;
    return null;
  }, [project, fetchedCustomer]);

  const projectServices = useMemo(() => {
    if (!project) return [];
    return project.services || project.project_services || project.project_service_rows || [];
  }, [project]);

  // If project has a contract_id, prefer contract_service rows from the contract service
  const { data: contractServicesData = [] } = useGetContractServicesQuery(project?.contract_id, { skip: !project?.contract_id });

  const displayedServices = useMemo(() => {
    // normalize contractServicesData which may be array or { items }
    const contractRows = Array.isArray(contractServicesData) ? contractServicesData : (contractServicesData?.items || []);
    if (project?.contract_id && contractRows && contractRows.length > 0) return contractRows;
    return projectServices;
  }, [project, contractServicesData, projectServices]);

  const teamById = useMemo(() => {
    const m = {};
    (teams || []).forEach((t) => { if (t && (t.id || t.team_id)) m[t.id ?? t.team_id] = t; });
    return m;
  }, [teams]);

  const [selectedTeam, setSelectedTeam] = useState(project?.team_id ?? project?.team?.id ?? null);
  const [isAssignEditing, setIsAssignEditing] = useState(false);

  React.useEffect(() => {
    setSelectedTeam(project?.team_id ?? project?.team?.id ?? null);
    // if project has no team assigned, allow selecting but require explicit 'Phân công' click
    setIsAssignEditing(!project?.team_id && !project?.team?.id);
  }, [project]);

  const navigate = useNavigate();

  // Jobs for this project (right column)
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState(null);
  const [jobFilterStatus, setJobFilterStatus] = useState('all');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedJobForAssign, setSelectedJobForAssign] = useState(null);

  React.useEffect(() => {
    let mounted = true;
    const fetchJobs = async () => {
      if (!project?.id) return;
      setJobsLoading(true);
      setJobsError(null);
      try {
        const res = await jobAPI.getByProject(project.id);
        if (!mounted) return;
        // backend may return array or { items }
        const rows = Array.isArray(res) ? res : (res?.items || res?.data || []);
        setJobs(rows);
      } catch (err) {
        console.error('fetch jobs failed', err);
        if (!mounted) return;
        setJobsError(err?.message || 'Failed to load jobs');
      } finally {
        if (mounted) setJobsLoading(false);
      }
    };
    fetchJobs();
    return () => { mounted = false; };
  }, [project?.id]);

  const reloadJobs = async () => {
    try {
      setJobsLoading(true);
      const res = await jobAPI.getByProject(project.id);
      const rows = Array.isArray(res) ? res : (res?.items || res?.data || []);
      setJobs(rows);
      setJobsError(null);
    } catch (err) {
      console.error('reload jobs failed', err);
      setJobsError(err?.message || 'Failed to load jobs');
    } finally {
      setJobsLoading(false);
    }
  };

  if (!id) return <div className="p-6">No project id provided</div>;
  if (isLoading) return <div className="p-6">Loading project...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load project'}</div>;
  if (!project) return <div className="p-6 text-gray-600">Project not found</div>;
  const hasJobs = Array.isArray(jobs) && jobs.length > 0;
  const showJobsColumn = jobsLoading || jobsError || hasJobs;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 text-left ">
  <div className={`${showJobsColumn ? 'col-span-4' : 'col-span-12'} bg-white rounded shadow p-6 h-fit`}>
          <h2 className="text-md font-semibold text-blue-700">Thông tin dự án</h2>
          <hr className="my-4" />
          <div className='grid grid-cols-3'>
            <div className="mb-4">
              <div className="text-xs text-gray-500">Tên dự án</div>
              <div className="text-lg font-medium text-blue-600">{project.name || project.project_name || project.title || '—'}</div>
            </div>

          </div>

          {project.description && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">Mô tả</div>
              <div className="text-sm text-gray-700">{project.description}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>



          </div>

        </div>

          {Array.isArray(displayedServices) && displayedServices.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-500">Dịch vụ</div>
              <div className="mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#e7f1fd]">
                      <th className="px-3 py-2 text-left text-blue-700">Tên dịch vụ</th>
                      <th className="px-3 py-2 text-left text-blue-700">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedServices.map((s, i) => (
                      <tr key={s.id ?? i} className="border-t">
                        <td className="px-3 py-2 align-top">{
                          s.name || s.service_name || (
                            s.service_id
                              ? (servicesList.find((ss) => ss.id == s.service_id || ss.service_id == s.service_id)?.name)
                              : null
                          ) || `#${s.service_id ?? s.id ?? i}`
                        }</td>
                        <td className="px-3 py-2 align-top">{s.quantity ?? s.qty ?? 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          
          <div className="mt-6">
            <div className="text-sm text-gray-500">Team</div>
            <div className="mt-2">
              <div className="flex gap-2">
                <select
                  value={selectedTeam || ''}
                  onChange={(e) => { setSelectedTeam(e.target.value || null); }}
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  disabled={!isAssignEditing}
                >
                  <option value="">-- Chọn team --</option>
                  {(teams || []).map((t) => (
                    <option key={t.id ?? t.team_id} value={t.id ?? t.team_id}>{t.name || t.team_name || `#${t.id ?? t.team_id}`}</option>
                  ))}
                </select>
                <button
                  className={`px-3 py-2 rounded text-sm ${isAssignEditing ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 border'}`}
                  onClick={async () => {
                    // if currently editing, perform assign; otherwise enable editing
                    if (isAssignEditing) {
                      try {
                        await assignTeam({ id: project.id, teamId: selectedTeam || null }).unwrap();
                        toast.success('Đã phân team cho dự án');
                        setIsAssignEditing(false);
                        try { refetch && refetch(); } catch (e) {}
                      } catch (err) {
                        console.error('assign team failed', err);
                        toast.error(err?.data?.message || err?.message || 'Phân team thất bại');
                      }
                    } else {
                      setIsAssignEditing(true);
                    }
                  }}
                  disabled={assigning}
                >
                  {isAssignEditing ? (assigning ? 'Đang...' : 'Phân công') : 'Chỉnh sửa'}
                </button>
              </div>
            </div>
          </div>

          

          {project.attachments && project.attachments.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-500">Tệp đính kèm</div>
              <div className="mt-2 text-sm text-gray-700 space-y-2">
                {project.attachments.map((a, i) => (
                  <div key={a.url || a.name || i}>
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {a.name || a.filename || `File ${i + 1}`}
                      </a>
                    ) : (
                      <span>{a.name || a.filename || `File ${i + 1}`}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

            {showJobsColumn && (
              <div className="col-span-8 bg-white rounded shadow p-6">
                <h2 className="text-md font-semibold text-blue-700">Công việc của dự án</h2>
                <hr className="my-4" />

                {jobsLoading ? (
                  <div className="p-3">Đang tải công việc...</div>
                ) : jobsError ? (
                  <div className="p-3 text-red-600">Lỗi: {jobsError}</div>
                ) : hasJobs ? (
                  <div className="mt-2">
                    <div className="mb-3 flex items-center justify-between">
                      <div />
                      <div className="flex items-center gap-3">
                        <label className="text-sm">Lọc trạng thái:</label>
                        <select value={jobFilterStatus} onChange={(e) => setJobFilterStatus(e.target.value)} className="border px-2 py-1 rounded text-sm">
                          <option value="all">Tất cả</option>
                          {Object.keys(JOB_STATUS_LABELS || {}).map((s) => (
                            <option key={s} value={s}>{JOB_STATUS_LABELS[s] || s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#e7f1fd]">
                          <th className="px-3 py-2 text-left text-blue-700">Tên công việc</th>
                          <th className="px-3 py-2 text-left text-blue-700">Deadline</th>
                          <th className="px-3 py-2 text-left text-blue-700">Trạng thái</th>
                          <th className="px-3 py-2 text-left text-blue-700">Người thực hiện</th>
                          <th className="px-3 py-2 text-left text-blue-700">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((jobs || []).filter(j => (jobFilterStatus === 'all' ? true : j.status === jobFilterStatus))).map((j) => (
                          <tr key={j.id} className="border-t">
                            <td className="px-3 py-2 align-top">{j.name || j.title || `#${j.id}`}</td>
                            <td className="px-3 py-2 align-top">{formatDate(j.deadline) || '—'}</td>
                            <td className="px-3 py-2 align-top">{JOB_STATUS_LABELS[j.status] || j.status || '—'}</td>
                            <td className="px-3 py-2 align-top"><UserName userId={j.assigned_id} /></td>
                            <td className="px-3 py-2 align-top">
                              <button
                                className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
                                onClick={() => { setSelectedJobForAssign(j); setAssignModalOpen(true); }}
                              >
                                Phân công
                              </button>
                                                            <button
                                className="px-3 py-1 rounded bg-blue-600 text-white text-xs ml-2"
                                onClick={() => { navigate(`/job/${j.id}`); }}
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
                  <div className="p-3 text-gray-600">Chưa có công việc cho dự án này</div>
                )}
              </div>
            )}
            <AssignJobModal
              open={assignModalOpen}
              onClose={() => setAssignModalOpen(false)}
              job={selectedJobForAssign}
              teamId={project?.team_id ?? project?.team?.id ?? null}
              onAssigned={async () => { await reloadJobs(); }}
            />
      </div>
      
    </div>
  );
}


function UserName({ userId }) {
  const { data: user, isLoading } = useGetUserByIdQuery(userId, { skip: !userId });
  if (!userId) return <span>—</span>;
  if (isLoading) return <span className="text-sm text-gray-500">#{userId} (đang tải...)</span>;
  return <span>{user?.full_name || user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.user_name || user?.username || `#${userId}`}</span>;
}

