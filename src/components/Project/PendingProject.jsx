import React, { useEffect, useState } from 'react';
import projectAPI from '../../api/project';
import contractAPI from '../../api/contract';
import serviceAPI from '../../api/service';

export default function PendingProject() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [acceptLoading, setAcceptLoading] = useState({});
    const [ackLoading, setAckLoading] = useState({});

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await projectAPI.getByStatus('not_assigned');
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
                            return { projectId: p.id };
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
            <h3 className="font-semibold mb-3">Dự án chuẩn bị khởi công</h3>
            {loading ? <div className="text-sm text-gray-500">Đang tải...</div> : error ? <div className="text-sm text-red-600">{error}</div> : (
                <div>
                    {projects.length === 0 ? (
                        <div className="text-sm text-gray-600">Không có dự án pending</div>
                    ) : (
                        <div className="overflow-x-auto bg-white rounded border">
                            <table className="min-w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2">ID</th>
                                        <th className="px-4 py-2">Dự án</th>
                                        <th className="px-4 py-2">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((p) => {
                                        const projKey = p.id || p._id;
                                        return (
                                            <tr key={projKey} className="border-t">
                                                <td className="px-4 py-3 align-top">{projKey}</td>
                                                <td className="px-4 py-3 align-top font-medium">{p.name}</td>
                                                <td className="px-4 py-3 align-top">
                                                    <button
                                                        className="px-2 py-1 bg-indigo-600 text-white rounded"
                                                        disabled={ackLoading[projKey]}
                                                        onClick={async () => {
                                                            const pid = projKey;
                                                            try {
                                                                setAckLoading(s => ({ ...s, [pid]: true }));
                                                                const res = await projectAPI.ack(pid);
                                                                // update project entry with returned result when possible
                                                                setProjects(prev => prev.map(pr => (pr.id === pid ) ? ({ ...pr, ...res }) : pr));
                                                            } catch (e) {
                                                                console.error('Failed to ack project', e);
                                                                try { alert('Không thể khởi công dự án'); } catch(_) {}
                                                            } finally {
                                                                setAckLoading(s => ({ ...s, [pid]: false }));
                                                            }
                                                        }}
                                                    >{ackLoading[projKey] ? 'Đang...' : 'Khởi công'}</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}