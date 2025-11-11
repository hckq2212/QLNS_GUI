
import React from 'react';
import { Link } from 'react-router-dom';
import { useGetServicesQuery } from '../../services/service';
import { formatPrice } from '../../utils/FormatValue';

export default function ServiceList() {
	const { data: servicesData, isLoading, isError, error, refetch } = useGetServicesQuery();

	const rows = Array.isArray(servicesData) ? servicesData : (servicesData?.items || []);

	if (isLoading) return <div className="p-6">Đang tải danh sách dịch vụ...</div>;
	if (isError) return <div className="p-6 text-red-600">Lỗi: {error?.message || 'Failed to load services'}</div>;

	return (
		<div className="p-6 max-w-7xl mx-auto">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold">Danh sách Dịch vụ</h2>
				<Link to="/service/create" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Tạo dịch vụ</Link>
			</div>

			{rows.length === 0 ? (
				<div className="text-sm text-gray-600">Không có dịch vụ</div>
			) : (
				<div className="overflow-x-auto bg-white rounded shadow text-left">
					<table className="min-w-full text-sm">
						<thead className="bg-[#e7f1fd] text-left">
							<tr>
								<th className="px-4 py-3 text-blue-700">Tên</th>
								<th className="px-4 py-3 text-blue-700">Giá vốn</th>
								<th className="px-4 py-3 text-blue-700">Mô tả</th>
								<th className="px-4 py-3 text-blue-700">Hành động</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((s) => (
								<tr key={s.id || s._id} className="border-t hover:bg-gray-50">
									<td className="px-4 py-3 align-top">{s.name || s.service_name || s.title || `#${s.id || s._id}`}</td>
									<td className="px-4 py-3 align-top">{formatPrice(s.base_cost ?? s.baseCost ?? s.price ?? s.cost ?? 0)}</td>
									<td className="px-4 py-3 align-top">{s.description || s.desc || '—'}</td>
									<td className="px-4 py-3 align-top">
										<div className="flex gap-2">
											<Link to={`/service/${s.id || s._id}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Xem</Link>
											<Link to={`/service/${s.id || s._id}/edit`} className="px-2 py-1 rounded bg-yellow-600 text-white text-xs">Sửa</Link>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
