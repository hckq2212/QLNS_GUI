import React, { useEffect, useState } from 'react';
import pickName from '../../utils/pickName.js';
import contractAPI from '../../api/contract.js';
import customerAPI from '../../api/customer.js';
import teamAPI from '../../api/team.js';
import projectAPI from '../../api/project.js';

export default function NotAssignedContract() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState({});
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState({});
  const [assignLoading, setAssignLoading] = useState({});


  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await contractAPI.getByStatus({ status: 'not_assigned' });
        const arr = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
        // enrich with customer name when customer_id present
        const customerIds = Array.from(new Set(arr.map(c => c.customer_id).filter(Boolean)));
        const byId = {};
        if (customerIds.length > 0) {
          const fetched = await Promise.allSettled(customerIds.map(id => customerAPI.getById(id).catch(() => null)));
          fetched.forEach((r, idx) => {
            const id = customerIds[idx];
            if (r.status === 'fulfilled' && r.value) {
              byId[id] = r.value.name || r.value.customer_name || (r.value.customer && r.value.customer.name) || null;
            }
          });
        }
        const enriched = arr.map(c => ({ ...c, customer: c.customer || (c.customer_id ? { name: byId[c.customer_id] || c.customerName || c.customer_temp || null } : c.customer) }));
        if (mounted) setList(enriched);
        // fetch project for each contract in parallel (best-effort)
        try {
          const projPromises = enriched.map(it => projectAPI.getByContract(it.id).catch(() => null));
          const projResults = await Promise.allSettled(projPromises);
          const byContract = {};
          projResults.forEach((r, idx) => {
            if (r.status === 'fulfilled' && r.value) {
              const project = Array.isArray(r.value) ? (r.value[0] || null) : (r.value && r.value.project ? r.value.project : r.value);
              if (project) byContract[enriched[idx].id] = project;
            }
          });
          if (mounted) setList(prev => prev.map(it => ({ ...it, project: byContract[it.id] || it.project })));
        } catch (e) {
          console.warn('Failed to load project for contracts', e);
        }
        // fetch teams once
        try {
          const t = await teamAPI.getAll();
          if (mounted) setTeams(Array.isArray(t) ? t : (t && Array.isArray(t.items) ? t.items : []));
        } catch (e) {
          console.warn('Failed to load teams', e);
        }
      } catch (err) {
        console.error('Lỗi get các hợp đồng đợi bod duyệt', err);
        if (mounted) setError(err?.message || 'Failed to load');
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Hợp đồng đợi phân công</h3>
            {loading ? <div className="text-sm text-gray-500">Đang tải...</div> : error ? <div className="text-sm text-red-600">{error}</div> : (
        <div className="space-y-3">
          {list.length === 0 ? <div className="text-sm text-gray-600">Không có hợp đồng</div> : (
            list.map(c => {
              return (
              <div key={c.id} className="p-3 border rounded">
                <div className="font-medium">Hợp đồng {c.code}</div>
                <div className="text-sm text-gray-700">Khách hàng: {c.customer?.name || c.customerName || pickName(c.customer_temp) || c.customer_temp || '—'}</div>
                <div className="text-sm text-gray-600">Dự án: {c.project?.name || c.project?.title || c.project?.code || '—'} — Trạng thái: {c.project?.status || c.project?.state || '—'}</div>
                <div className="mt-2 flex items-center gap-2">
                  <select className="border px-2 py-1 rounded" value={selectedTeam[c.id] || ''} onChange={(e) => setSelectedTeam(s => ({ ...s, [c.id]: e.target.value }))}>
                    <option value="">Chọn team</option>
                    {teams.map(t => <option value={t.id} key={t.id}>{t.name || t.title || t.code || t.id}</option>)}
                  </select>
                  <button
                    className="px-2 py-1 bg-indigo-600 text-white rounded"
                    disabled={!selectedTeam[c.id] || assignLoading[c.id]}
                    onClick={async () => {
                      const teamId = selectedTeam[c.id];
                      if (!teamId) return;
                      try {
                        setAssignLoading(s => ({ ...s, [c.id]: true }));
                        // Try to get project by contract to avoid fetching full contract
                        let projectRes = null;
                        try {
                          projectRes = await projectAPI.getByContract(c.id);
                        } catch (e) {
                          // ignore, we'll fallback
                          projectRes = null;
                        }
                        let project = null;
                        if (projectRes) {
                          project = Array.isArray(projectRes) ? (projectRes[0] || null) : (projectRes.project || projectRes);
                        }
                        // fallback: fetch contract detail to read project id
                        if (!project) {
                          try {
                            const detail = await contractAPI.getById(c.id);
                            // server might return project as detail.project or detail.project_id
                            project = detail?.project || detail?.project_id || (detail?.project && detail.project) || null;
                            // if project is just an id, normalize
                            if (typeof project === 'number' || typeof project === 'string') {
                              project = { id: project };
                            }
                          } catch (e) {
                            console.error('Không lấy được project cho hợp đồng', e);
                            throw new Error('Không xác định được dự án liên quan tới hợp đồng');
                          }
                        }
                        const projectId = project?.id || project?.projectId || project?._id;
                        if (!projectId) throw new Error('Không tìm thấy projectId');
                        await projectAPI.assignTeam(projectId, teamId);
                        // remove assigned contract from list (optimistic)
                        setList(prev => prev.filter(x => x.id !== c.id));
                      } catch (err) {
                        console.error('Gán team lỗi', err);
                        // best-effort user feedback
                        try { alert(err?.message || 'Gán team thất bại'); } catch(e) { /* ignore */ }
                      } finally {
                        setAssignLoading(s => ({ ...s, [c.id]: false }));
                      }
                    }}
                  >{assignLoading[c.id] ? 'Đang...' : 'Gán team'}</button>
                </div>

                {showDetails[c.id] && (
                  <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(c, null, 2)}</pre>
                )}
              </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}


