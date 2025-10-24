import React, { useEffect, useMemo, useState } from 'react';
import projectAPI from '../../api/project';
import teamAPI from '../../api/team';

export default function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // UI state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await projectAPI.getAll();
                const list = Array.isArray(data) ? data : [];

                // resolve team names for projects that have team_id
                const teamIds = Array.from(new Set(list.map((p) => p.team_id).filter(Boolean)));
                let teamById = {};
                if (teamIds.length > 0) {
                    try {
                        const fetched = await Promise.allSettled(
                            teamIds.map((id) => teamAPI.getById(id).catch(() => null))
                        );
                        fetched.forEach((r, idx) => {
                            const id = teamIds[idx];
                            teamById[id] = r.value.name || null;
                        });
                } catch (e) {
                    // ignore team enrichment failures
                }
            }

            const enriched = list.map((p) => ({
                ...p,
                team: p.team || (p.team_id ? { id: p.team_id, name: teamById[p.team_id] || null } : null),
            }));

            if (mounted) setProjects(enriched);
            } catch (err) {
                console.error('Lỗi khi lấy thông tin dự án', err);
                if (mounted) setError(err?.message || 'Lỗi khi lấy thông tin dự án');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    // derived filtered list
    const filtered = useMemo(() => {
        const q = (search || '').trim().toLowerCase();
        return projects.filter((p) => {
            if (statusFilter !== 'all') {
                const st = p.status || p.project_status || 'unknown';
                if (st !== statusFilter) return false;
            }
            if (!q) return true;
            // search in common fields
            return (
                String(p.id || '').includes(q) ||
                (p.name || '').toLowerCase().includes(q) ||
                (p.code || '').toLowerCase().includes(q) ||
                (p.customer_name || p.customer?.name || '').toLowerCase().includes(q)
            );
        });
    }, [projects, search, statusFilter]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        // reset to first page when filters change
        setPage(1);
    }, [search, statusFilter]);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Danh sách dự án</h2>
            <div className="mb-4 flex flex-wrap gap-3 items-center">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo tên, mã"
                    className="border px-3 py-2 rounded w-64"
                />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border px-3 py-2 rounded">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="planned">Planned</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="team_acknowledged">Team acknowledged</option>
                </select>
            </div>

            {loading ? (
                <div className="text-sm text-gray-500">Đang tải...</div>
            ) : error ? (
                <div className="text-sm text-red-600">{error}</div>
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
                                            <span className="inline-block px-2 py-1 text-md rounded">{p.status || p.project_status || 'unknown'}</span>
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