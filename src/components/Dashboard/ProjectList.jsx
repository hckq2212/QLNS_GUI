import React, { useMemo, useState } from 'react';
import { useGetAllProjectsQuery } from '../../services/project';
import { useGetAllTeamsQuery } from '../../services/team';
import { PROJECT_STATUS_LABELS } from '../../utils/enums';

export default function ProjectChart() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const pageSize = 10;


    const { data: projectsData, isLoading, isError, error } = useGetAllProjectsQuery();
    const { data: teamsData = [] } = useGetAllTeamsQuery();

    const list = Array.isArray(projectsData) ? projectsData : Array.isArray(projectsData?.items) ? projectsData.items : [];

    const teamById = useMemo(() => {
        if (!Array.isArray(teamsData)) return {};
        return teamsData.reduce((acc, t) => {
            if (t && t.id) acc[t.id] = t;
            return acc;
        }, {});
    }, [teamsData]);

    const enriched = useMemo(() => {
        return list.map((p) => ({
            ...p,
            team: p.team || (p.team_id ? { id: p.team_id, name: teamById[p.team_id]?.name || null } : null),
        }));
    }, [list, teamById]);

    const filtered = useMemo(() => {
        const q = (search || '').trim().toLowerCase();
        return enriched.filter((p) => {
            if (statusFilter !== 'all') {
                const st = p.status || p.project_status || 'unknown';
                if (st !== statusFilter) return false;
            }
            if (!q) return true;
            return (
                String(p.id || '').includes(q) ||
                (p.name || '').toLowerCase().includes(q) ||
                (p.code || '').toLowerCase().includes(q) ||
                (p.customer_name || p.customer?.name || '').toLowerCase().includes(q)
            );
        });
    }, [enriched, search, statusFilter]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

    React.useEffect(() => {
        setPage(1);
    }, [search, statusFilter]);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2 text-blue-600">Danh sách dự án</h2>
            <div className="mb-4 flex flex-wrap gap-3 items-center">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm"
                    className="border px-3 py-2 rounded w-64"
                />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border px-3 py-2 rounded">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="planned">Planned</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">done</option>
                    <option value="team_acknowledged">Team acknowledged</option>
                </select>
            </div>

            {isLoading ? (
                <div className="text-sm text-gray-500">Đang tải...</div>
            ) : isError ? (
                <div className="text-sm text-red-600">{String(error?.data || error?.message || error)}</div>
            ) : (
                <div className="overflow-x-auto bg-white rounded border">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2">Tên</th>
                                <th className="px-4 py-2">Đội phụ trách</th>
                                <th className="px-4 py-2">Trạng thái</th>
                                <th className="px-4 py-2">Ngày khởi công</th>
                                <th className="px-4 py-2">Ngày kết thúc</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                                        Không có dự án để hiển thị
                                    </td>
                                </tr>
                            ) : (
                                pageItems.map((p) => (
                                    <tr key={p.id} className="border-t">
                                        <td className="px-4 py-3 align-top">
                                            <div className="font-medium">{p.name || p.title || p.code || `Project #${p.id}`}</div>
                                            {p.code && <div className="text-xs text-gray-500">Mã: {p.code}</div>}
                                        </td>
                                        <td className="px-4 py-3 align-top">{p.team?.name || p.team_name || p.team_id || '-'}</td>
                                        <td className="px-4 py-3 align-top">
                                            <span className="inline-block px-2 py-1 text-md rounded">{PROJECT_STATUS_LABELS[p.status] || p.status || 'unknown'}</span>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {p.start_date ? new Date(p.start_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {p.end_date ? new Date(p.end_date).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* pagination */}
                    <div className="flex items-center justify-between p-3">
                        <div className="text-sm text-gray-600">Trang {page} / {totalPages}</div>
                        <div className="space-x-2">
                            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Trước</button>
                            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Sau</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}