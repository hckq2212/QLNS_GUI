import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useRegisterMutation } from '../../services/auth';
import { useGetRolesQuery } from '../../services/role';

export default function CreateUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', phoneNumber: '', role_id: '' });
  const [register, { isLoading }] = useRegisterMutation();
  const { data: roles = [], isLoading: rolesLoading } = useGetRolesQuery();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        role_id: form.role_id || undefined,
      };
      await register(payload).unwrap();
      toast.success('Tạo tài khoản thành công');
      navigate('/user');
    } catch (err) {
      console.error('Register failed', err);
      const msg = err?.data?.error || err?.data?.message || err?.message || 'Tạo tài khoản thất bại';
      toast.error(msg);
    }
  }

  return (
    <div className="p-10 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-[40rem] bg-white rounded-lg p-8 shadow">
        <h2 className="text-2xl font-semibold mb-4">Tạo tài khoản</h2>
        <div className="grid gap-3">
          <input value={form.fullName} onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Họ và tên" className="border px-3 py-2 rounded" />
          <input value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Username" className="border px-3 py-2 rounded" />
          <input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Password" className="border px-3 py-2 rounded" />
          <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="border px-3 py-2 rounded" />
          <input type="text" value={form.phoneNumber} onChange={(e) => setForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="Số điện thoại" className="border px-3 py-2 rounded" />
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vai trò</label>
            <select
              value={form.role_id}
              onChange={(e) => setForm(f => ({ ...f, role_id: e.target.value }))}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">{rolesLoading ? 'Đang tải...' : 'Chọn vai trò'}</option>
              {Array.isArray(roles) && roles.map(r => (
                <option key={r.id} value={r.id}>{ r.code || r.name || r.id}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded">Tạo</button>
          </div>
        </div>
      </form>
    </div>
  );
}
