import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetServicesQuery } from '../../services/service';
import { useCreateServiceJobMutation } from '../../services/serviceJob';
import { useGetPartnersQuery } from '../../services/partner';
import { formatPrice } from '../../utils/FormatValue';
import { toast } from 'react-toastify';
import { SERVICE_JOB_LABELS } from '../../utils/enums';

function PartnerSelector({ value, onChange }) {
  // simple selector component using partners RTK query
  const { data: partnersData = [], isLoading, isError } = useGetPartnersQuery();
  const list = Array.isArray(partnersData) ? partnersData : (partnersData?.items || []);

  if (isLoading) return <div className="text-sm text-gray-600 mt-2">Đang tải danh sách đối tác...</div>;
  if (isError) return (
    <div className="mt-2">
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Nhập partner id" className="mt-1 block w-full border rounded px-3 py-2" />
      <p className="text-sm text-gray-500 mt-1">Không thể tải danh sách đối tác — bạn có thể nhập ID đối tác thủ công hoặc thử lại sau.</p>
    </div>
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Chọn đối tác</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2">
        <option value="">-- Chọn đối tác --</option>
        {list.map((p) => (
          <option key={p.id || p._id} value={p.id || p._id}>{p.name || p.title || `#${p.id || p._id}`}</option>
        ))}
      </select>
    </div>
  );
}

export default function CreateServiceJob() {
  const navigate = useNavigate();
  const { data: servicesData = [], isLoading: loadingServices } = useGetServicesQuery();
  const [createServiceJob, { isLoading: creating }] = useCreateServiceJobMutation();

  const rows = Array.isArray(servicesData) ? servicesData : (servicesData?.items || []);

  const [form, setForm] = useState({
    name: '',
    service_id: '',
    base_cost: '',
    owner_type: 'user',
    partner_id: '',
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
      partner_id: form.partner_id || undefined,
      description: form.description || undefined,
    };

    try {
      await createServiceJob(payload).unwrap();
      toast.success('Tạo Service Job thành công');
      navigate('/service-job');
    } catch (err) {
      console.error('create failed', err);
      toast.error(err?.data?.message || err?.message || 'Tạo thất bại');
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Tạo Service Job</h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tên</label>
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="Tên công việc / service job"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dịch vụ</label>
          <select
            value={form.service_id}
            onChange={(e) => update('service_id', e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
          >
            <option value="">-- Chọn dịch vụ --</option>
            {rows.map((s) => (
              <option key={s.id || s._id} value={s.id || s._id}>{`${s.code || s.service_code || ''} ${s.name || s.service_name || ''}`.trim()}</option>
            ))}
          </select>
          {form.service_id && (
            <p className="mt-2 text-sm text-gray-600">Giá vốn dịch vụ: {formatPrice((rows.find(r => String(r.id) === String(form.service_id) || String(r._id) === String(form.service_id))?.base_cost) ?? 0)}</p>
          )}
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

        {/* Partner selector: show when owner_type indicates partner/parter */}
        {(form.owner_type === 'parter' || form.owner_type === 'partner') && (
          <PartnerSelector value={form.partner_id} onChange={(v) => update('partner_id', v)} />
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
