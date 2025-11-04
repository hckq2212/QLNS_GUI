import React from 'react';
import { useGetProjectByStatusQuery, useUpdateProjectMutation } from '../../services/project';
import { useGetContractServicesQuery, useUpdateContractMutation } from '../../services/contract';
import { useGetServicesQuery } from '../../services/service';
import { toast } from 'react-toastify'

function ProjectRow({ project, servicesById, onOptimisticUpdate }) {
    const contractId = project.contract_id || project.contract?.id || project.contract || null;
    const { data: svcRows = [], isLoading: svcLoading } = useGetContractServicesQuery(contractId, { skip: !contractId });
    const [updateProject] = useUpdateProjectMutation();
    const [updateContract] = useUpdateContractMutation();
    const [loading, setLoading] = React.useState(false);

        // compute counts per service id from svcRows
        const serviceCounts = (svcRows || []).reduce((acc, r) => {
            const id = r.service_id ;
            const qty = Number( r.qty ?? 1) || 0;
            if (!id) return acc;
            acc[id] = (acc[id] || 0) + qty;
            return acc;
        }, {});

        const serviceIds = Object.keys(serviceCounts);
        const services = serviceIds.map((id) => ({ service: servicesById[id], id, count: serviceCounts[id] || 0 }));

    return (
        <tr className="border-t">
            <td className="px-4 py-3 align-top font-medium">{project.name || `#${project.id}`}</td>
            <td className="px-4 py-3 align-top">
                <div className="flex items-center gap-2">
                <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-3 gap-2 ">
                        {svcLoading ? null : (services.length > 0 ? services.map(s => (
                            <div key={s.id} className="flex items-center gap-1 bg-white border rounded px-3 py-1 text-sm justify-between">
                                <div className="font-medium">{(s.service.name) || `#${s.id}`}</div>
                                <div className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">×{s.count}</div>
                            </div>
                        )) : (
                            <div className="text-sm text-gray-500">Không có dịch vụ</div>
                        ))}
                    </div>
                </div>
                </div>
            </td>
            <td>
            <button
            className="px-2 py-1 bg-green-600 text-white rounded"
            disabled={loading}
            onClick={async () => {
                if (!project.id) return;
                try {
                    setLoading(true);
                    await updateProject({ id: project.id, body: { status: 'team_acknowledged' } }).unwrap();
                    if (contractId) {
                        try {
                            await updateContract({ id: contractId, body: { status: 'assigned' } }).unwrap();
                        } catch (e) {
                            console.error('Failed to update contract', e);
                        }
                    }
                    if (typeof onOptimisticUpdate === 'function') onOptimisticUpdate(project.id);
                    toast.success('Đã chấp nhận dự án')
                } catch (e) {
                    console.error('Failed to accept project', e);
                } finally {
                    setLoading(false);
                }
            }}
        >{loading ? 'Đang...' : 'Chấp nhận'}</button>
            </td>
        </tr>
    );
}

export default function AssigningProject() {
    const { data, isLoading, isError, error } = useGetProjectByStatusQuery('assigned');
    const { data: servicesList = [] } = useGetServicesQuery();

    const servicesById = React.useMemo(() => {
        if (!Array.isArray(servicesList)) return {};
        return servicesList.reduce((acc, s) => {
            if (s && s.id) acc[s.id] = s;
            return acc;
        }, {});
    }, [servicesList]);

    const list = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);

    const [optimisticSet, setOptimisticSet] = React.useState({});

    return (
        <div className="p-4">
            {isLoading ? <div className="text-sm text-gray-500">Đang tải...</div> : isError ? <div className="text-sm text-red-600">{String(error?.data || error?.error || error)}</div> : (
                <div>
                    {list.length === 0 ? (
                        <div className="text-sm text-gray-600">Không có dự án assigned</div>
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
                                    {list.map((p) => (
                                        <ProjectRow key={p.id} project={p} servicesById={servicesById} onOptimisticUpdate={(id) => setOptimisticSet(s => ({ ...s, [id]: true }))} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}