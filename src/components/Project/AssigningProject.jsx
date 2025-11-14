
import React from 'react';
import { Link } from 'react-router-dom';
import { useGetProjectByStatusQuery, useAckProjectMutation } from '../../services/project';
import { useGetContractsByIdsQuery } from '../../services/contract';
import { useGetCustomerByIdQuery } from '../../services/customer';
import { toast } from 'react-toastify';
import { useGetAllTeamsQuery } from '../../services/team';
import { useGetPersonalInfoQuery } from '../../services/user';
import { PROJECT_STATUS_LABELS } from '../../utils/enums';

export default function AssigningProject() {
	const { data, isLoading, isError, error, refetch } = useGetProjectByStatusQuery('assigning');

	const projects = Array.isArray(data) ? data : (data?.items || []);

	// collect contract ids to fetch contracts in batch
	const contractIds = Array.from(new Set((projects || []).map((p) => p.contract_id).filter(Boolean)));
	const { data: contractsData = [] } = useGetContractsByIdsQuery(contractIds, { skip: contractIds.length === 0 });

	const contractById = React.useMemo(() => {
		const m = {};
		(Array.isArray(contractsData) ? contractsData : []).forEach((c) => { if (c && c.id) m[c.id] = c; });
		return m;
	}, [contractsData]);

	// fetch all teams to map lead_user_id
	const { data: teams = [] } = useGetAllTeamsQuery();
	const teamById = React.useMemo(() => {
		const m = {};
		(teams || []).forEach((t) => { if (t && (t.id || t.team_id)) m[t.id ?? t.team_id] = t; });
		return m;
	}, [teams]);

		// current user
		const { data: currentUser, isLoading: isUserLoading, isError: isUserError } = useGetPersonalInfoQuery();

		// fallback: parse user id from JWT accessToken stored in localStorage (if backend encodes userId there)
		function parseJwt(token) {
			if (!token) return null;
			try {
				const parts = token.split('.');
				if (parts.length < 2) return null;
				const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
				const decoded = atob(payload);
				// try to parse JSON payload
				return JSON.parse(decoded);
			} catch (e) {
				try {
					// atob may fail for unicode; try a more robust decode
					const parts = token.split('.');
					const payload = parts[1];
					const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
					const json = decodeURIComponent(Array.prototype.map.call(atob(base64), function(c) {
						return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
					}).join(''));
					return JSON.parse(json);
				} catch (e2) {
					return null;
				}
			}
		}

		const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
		const parsedToken = React.useMemo(() => parseJwt(accessToken), [accessToken]);
		const currentUserId = currentUser?.id ?? currentUser?.user_id ?? parsedToken?.userId ?? parsedToken?.id ?? parsedToken?.sub ?? null;

		// filter projects: only show projects assigned to a team where current user is the team's lead
		const visibleProjects = React.useMemo(() => {
			if (!currentUserId) return [];
			return (projects || []).filter((p) => {
				const teamId = p.team_id ?? p.team?.id ?? null;
				if (!teamId) return false;
				const team = teamById[teamId];
				return team && (team.lead_user_id === currentUserId || team.lead_user_id === currentUser?.user_id);
			});
		}, [projects, teamById, currentUserId, currentUser]);

	// debug: log team_id, team's lead_user_id and current user id
	React.useEffect(() => {
		try {
			console.log('AssigningProject debug - parsedToken:', parsedToken);
			console.log('AssigningProject debug - currentUserId (resolved):', currentUserId);
			(projects || []).forEach((p) => {
				const teamId = p.team_id ?? p.team?.id ?? null;
				const team = teamById[teamId];
				console.log('AssigningProject debug - projectId:', p.id, 'team_id:', teamId, 'team_lead_user_id:', team?.lead_user_id);
			});
		} catch (e) {
			console.error('AssigningProject debug error', e);
		}
	}, [projects, teamById, currentUserId, parsedToken]);

	const [ackProject, { isLoading: acking }] = useAckProjectMutation();

		if (isLoading) return <div className="p-6">Loading projects...</div>;
		if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load projects'}</div>;

		if (isUserLoading) return <div className="p-6">Loading user info...</div>;
		if (isUserError || currentUser == null) return (
			<div className="p-6 text-gray-600">
				Không tìm thấy thông tin người dùng. Vui lòng đăng nhập để xem dự án được phân cho team bạn.
				<div className="mt-3">
					<button onClick={() => refetch && refetch()} className="inline-flex px-3 py-1.5 bg-blue-600 text-white rounded text-sm">Làm mới</button>
				</div>
			</div>
		);

		if (!projects || projects.length === 0 || !visibleProjects || visibleProjects.length === 0) return (
			<div className="p-6">
				<div className="text-gray-600">Không có dự án </div>
			</div>
		);

	return (
		<div className="p-6  mx-auto text-left">
			<div className="flex items-center justify-center mb-4">
				<h3 className="text-lg font-semibold text-blue-600 ">Dự án đang phân team</h3>
			</div>

			<div className="bg-white rounded shadow overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-[#e7f1fd]">
							<th className="px-3 py-2 text-left text-blue-700">Tên dự án</th>
							<th className="px-3 py-2 text-left text-blue-700">Khách hàng</th>
							<th className="px-3 py-2 text-left text-blue-700">Hành động</th>
						</tr>
					</thead>
							<tbody>
								{visibleProjects.map((p) => {
							const contract = p.contract_id ? contractById[p.contract_id] : null;
							const contractCustomerId = contract?.customer_id || null;
							return (
								<tr key={p.id} className="border-t">
									<td className="px-3 py-2 align-top">{p.name || p.project_name || p.title || `#${p.id}`}</td>
									<td className="px-3 py-2 align-top">
										{p.customer?.name || (
											contractCustomerId
												? <CustomerName id={contractCustomerId} />
												: (p.customer_name || '-')
										)}
									</td>
									<td className="px-3 py-2 align-top">
										<div className="flex items-center gap-2">
											<Link to={`/project/${p.id}`} className="text-sm bg-blue-600 text-white px-2 py-1 rounded ">Xem chi tiết</Link>
											<button
												type="button"
												onClick={async () => {
													try {
														await ackProject(p.id).unwrap();
														toast.success('Dự án đã được chấp nhận');
														try { refetch && refetch(); } catch (e) {}
													} catch (err) {
														console.error('ack project failed', err);
														toast.error(err?.data?.message || err?.message || 'Chấp nhận dự án thất bại');
													}
												}}
												disabled={acking}
												className="text-sm bg-green-600 text-white px-2 py-1 rounded"
											>
												{acking ? 'Đang...' : 'Chấp nhận'}
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}


	function CustomerName({ id }) {
	  const { data: customer } = useGetCustomerByIdQuery(id, { skip: !id });
	  if (!id) return null;
	  if (!customer) return <span>Đang tải...</span>;
	  return <span>{customer.name || customer.customer_name || `#${customer.id}`}</span>;
	}
