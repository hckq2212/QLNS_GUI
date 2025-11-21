import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import jobAPI from '../../api/job';
import { useGetPartnerServiceJobsByServiceJobQuery } from '../../services/partnerServiceJob';
import { formatPrice } from '../../utils/FormatValue';
import { JOB_PRIORITY_OPTIONS } from '../../utils/enums';
import { toast } from 'react-toastify';

export default function AssignJobPartnerModal({ open, onClose, job, onAssigned }) {
  const [selectedMappingId, setSelectedMappingId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(JOB_PRIORITY_OPTIONS[1]?.value);
  const [files, setFiles] = useState([]);
  const [partnerPrice, setPartnerPrice] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedMappingId('');
    setSubmitting(false);
    setStartDate('');
    setPriority(JOB_PRIORITY_OPTIONS[1]?.value);
    setDeadline('');
    setDescription('');
    setFiles([]);
    setPartnerPrice('');
  }, [open, job]);

  const serviceJobId = job?.service_job_id ?? job?.service_job?.id ?? job?.service_job_id;
  const { data: mappings = [], isLoading } = useGetPartnerServiceJobsByServiceJobQuery(serviceJobId, { skip: !serviceJobId });

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!job || !job.id) return toast.error('Không xác định được công việc');
    if (!selectedMappingId) return toast.error('Vui lòng chọn nhà cung cấp');

    const mapping = (mappings || []).find((m) => String(m.id || m._id || m.partner_service_job_id) === String(selectedMappingId));
    if (!mapping) return toast.error('Không tìm thấy mapping đã chọn');

    const partnerId = mapping.partner_id ?? mapping.partner?.id ?? mapping.partner?.partner_id;
    const mappingId = mapping.id ?? mapping._id ?? mapping.partner_service_job_id;
    const mappingDefaultPrice = mapping.base_cost ?? mapping.price ?? 0;
    const price = (partnerPrice !== '' && partnerPrice !== null) ? Number(partnerPrice) : mappingDefaultPrice;

    setSubmitting(true);
    try {
      const payload = {
        assigned_type: 'partner',
        assigned_id: partnerId,
        partner_service_job_id: mappingId,
        partner_price: price,
        priority: priority || null,
        description: description || null,
        start_date: startDate || null,
        deadline: deadline || null,
      };

      // send multipart if files provided
      if (files && files.length > 0) {
        const form = new FormData();
        Object.entries(payload).forEach(([k, v]) => { if (v !== undefined && v !== null) form.append(k, v); });
        files.forEach((f) => form.append('files', f, f.name));
        await jobAPI.assign(job.id, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await jobAPI.assign(job.id, payload);
      }
      toast.success('Phân công cho đối tác thành công');
      if (onAssigned) await onAssigned();
      onClose && onClose();
    } catch (err) {
      console.error('Assign job to partner failed', err);
      toast.error(err?.response?.data?.error || err?.message || 'Phân công thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFiles = (e) => {
    const f = e.target.files ? Array.from(e.target.files) : [];
    setFiles(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow-lg w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Phân công cho đối tác</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-sm">Nhà cung cấp</label>
              {isLoading ? (
                <div className="text-sm text-gray-500">Đang tải danh sách nhà cung cấp...</div>
              ) : (
                <select
                  value={selectedMappingId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedMappingId(val);
                    const m = (mappings || []).find((mm) => String(mm.id ?? mm._id ?? mm.partner_service_job_id) === String(val));
                    const defaultPrice = m ? (m.base_cost ?? m.price ?? '') : '';
                    setPartnerPrice(defaultPrice === null ? '' : defaultPrice);
                  }}
                  className="w-full border px-2 py-1 rounded"
                >
                  <option value="">Chọn đối tác</option>
                  {(mappings || []).map((m) => {
                    const mid = m.id ?? m._id ?? m.partner_service_job_id;
                    const partner = m.partner || m.partner_id ? (m.partner || { id: m.partner_id, name: m.partner_name || m.partner?.name }) : null;
                    const label = partner?.name || `#${partner?.id || m.partner_id || '—'}`;
                    return (
                      <option key={mid} value={mid}>{label}</option>
                    );
                  })}
                </select>
              )}
            </div>
            <div>
              <label className="text-sm">Giá cung cấp</label>
              <input type="number" readOnly value={formatPrice(partnerPrice)} className="w-full border px-2 py-1 rounded" />
            </div>
            <div>
              <label className="text-sm">Độ ưu tiên</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border px-2 py-1 rounded">
                <option value="">--- Độ ưu tiên công việc ---</option>
                {JOB_PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm">Ngày bắt đầu</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border px-2 py-1 rounded" />
            </div>
            <div>
              <label className="text-sm">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full border px-2 py-1 rounded" />
            </div>

            <div>
              <label className="text-sm">Ghi chú (tùy chọn)</label>
              <textarea value={description}  onChange={(e) => setDescription(e.target.value)} className="w-full border px-2 py-1 rounded" placeholder="Ghi chú cho đối tác (nếu cần)" />
            </div>
            <div>
              <label className="text-sm">Tệp đính kèm</label>
              <input type="file" multiple onChange={handleFiles} className="w-full" />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => onClose && onClose()} className="px-3 py-1 rounded border">Hủy</button>
            <button type="submit" disabled={submitting} className="px-4 py-1 rounded bg-blue-600 text-white">
              {submitting ? 'Đang gửi...' : 'Phân công'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AssignJobPartnerModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  job: PropTypes.object,
  onAssigned: PropTypes.func,
};
