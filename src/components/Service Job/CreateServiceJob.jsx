import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetServicesQuery } from '../../services/service';
import { useCreateServiceJobMutation } from '../../services/serviceJob';
import { useGetPartnersQuery } from '../../services/partner';
import { useCreateCriteriaMutation } from '../../services/serviceJobCriteria';
import { formatPrice } from '../../utils/FormatValue';
import { toast } from 'react-toastify';
import { SERVICE_JOB_LABELS } from '../../utils/enums';
import { PARTNER_TYPE } from '../../utils/enums';


export default function CreateServiceJob() {
  const navigate = useNavigate();
  const { data: servicesData = [], isLoading: loadingServices } = useGetServicesQuery();
  const [createServiceJob, { isLoading: creating }] = useCreateServiceJobMutation();
  const [createCriteria, { isLoading: isCreatingCriteria }] = useCreateCriteriaMutation();

  const rows = Array.isArray(servicesData) ? servicesData : (servicesData?.items || []);

  const [form, setForm] = useState({
    name: '',
    base_cost: '',
    owner_type: 'user',
    description: '',
  });

  const [criteria, setCriteria] = useState([
    { name: '', description: '' },
  ]);

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

  const updateCriterion = (idx, key, value) =>
    setCriteria((s) => s.map((c, i) => (i === idx ? { ...c, [key]: value } : c)));

  const addCriterion = () => setCriteria((s) => [...s, { name: '', description: '' }]);

  const removeCriterion = (idx) => setCriteria((s) => s.filter((_, i) => i !== idx));

  async function handleSubmit(e) {
    e.preventDefault();
    // basic validation
    if (!form.name ) {
      toast.error('Vui lòng nhập tên hạng mục dịch vụ.');
      return;
    }

    const payload = {
      name: form.name,
      base_cost: form.base_cost !== '' ? Number(form.base_cost) : undefined,
      owner_type: form.owner_type || undefined,
      description: form.description || undefined,
    };

    try {
      const created = await createServiceJob(payload).unwrap();
      toast.success('Tạo công việc cho dịch vụ thành công');

      // create criteria (if any valid ones provided)
      const serviceJobId = created?.id || created?._id || created?.service_job_id;
      if (!serviceJobId) {
        toast.warn('Công việc được tạo nhưng không có id trả về — bỏ qua tạo tiêu chí');
        navigate('/service-job');
        return;
      }

      // filter criteria with non-empty name
      const toCreate = criteria.filter((c) => c?.name && c.name.trim());
      if (toCreate.length > 0) {
        // create each criterion; use Promise.allSettled to allow partial success
        const createPromises = toCreate.map((c) =>
          createCriteria({
            service_job_id: serviceJobId,
            name: c.name.trim(),
            description: c.description || undefined
          }).unwrap(),
        );

        const settled = await Promise.allSettled(createPromises);
        const successes = settled.filter((s) => s.status === 'fulfilled').length;
        const failures = settled.length - successes;
        if (failures > 0) {
          toast.error(`${failures} tiêu chí tạo thất bại — kiểm tra lại`);
        }
      }

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
          <label className="block text-sm font-medium text-gray-700">Tiêu chí đánh giá</label>
          <div className="mt-2 space-y-3">
            {criteria.map((c, idx) => (
              <div key={idx} className="border rounded p-3 bg-gray-50">
                <div className="gap-2 flex justify-end">
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Tên tiêu chí"
                    value={c.name}
                    onChange={(e) => updateCriterion(idx, 'name', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeCriterion(idx)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Xóa
                  </button>
                </div>
                {/* <div className="mt-2">
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    placeholder="Mô tả (tuỳ chọn)"
                    value={c.description}
                    onChange={(e) => updateCriterion(idx, 'description', e.target.value)}
                    rows={2}
                  />
                </div> */}
                <div className="mt-2 flex justify-end">
                  
                </div>
              </div>
            ))}

            <div>
              <button
                type="button"
                onClick={addCriterion}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Thêm tiêu chí
              </button>
            </div>
          </div>
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
          <button type="submit" disabled={creating || isCreatingCriteria} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60">{creating || isCreatingCriteria ? 'Đang tạo...' : 'Tạo'}</button>
        </div>
      </form>
    </div>
  );
}
