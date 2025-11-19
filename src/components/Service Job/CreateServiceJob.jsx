import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetServicesQuery } from '../../services/service';
import { useCreateServiceJobMutation } from '../../services/serviceJob';
import { useGetPartnersQuery } from '../../services/partner';
import { formatPrice } from '../../utils/FormatValue';
import { toast } from 'react-toastify';
import { SERVICE_JOB_LABELS } from '../../utils/enums';
import { PARTNER_TYPE } from '../../utils/enums';


export default function CreateServiceJob() {
  const navigate = useNavigate();
  const { data: servicesData = [], isLoading: loadingServices } = useGetServicesQuery();
  const [createServiceJob, { isLoading: creating }] = useCreateServiceJobMutation();

  const rows = Array.isArray(servicesData) ? servicesData : (servicesData?.items || []);

  const [form, setForm] = useState({
    name: '',
    base_cost: '',
    owner_type: 'user',
    description: '',
  });

  useEffect(() => {
    // If a service is preselected, try to populate base_cost
    if (form.service_id) {
      const s = rows.find((r) => String(r.id) === String(form.service_id) || String(r._id) === String(form.service_id) || String(r.service_id) === String(form.service_id));
      if (s && (form.base_cost === '' || form.base_cost === undefined)) {
        setForm((f) => ({ ...f, base_cost: s.base_cost ?? s.baseCost ?? s.price ?? '' }));
      }
    }
  }, [form.service_id, rows]);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // basic validation
    if (!form.name || !form.service_id) {
      toast.error('Vui lòng nhập tên và chọn dịch vụ.');
      return;
    }

    const payload = {
      name: form.name,
      service_id: form.service_id,
      base_cost: form.base_cost !== '' ? Number(form.base_cost) : undefined,
      owner_type: form.owner_type || undefined,
      description: form.description || undefined,
    };

    try {
      await createServiceJob(payload).unwrap();
      toast.success('Tạo công việc cho dịch vụ thành công');
      navigate('/service-job');
    } catch (err) {
      console.error('create failed', err);
      toast.error(err?.data?.message || err?.message || 'Tạo thất bại');
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold mb-4 text-blue-600">Tạo hạng mục dịch vụ</h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow text-left">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tên</label>
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="Tên công việc"
          />
        </div>

      

        <div>
          <label className="block text-sm font-medium text-gray-700">Giá vốn</label>
          <input
            value={form.base_cost}
            onChange={(e) => update('base_cost', e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="VND"
            type="number"
            step="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bên phụ trách</label>
          <select
            value={form.owner_type}
            onChange={(e) => update('owner_type', e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
          >
            {Object.keys(SERVICE_JOB_LABELS).map((k) => (
              <option key={k} value={k}>{SERVICE_JOB_LABELS[k]}</option>
            ))}
          </select>
        </div>

        {/* Partner type + selector: show when owner_type indicates partner/parter */}
        {(form.owner_type === 'parter' || form.owner_type === 'partner') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Loại đối tác</label>
              <select value={form.partner_type} onChange={(e) => update('partner_type', e.target.value)} className="mt-1 block w-full border rounded px-3 py-2">
                <option value="">-- Chọn loại đối tác --</option>
                {Object.keys(PARTNER_TYPE).map((k) => (
                  <option key={k} value={k}>{PARTNER_TYPE[k]}</option>
                ))}
              </select>
            </div>

          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
            rows={4}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => navigate('/service-job')} className="px-4 py-2 rounded border">Hủy</button>
          <button type="submit" disabled={creating} className="px-4 py-2 rounded bg-blue-600 text-white">{creating ? 'Đang tạo...' : 'Tạo'}</button>
        </div>
      </form>
    </div>
  );
}
