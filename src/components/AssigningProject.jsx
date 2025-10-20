import React, { useEffect, useState } from 'react';
import projectAPI from '../api/project';
import contractAPI from '../api/contract';
import serviceAPI from '../api/service';

export default function AssigningProject() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await projectAPI.getByStatus('planned');
                const arr = Array.isArray(res) ? res : (res && Array.isArray(res.items) ? res.items : []);
                if (mounted) setProjects(arr);
                // For each project, if it has a contract id, fetch contract services
                try {
                    const svcPromises = arr.map(async (p) => {
                        const contractId = p.contract_id || p.contractId || p.contract?.id || p.contract?._id || p.contract;
                        if (!contractId) return { projectId: p.id || p._id, services: [] };
                        try {
                            const rows = await contractAPI.getServiceUsage(contractId);
                            const svcRows = Array.isArray(rows) ? rows : (rows && Array.isArray(rows.items) ? rows.items : (rows.services || []));
                            // collect unique service_ids from contract_service rows
                            const svcIds = Array.from(new Set(svcRows.map(r => r.service_id || r.serviceId || (r.service && (r.service.id || r.service._id)) ).filter(Boolean)));
                            const svcMap = {};
                            if (svcIds.length > 0) {
                                const fetched = await Promise.allSettled(svcIds.map(id => serviceAPI.getById(id).catch(() => null)));
                                fetched.forEach((res, idx) => {
                                    const id = svcIds[idx];
                                    if (res.status === 'fulfilled' && res.value) svcMap[id] = res.value;
                                });
                            }
                            // attach service details to each contract_service row
                            const enriched = svcRows.map(r => {
                                const sid = r.service_id || r.serviceId || (r.service && (r.service.id || r.service._id));
                                const svc = sid ? svcMap[sid] : (r.service || null);
                                return { ...r, service: svc, service_name: svc?.name || svc?.title || r.service_name || r.name, quantity:  r.qty || 0 };
                            });
                            return { projectId: p.id || p._id, services: enriched };
                        } catch (e) {
                            console.warn('Failed to fetch services for contract', contractId, e?.message || e);
                            return { projectId: p.id || p._id, services: [] };
                        }
                    });
                    const results = await Promise.allSettled(svcPromises);
                    const svcByProject = {};
                    results.forEach(r => { if (r.status === 'fulfilled' && r.value) svcByProject[r.value.projectId] = r.value.services || []; });
                    if (mounted) setProjects(prev => prev.map(pr => ({ ...pr, services: svcByProject[pr.id || pr._id] || pr.services || [] })));
                } catch (e) {
                    console.warn('Failed to fetch contract services for projects', e);
                }
            } catch (err) {
                console.error('Failed to fetch planned projects', err);
                if (mounted) setError(err?.message || 'Failed to load projects');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <div className="p-4">
            <h3 className="font-semibold mb-3">Dự án (planned)</h3>
            {loading ? <div className="text-sm text-gray-500">Đang tải...</div> : error ? <div className="text-sm text-red-600">{error}</div> : (
                <div className="space-y-2">
                    {projects.length === 0 ? <div className="text-sm text-gray-600">Không có dự án planned</div> : projects.map(p => (
                        <div key={p.id || p._id} className="p-3 border rounded">
                            <div className="font-medium">{p.name || p.title || p.code || `#${p.id || p._id}`}</div>
                            <div className="text-sm text-gray-600">Trạng thái: {p.status || p.state || '—'}</div>
                            <div className="text-sm text-gray-700">Mô tả: {p.description || p.desc || '—'}</div>
                            {Array.isArray(p.services) && p.services.length > 0 && (
                                <div className="mt-2">
                                    <div className="text-sm font-medium">Dịch vụ:</div>
                                    <ul className="mt-1 text-sm list-disc list-inside space-y-1">
                                        {p.services.map(s => (
                                            <li key={s.id || s._id || s.service_id || s.code}>
                                                { (s.service && (s.service.name || s.service.title)) || s.service_name || s.name || s.title || `#${s.service_id || s.id || s._id}`} 
                                                {` — Số lượng: ${ s.qty ??  0}`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}