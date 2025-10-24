import React, { useEffect, useMemo, useState } from 'react';
import contractAPI from '../../api/contract.js';
import customerAPI from '../../api/customer.js';

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

                    // enrich customer names for contracts that only have customer_id
                    const customerIds = Array.from(new Set(list.map((c) => c.customer_id).filter(Boolean)));
                    let byCustomer = {};
                    if (customerIds.length > 0) {
                        try {
                            const fetched = await Promise.allSettled(
                                customerIds.map((id) => customerAPI.getById(id).catch(() => null))
                            );
                            fetched.forEach((r, idx) => {
                                const id = customerIds[idx];
                                if (r.status === 'fulfilled' && r.value) {
                                    byCustomer[id] = r.value.name || r.value.customer_name || (r.value.customer && r.value.customer.name) || null;
                                }
                            });
                        } catch (e) {
                            // ignore customer enrichment errors
                        }
                    }

                    const enriched = list.map((c) => ({
                        ...c,
                        customer: c.customer || (c.customer_id ? { id: c.customer_id, name: byCustomer[c.customer_id] || c.customer_name || null } : c.customer),
                    }));

                    if (mounted) setContracts(enriched);
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
                ( c.customer?.name || '').toLowerCase().includes(q)
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
                    placeholder="Tìm kiếm"
                    className="border px-3 py-2 rounded w-64"
                />
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
                                <th className="px-4 py-2">Mã hợp đồng</th>
                                <th className="px-4 py-2">Khách hàng</th>
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
                                        <td className="px-4 py-3 align-top font-semibold">{c.code || '-'}</td>
                                        <td className="px-4 py-3 align-top">{c.customer?.name || c.customer_name || '-'}</td>
                                        <td className="px-4 py-3 align-top">{c.total_amount != null ? c.total_amount : '-'}</td>
                                        <td className="px-4 py-3 align-top">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</td>
                                        <td className="px-4 py-3 align-top">
                                            <a
                                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                                href={c ? c.signed_file_url : c.proposal_file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                >
                                                Xem
                                                </a>
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