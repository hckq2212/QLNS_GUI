import React, { useEffect, useMemo, useState } from 'react';
import contractAPI from '../../api/contract.js';

export default function ContractList() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // simple UI state
    const [search, setSearch] = useState('');
        const [page, setPage] = useState(1);
        const pageSize = 10;

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await contractAPI.getAll();
                const list = Array.isArray(data) ? data : [];
                if (mounted) setContracts(list);
            } catch (err) {
                console.error('Lỗi khi lấy hợp đồng', err);
                if (mounted) setError(err?.message || 'Lỗi khi lấy hợp đồng');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

        const filtered = useMemo(() => {
        const q = (search || '').trim().toLowerCase();
        if (!q) return contracts;
        return contracts.filter((c) => {
            return (
                String(c.id || '').includes(q) ||
                (c.code || '').toLowerCase().includes(q) ||
                (c.customer_name || c.customer?.name || '').toLowerCase().includes(q)
            );
        });
    }, [contracts, search]);

        // pagination
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

        useEffect(() => {
            setPage(1);
        }, [search]);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Danh sách hợp đồng</h2>

            <div className="mb-4 flex items-center gap-3">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo mã, khách hàng, id..."
                    className="border px-3 py-2 rounded w-64"
                />
                <div className="text-sm text-gray-600">Tổng: {contracts.length}</div>
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
                                <th className="px-4 py-2">#</th>
                                <th className="px-4 py-2">Mã</th>
                                <th className="px-4 py-2">Khách hàng</th>
                                <th className="px-4 py-2">Trạng thái</th>
                                <th className="px-4 py-2">Tổng tiền</th>
                                <th className="px-4 py-2">Ngày tạo</th>
                                <th className="px-4 py-2">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                                            {pageItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                                        Không có hợp đồng để hiển thị
                                    </td>
                                </tr>
                                            ) : (
                                            pageItems.map((c) => (
                                    <tr key={c.id} className="border-t">
                                        <td className="px-4 py-3 align-top">{c.id}</td>
                                        <td className="px-4 py-3 align-top">{c.code || '-'}</td>
                                        <td className="px-4 py-3 align-top">{c.customer?.name || c.customer_name || '-'}</td>
                                        <td className="px-4 py-3 align-top">{c.status || c.status_name || '-'}</td>
                                        <td className="px-4 py-3 align-top">{c.total_amount != null ? c.total_amount : '-'}</td>
                                        <td className="px-4 py-3 align-top">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</td>
                                        <td className="px-4 py-3 align-top">
                                            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Xem</button>
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