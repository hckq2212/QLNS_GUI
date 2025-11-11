
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePartnerMutation } from '../../services/partner';
import { toast } from 'react-toastify';

export default function CreatePartner() {
	const navigate = useNavigate();
	const [createPartner, { isLoading }] = useCreatePartnerMutation();

	const [form, setForm] = useState({
		name: '',
		code: '',
		contact_name: '',
		phone: '',
		email: '',
		address: '',
		description: '',
	});

	function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

	async function handleSubmit(e) {
		e.preventDefault();
		if (!form.name) {
			toast.error('Vui lòng nhập tên đối tác');
			return;
		}

		try {
			await createPartner(form).unwrap();
			toast.success('Tạo đối tác thành công');
			navigate('/partner');
		} catch (err) {
			console.error('create partner failed', err);
			toast.error(err?.data?.message || err?.message || 'Tạo thất bại');
		}
	}

	return (
		<div className="p-6 max-w-3xl mx-auto">
			<h2 className="text-lg font-semibold mb-4">Tạo Đối tác</h2>
			<form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
				<div>
					<label className="block text-sm font-medium text-gray-700">Tên</label>
					<input value={form.name} onChange={(e) => update('name', e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700">Mã (code)</label>
					<input value={form.code} onChange={(e) => update('code', e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">Người liên hệ</label>
						<input value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">Điện thoại</label>
						<input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700">Email</label>
					<input value={form.email} onChange={(e) => update('email', e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
					<input value={form.address} onChange={(e) => update('address', e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700">Mô tả</label>
					<textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" rows={4} />
				</div>

				<div className="flex gap-2 justify-end">
					<button type="button" onClick={() => navigate('/partner')} className="px-4 py-2 rounded border">Hủy</button>
					<button type="submit" disabled={isLoading} className="px-4 py-2 rounded bg-blue-600 text-white">{isLoading ? 'Đang tạo...' : 'Tạo'}</button>
				</div>
			</form>
		</div>
	);
}
