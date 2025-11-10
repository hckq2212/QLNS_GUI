import React from 'react';
import { Link } from 'react-router-dom';
import { useGetAllProjectsQuery } from '../../services/project';
import { useGetAllTeamsQuery } from '../../services/team';
import { useGetAllCustomerQuery } from '../../services/customer';
import { useGetContractByIdQuery } from '../../services/contract';
import { useGetCustomerByIdQuery } from '../../services/customer';
import { formatPrice } from '../../utils/FormatValue';
import { PROJECT_STATUS_LABELS } from '../../utils/enums';

export default function ProjectList() {
  const { data: projects = [], isLoading, isError, error } = useGetAllProjectsQuery();
  const { data: teams = [] } = useGetAllTeamsQuery();
  const { data: customers = [] } = useGetAllCustomerQuery();

  const teamById = React.useMemo(() => {
    const m = {};
    (teams || []).forEach((t) => { if (t && (t.id || t.team_id)) m[t.id ?? t.team_id] = t; });
    return m;
  }, [teams]);

  const customerById = React.useMemo(() => {
    const m = {};
    (customers || []).forEach((c) => { if (c && (c.id || c.customer_id)) m[c.id ?? c.customer_id] = c; });
    return m;
  }, [customers]);

  if (isLoading) return <div className="p-6">Đang tải danh sách dự án...</div>;
  if (isError) return <div className="p-6 text-red-600">Lỗi: {error?.message || 'Failed to load projects'}</div>;

  const rows = Array.isArray(projects) ? projects : (projects?.items || []);

  function ProjectRow({ p }) {
    // fetch contract by contract_id when project doesn't have customer
    const { data: contract } = useGetContractByIdQuery(p.contract_id, { skip: !p.contract_id });
    // if contract doesn't embed customer name, fetch customer by id
    const { data: contractCustomer } = useGetCustomerByIdQuery(contract?.customer_id, { skip: !contract?.customer_id });

    const customerName = (
      p.customer?.name ||
      (p.customer_id && customerById[p.customer_id]?.name) ||
      p.customer_temp?.name ||
      contract?.customer?.name ||
      contractCustomer?.name ||
      contract?.customer_temp?.name ||
      '—'
    );

    const teamName = (p.team && (p.team.name || p.team.team_name)) || (p.team_id && teamById[p.team_id] && (teamById[p.team_id].name || teamById[p.team_id].team_name)) || '—';

    return (
      <tr key={p.id} className="border-t hover:bg-gray-50">
        <td className="px-4 py-3 align-top">{p.name || p.project_name || p.title || `#${p.id}`}</td>
        <td className="px-4 py-3 align-top">{customerName}</td>
        <td className="px-4 py-3 align-top">{teamName}</td>
        <td className="px-4 py-3 align-top">{PROJECT_STATUS_LABELS[p.status] || '—'}</td>
        <td className="px-4 py-3 align-top">
          <Link to={`/project/${p.id}`} className="px-3 py-1 rounded bg-blue-600 text-white text-xs">Xem</Link>
        </td>
      </tr>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Danh sách dự án</h2>
      {rows.length === 0 ? (
        <div className="text-sm text-gray-600">Không có dự án</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow text-left">
          <table className="min-w-full text-sm">
            <thead className="bg-[#e7f1fd] text-left">
              <tr>
                <th className="px-4 py-3 text-blue-700">Tên dự án</th>
                <th className="px-4 py-3 text-blue-700">Khách hàng</th>
                <th className="px-4 py-3 text-blue-700">Team</th>
                <th className="px-4 py-3 text-blue-700">Trạng thái</th>
                <th className="px-4 py-3 text-blue-700">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <ProjectRow key={p.id} p={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
