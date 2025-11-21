import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import jobAPI from '../../api/job';
import { useGetTeamMembersQuery } from '../../services/team';
import { useGetUserByIdQuery } from '../../services/user';
import { JOB_PRIORITY_OPTIONS } from '../../utils/enums';
import { toast } from 'react-toastify';

export default function AssignJobModal({ open, onClose, job, onAssigned, teamId }) {
  const [assignedId, setAssignedId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    // prefill from job if available
    setAssignedId(job?.assigned_id ?? '');
    setPriority(job?.priority ?? '');
    setStartDate('');
    setDeadline('');
    setDescription('');
    setFiles([]);
  }, [open, job]);

  const { data: members = [], isLoading: membersLoading } = useGetTeamMembersQuery(teamId, { skip: !teamId });

  if (!open) return null;

  const handleFiles = (e) => {
    const f = e.target.files ? Array.from(e.target.files) : [];
    setFiles(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!job || !job.id) return toast.error('Không xác định được công việc');
    if (!assignedId) return toast.error('Vui lòng chọn người thực hiện');
    if (!startDate) return toast.error('Vui lòng chọn ngày bắt đầu');
    if (!deadline) return toast.error('Vui lòng chọn deadline');

    setSubmitting(true);
    try {
      let payload = {
        assigned_id: assignedId,
        description: description || null,
        start_date: startDate,
        deadline,
        priority: priority
      };

      // if files present, send multipart/form-data
      if (files && files.length > 0) {
        const form = new FormData();
        Object.entries(payload).forEach(([k, v]) => { if (v !== undefined && v !== null) form.append(k, v); });
        files.forEach((f) => form.append('files', f, f.name));
        await jobAPI.assign(job.id, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await jobAPI.assign(job.id, payload);
      }

      toast.success('Phân công thành công');
      if (onAssigned) await onAssigned();
      onClose && onClose();
    } catch (err) {
      console.error('Assign job failed', err);
      toast.error(err?.response?.data?.error || err?.message || 'Phân công thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow-lg w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Phân công công việc</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-sm">Người thực hiện</label>
              {membersLoading ? (
                <div className="text-sm text-gray-500">Đang tải thành viên...</div>
              ) : (
                <select value={assignedId} onChange={(e) => setAssignedId(e.target.value)} className="w-full border px-2 py-1 rounded">
                  <option value="">Chọn thành viên</option>
                  {(members || []).map((m) => {
                    const userId = m.user_id ?? m.id;
                    return <MemberOption key={userId} userId={userId} value={userId} />;
                  })}
                </select>
              )}
            </div>
            <div>
              <label className="text-sm">Ngày bắt đầu</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border px-2 py-1 rounded" />
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
              <label className="text-sm">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full border px-2 py-1 rounded" />
            </div>
            <div>
              <label className="text-sm">Mô tả</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border px-2 py-1 rounded" />
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

AssignJobModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  job: PropTypes.object,
  onAssigned: PropTypes.func,
};


function MemberOption({ userId, value }) {
  const { data: user, isLoading } = useGetUserByIdQuery(userId, { skip: !userId });
  const label = isLoading
    ? `#${userId} (đang tải...)`
    : user?.full_name || user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.user_name || user?.username || `#${userId}`;

  return <option value={value}>{label}</option>;
}

MemberOption.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
