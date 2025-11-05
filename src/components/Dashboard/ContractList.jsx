import React, { useMemo, useState } from 'react';
import { useGetAllContractsQuery, useGetProposalContractUrlQuery, useGetSignedContractUrlQuery } from '../../services/contract';
import { useGetAllCustomerQuery } from '../../services/customer';
import { formatPrice } from '../../utils/FormatValue.js';
import { CONTRACT_STATUS_LABELS } from '../../utils/enums';

export default function ContractList() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data: contractsData, isLoading, isError, error } = useGetAllContractsQuery();
    const { data: customersData = [] } = useGetAllCustomerQuery();

    const list = Array.isArray(contractsData) ? contractsData : Array.isArray(contractsData?.items) ? contractsData.items : [];

    const customersById = useMemo(() => {
        if (!Array.isArray(customersData)) return {};
        return customersData.reduce((acc, c) => {
            if (c && c.id) acc[c.id] = c;
            return acc;
        }, {});
    }, [customersData]);

    const enriched = useMemo(() => {
        return list.map((c) => ({
            ...c,
            customer: c.customer || (c.customer_id ? { id: c.customer_id, name: customersById[c.customer_id]?.name || c.customer_name || null } : c.customer),
        }));
    }, [list, customersById]);

    const filtered = useMemo(() => {
        const q = (search || '').trim().toLowerCase();
        if (!q) return enriched;
        return enriched.filter((c) => {
            return (
                String(c.id || '').includes(q) ||
                (c.code || '').toLowerCase().includes(q) ||
                (c.customer?.name || '').toLowerCase().includes(q)
            );
        });
    }, [enriched, search]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

    React.useEffect(() => setPage(1), [search]);

    function ContractRow({ c }) {
    const { data: proposalUrl, isLoading: proposalLoading } = useGetProposalContractUrlQuery(c.id, { skip: !c.id });
    const { data: signedUrl, isLoading: signedLoading } = useGetSignedContractUrlQuery(c.id, { skip: !c.id });

    const proposalHref = proposalUrl || c.proposal_file_url || null;
    const signedHref = signedUrl || c.signed_file_url || null;

        return (
            <tr key={c.id} className="border-t">
                <td className="px-4 py-3 align-top font-semibold">{c.code || '-'}</td>
                <td className="px-4 py-3 align-top">{c.customer?.name || c.customer_name || '-'}</td>
                <td className="px-4 py-3 align-top">{formatPrice((c.total_cost)) || '-'} đ</td>
                <td className="px-4 py-3 align-top">{formatPrice((c.total_revenue)) || '-'} đ</td>
                <td className="px-4 py-3 align-top">{CONTRACT_STATUS_LABELS[c.status] || c.status || '-'}</td>
                <td className="px-4 py-3 align-top">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3 align-top grid grid-cols-2 gap-2">
                    {proposalLoading ? (
                        <div className="text-sm text-gray-500 px-3 py-2">Đang tải...</div>
                    ) : proposalHref ? (
                        <a
                            className="bg-[#04247C] text-white px-3 py-2 rounded text-sm"
                            href={proposalHref}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Xem hợp đồng mẫu
                        </a>
                    ) : (
                        <button className="bg-gray-200 text-gray-500 px-3 py-2 rounded text-sm" disabled>Không có mẫu</button>
                    )}

                    {signedLoading ? (
                        <div className="text-sm text-gray-500 px-3 py-2">Đang tải...</div>
                    ) : signedHref ? (
                        <a
                            className="bg-blue-600 text-white px-3 py-2 rounded text-sm"
                            href={signedHref}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Xem hợp đồng đã ký
                        </a>
                    ) : (
                        <button className="bg-gray-200 text-gray-500 px-3 py-2 rounded text-sm" disabled>Chưa ký</button>
                    )}
                </td>
            </tr>
        );
    }

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

            {isLoading ? (
                <div className="text-sm text-gray-500">Đang tải...</div>
            ) : isError ? (
                <div className="text-sm text-red-600">{String(error?.data || error?.message || error)}</div>
            ) : (
                <div className="overflow-x-auto bg-white rounded border">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2">Mã hợp đồng</th>
                                <th className="px-4 py-2">Khách hàng</th>
                                <th className="px-4 py-2">Giá vốn</th>
                                <th className="px-4 py-2">Giá bán</th>
                                <th className="px-4 py-2">Trạng thái</th>
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
                                    <ContractRow key={c.id} c={c} />
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