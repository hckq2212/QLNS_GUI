import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useGetProjectByStatusQuery, useAssignTeamMutation } from '../../services/project';
import { useGetContractsByIdsQuery } from '../../services/contract';
import { useGetAllTeamsQuery } from '../../services/team';

export default function NotAssignedProject() {
  const { data, isLoading, isError, error } = useGetProjectByStatusQuery('not_assigned');
  const [expanded, setExpanded] = useState({});

  const list = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);

  // collect unique contract ids referenced by projects
  const contractIds = Array.from(
    new Set(list.map((p) => p.contract?.id || p.contract_id || p.contract).filter(Boolean))
  );

  const {
    data: contractsData,
    isLoading: contractsLoading,
    isError: contractsError,
  } = useGetContractsByIdsQuery(contractIds, { skip: contractIds.length === 0 });

  const contractById = Array.isArray(contractsData)
    ? contractsData.reduce((acc, c) => {
        if (c && c.id) acc[c.id] = c;
        return acc;
      }, {})
    : {};

  // teams
  const { data: teams, isLoading: teamsLoading } = useGetAllTeamsQuery();
  const [selectedTeam, setSelectedTeam] = useState({}); // map projectId -> teamId
  const [assigning, setAssigning] = useState({}); // map projectId -> boolean
  const [assignTeam] = useAssignTeamMutation();

  return (
    <div className="p-4">
      {isLoading ? (
        <div className="text-sm text-gray-500">Đang tải dự án...</div>
      ) : isError ? (
        <div className="text-sm text-red-600">{String(error?.data || error?.error || error)}</div>
      ) : (
        <div className="overflow-x-auto">
          {list.length === 0 ? (
            <div className="text-sm text-gray-600">Không có dự án chưa gán</div>
          ) : (
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2 border">Dự án</th>
                  <th className="px-4 py-2 border">Hợp đồng</th>
                  <th className="px-4 py-2 border">Trạng thái</th>
                  <th className="px-4 py-2 border">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <React.Fragment key={p.id}>
                    <tr className="border-t">
                      <td className="px-4 text-left py-3 align-top">{p.name}</td>
                      <td className="px-4 text-left py-3 align-top">
                        {(() => {
                          const cid = p.contract?.id || p.contract_id || p.contract;
                          if (!cid) return <span className="text-sm text-gray-500">—</span>;
                          if (contractsLoading && !contractById[cid]) return <span className="text-sm text-gray-500">Đang tải...</span>;
                          const ct = contractById[cid];
                          return <span>{ct?.code || `#${cid}`}</span>;
                        })()}
                      </td>
                      <td className="px-4 text-left py-3 align-top">{p.status || '-'}</td>
                      <td className="px-4 text-left py-3 align-top">
                        <div className="flex items-center gap-2">
                          {teamsLoading ? (
                            <div className="text-sm text-gray-500">Đang tải teams...</div>
                          ) : (
                            <select
                              className="border px-2 py-1 rounded"
                              value={selectedTeam[p.id] ?? ''}
                              onChange={(e) => setSelectedTeam((s) => ({ ...s, [p.id]: e.target.value }))}
                            >
                              <option value="">Chọn team</option>
                              {(Array.isArray(teams) ? teams : []).map((t) => (
                                <option key={t.id} value={t.id}>{t.name || t.code || `#${t.id}`}</option>
                              ))}
                            </select>
                          )}

                          <button
                            className="px-2 py-1 bg-indigo-600 text-white rounded"
                            disabled={assigning[p.id] || !selectedTeam[p.id]}
                            onClick={async () => {
                              const teamId = selectedTeam[p.id];
                              if (!teamId) return toast.warn('Vui lòng chọn team trước khi phân công');
                              try {
                                setAssigning((s) => ({ ...s, [p.id]: true }));
                                await assignTeam({ id: p.id, teamId: Number(teamId) }).unwrap();
                                toast.success('Phân công team thành công');
                                // clear selection for this row
                                setSelectedTeam((s) => ({ ...s, [p.id]: '' }));
                              } catch (err) {
                                console.error('Assign team failed', err);
                                toast.error(err?.data?.message || err?.message || 'Phân công thất bại');
                              } finally {
                                setAssigning((s) => ({ ...s, [p.id]: false }));
                              }
                            }}
                          >
                            {assigning[p.id] ? 'Đang...' : 'Phân công'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

