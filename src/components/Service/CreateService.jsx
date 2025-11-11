import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCreateServiceMutation } from '../../services/service';

export default function CreateService() {
  const navigate = useNavigate();
  const [createService, { isLoading }] = useCreateServiceMutation();

  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Tên dịch vụ là bắt buộc');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description || undefined,
    };

    try {
      await createService(payload).unwrap();
      toast.success('Tạo dịch vụ thành công');
      navigate('/service');
    } catch (err) {
      console.error('Error creating service', err);
      const msg = err?.data?.error || err?.message || 'Tạo thất bại';
      toast.error(msg);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded shadow">
      <h2 className="text-lg font-semibold text-blue-700 mb-4">Tạo dịch vụ mới</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="text-sm text-gray-600">Tên dịch vụ</label>
          <input
            className="mt-1 w-full border rounded p-2"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Mô tả</label>
          <textarea
            className="mt-1 w-full border rounded p-2"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {isLoading ? 'Đang tạo...' : 'Tạo dịch vụ'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-200 px-4 py-2 rounded"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
