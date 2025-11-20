import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useGetProjectByIdQuery } from '../../services/project';
import { useGetServicesQuery } from '../../services/service';
import { useGetContractServicesQuery } from '../../services/contract';

export default function ReviewDetail({ id: propId } = {}) {
  let routeId = null;
  try {
    const p = useParams();
    routeId = p?.id || null;
  } catch (e) {
    routeId = null;
  }
  const id = propId || routeId;

  const { data: project, isLoading, isError, error } = useGetProjectByIdQuery(id, { skip: !id });
  const { data: servicesList = [] } = useGetServicesQuery();
  const { data: contractServicesData = [] } = useGetContractServicesQuery(project?.contract_id, { skip: !project?.contract_id });

  const projectServices = useMemo(() => {
    if (!project) return [];
    return project.services || project.project_services || project.project_service_rows || [];
  }, [project]);

  const displayedServices = useMemo(() => {
    const contractRows = Array.isArray(contractServicesData) ? contractServicesData : (contractServicesData?.items || []);
    if (project?.contract_id && contractRows && contractRows.length > 0) return contractRows;
    return projectServices;
  }, [project, contractServicesData, projectServices]);

  if (!id) return <div className="p-6">No project id provided</div>;
  if (isLoading) return <div className="p-6">Loading project...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load project'}</div>;
  if (!project) return <div className="p-6 text-gray-600">Project not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-md font-semibold text-blue-700"> {project.name || project.project_name || `#${project.id}`}</h2>
        <hr className="my-4" />

        {Array.isArray(displayedServices) && displayedServices.length > 0 ? (
          <div className="mt-2">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#e7f1fd]">
                  <th className="px-3 py-2 text-left text-blue-700">Tên dịch vụ</th>
                  <th className="px-3 py-2 text-left text-blue-700">Số lượng</th>
                  <th className="px-3 py-2 text-left text-blue-700">Hành động</th>
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
                    <td className="px-3 py-2 align-top"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3 text-gray-600">Không có dịch vụ được sử dụng cho dự án này</div>
        )}
      </div>
    </div>
  );
}
