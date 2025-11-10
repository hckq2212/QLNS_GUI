import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetProjectByIdQuery, useAssignTeamMutation } from '../../services/project';
import { useGetCustomerByIdQuery } from '../../services/customer';
import { useGetServicesQuery } from '../../services/service';
import { useGetContractServicesQuery } from '../../services/contract';
import { useGetAllTeamsQuery } from '../../services/team';
import { formatPrice } from '../../utils/FormatValue';
import { toast } from 'react-toastify';
import { PROJECT_STATUS_LABELS } from '../../utils/enums';

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

  React.useEffect(() => {
    setSelectedTeam(project?.team_id ?? project?.team?.id ?? null);
  }, [project]);

  if (!id) return <div className="p-6">No project id provided</div>;
  if (isLoading) return <div className="p-6">Loading project...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load project'}</div>;
  if (!project) return <div className="p-6 text-gray-600">Project not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-4 text-left">
        <div className="col-span-12 bg-white rounded shadow p-6">
          <h2 className="text-md font-semibold text-blue-700">Thông tin dự án</h2>
          <hr className="my-4" />
          <div className='grid grid-cols-3'>
            <div className="mb-4">
              <div className="text-xs text-gray-500">Tên dự án</div>
              <div className="text-lg font-medium">{project.name || project.project_name || project.title || '—'}</div>
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
              <div className="text-xs text-gray-500">Trạng thái</div>
              <div className="text-sm text-gray-700">{PROJECT_STATUS_LABELS[project.status] || project.status || '—'}</div>
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
              <select
                value={selectedTeam || ''}
                onChange={async (e) => {
                  const v = e.target.value || null;
                  setSelectedTeam(v);
                  try {
                    await assignTeam({ id: project.id, teamId: v || null }).unwrap();
                    toast.success('Đã phân team cho dự án');
                    try { refetch && refetch(); } catch (e) {}
                  } catch (err) {
                    console.error('assign team failed', err);
                    toast.error(err?.data?.message || err?.message || 'Phân team thất bại');
                  }
                }}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">-- Chọn team --</option>
                {(teams || []).map((t) => (
                  <option key={t.id ?? t.team_id} value={t.id ?? t.team_id}>{t.name || t.team_name || `#${t.id ?? t.team_id}`}</option>
                ))}
              </select>
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

      </div>
    </div>
  );
}
