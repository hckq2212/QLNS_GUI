import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCreateServiceMutation } from '../../services/service';
import { useCreateServiceCriteriaMutation } from '../../services/serviceCriteria';

export default function CreateService() {
  const navigate = useNavigate();
  const [createService, { isLoading }] = useCreateServiceMutation();
  const [createServiceCriteria, { isLoading: isCreatingCriteria }] = useCreateServiceCriteriaMutation();

  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  // criteria list: user can add multiple criteria (name + description)
  const [criteria, setCriteria] = useState([
    { name: '', description: '' },
  ]);

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
      const created = await createService(payload).unwrap();
      toast.success('Tạo dịch vụ thành công');

      // create criteria (if any valid ones provided)
      const serviceId = created?.id;
      if (!serviceId) {
        toast.warn('Dịch vụ được tạo nhưng không có id trả về — bỏ qua tạo tiêu chí');
        navigate('/service');
        return;
      }

      // filter criteria with non-empty name
      const toCreate = criteria.filter((c) => c?.name && c.name.trim());
      if (toCreate.length > 0) {
        // create each criterion; use Promise.allSettled to allow partial success
        const createPromises = toCreate.map((c) =>
          createServiceCriteria({ service_id: serviceId, name: c.name.trim(), description: c.description || undefined }).unwrap(),
        );

        const settled = await Promise.allSettled(createPromises);
        const successes = settled.filter((s) => s.status === 'fulfilled').length;
        const failures = settled.length - successes;
        if (failures > 0) {
          toast.error(`${failures} tiêu chí tạo thất bại — kiểm tra lại`);
        }
      }

      navigate('/service');
    } catch (err) {
      console.error('Error creating service', err);
      const msg = err?.data?.error || err?.message || 'Tạo thất bại';
      toast.error(msg);
    }
  };

  const updateCriterion = (idx, key, value) =>
    setCriteria((s) => s.map((c, i) => (i === idx ? { ...c, [key]: value } : c)));

  const addCriterion = () => setCriteria((s) => [...s, { name: '', description: '' }]);

  const removeCriterion = (idx) => setCriteria((s) => s.filter((_, i) => i !== idx));

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
          <label className="text-sm text-gray-600">Tiêu chí đánh giá</label>
          <div className="mt-2 space-y-3">
            {criteria.map((c, idx) => (
              <div key={idx} className="border rounded p-3">
                <div>
                  <input
                    className="w-full border rounded p-2"
                    placeholder="Tên tiêu chí"
                    value={c.name}
                    onChange={(e) => updateCriterion(idx, 'name', e.target.value)}
                  />
                </div>
                <div className="mt-2">
                  <textarea
                    className="w-full border rounded p-2"
                    placeholder="Mô tả (tuỳ chọn)"
                    value={c.description}
                    onChange={(e) => updateCriterion(idx, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeCriterion(idx)}
                    className="text-sm text-red-600"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}

            <div>
              <button
                type="button"
                onClick={addCriterion}
                className="text-sm text-blue-600"
              >
                + Thêm tiêu chí
              </button>
            </div>
          </div>
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
            disabled={isLoading || isCreatingCriteria}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {isLoading || isCreatingCriteria ? 'Đang tạo...' : 'Tạo dịch vụ'}
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
