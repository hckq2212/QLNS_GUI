import React, { useState } from 'react';
import { useGetProjectByStatusQuery, useAckProjectMutation } from '../../services/project';
import { useGetContractServicesQuery } from '../../services/contract';
import { useGetServicesQuery } from '../../services/service';
import { toast } from 'react-toastify';

export default function PendingProject() {
    const { data, isLoading, isError, error } = useGetProjectByStatusQuery('not_assigned');
    const [ackLoading, setAckLoading] = useState({});
    const { data: servicesList = [] } = useGetServicesQuery();
    const [ackProject] = useAckProjectMutation();

    const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];

    return (
        <div className="p-4">
            <h3 className="font-semibold mb-3">Dự án chuẩn bị khởi công</h3>
            {isLoading ? <div className="text-sm text-gray-500">Đang tải...</div> : error ? <div className="text-sm text-red-600">{error}</div> : (
                <div>
                    {list.length === 0 ? (
                        <div className="text-sm text-gray-600">Không có dự án chưa khởi công</div>
                    ) : (
                        <div className="overflow-x-auto bg-white rounded border">
                            <table className="min-w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2">Dự án</th>
                                        <th className="px-4 py-2">Dịch vụ</th>
                                        <th className="px-4 py-2">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map((p) => {
                                        const projKey = p.id || p._id;
                                        return (
                                            <ProjectRow
                                                key={projKey}
                                                project={p}
                                                servicesList={servicesList}
                                                ackLoading={ackLoading}
                                                setAckLoading={setAckLoading}
                                                ackProject={ackProject}
                                            />
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

function ProjectRow({ project, servicesList, ackLoading, setAckLoading, ackProject }) {
    const projKey = project.id || project._id;
    const contractId = project.contract_id || project.contract?.id || project.contract || null;
    const { data: svcRows = [], isLoading: svcLoading } = useGetContractServicesQuery(contractId, { skip: !contractId });

    const servicesById = React.useMemo(() => {
        if (!Array.isArray(servicesList)) return {};
        return servicesList.reduce((acc, s) => {
            if (s && (s.id || s._id)) acc[s.id || s._id] = s;
            return acc;
        }, {});
    }, [servicesList]);

    const serviceCounts = React.useMemo(() => {
        return (svcRows || []).reduce((acc, r) => {
            const id = r.service_id || r.serviceId || (r.service && (r.service.id || r.service._id));
            const qty = Number(r.quantity ?? r.qty ?? r.amount ?? r.count ?? r.used_amount ?? 1) || 0;
            if (!id) return acc;
            acc[id] = (acc[id] || 0) + qty;
            return acc;
        }, {});
    }, [svcRows]);

    return (
        <tr className="border-t">
            <td className="px-4 py-3 align-top font-medium">{project.name}</td>
            <td className="px-4 py-3 align-top">
                {svcLoading ? <div className="text-sm text-gray-500">Đang tải dịch vụ...</div> : (
                    Object.keys(serviceCounts).length === 0 ? (
                        <div className="text-sm text-gray-600">Không có dịch vụ</div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(serviceCounts).map(([id, count]) => (
                                <div key={id} className="flex items-center gap-2 bg-white border rounded px-3 py-1 text-sm">
                                    <div className="font-medium">{(servicesById[id] && (servicesById[id].name || servicesById[id].code)) || `#${id}`}</div>
                                    <div className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">×{count}</div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </td>
            <td className="px-4 py-3 align-top">
                <button
                    className="px-2 py-1 bg-indigo-600 text-white rounded"
                    disabled={ackLoading[projKey]}
                    onClick={async () => {
                        try {
                            setAckLoading(s => ({ ...s, [projKey]: true }));
                            const res = await ackProject(project.id || project._id).unwrap();
                            toast.success('Dự án đã được khởi công')
                        } catch (e) {
                            console.error('Failed to ack project', e);
                            try { alert('Không thể khởi công dự án'); } catch(_) {}
                        } finally {
                            setAckLoading(s => ({ ...s, [projKey]: false }));
                        }
                    }}
                >{ackLoading[projKey] ? 'Đang...' : 'Khởi công'}</button>
            </td>
        </tr>
    );
}