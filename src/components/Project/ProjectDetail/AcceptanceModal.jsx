import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { formatDate } from '../../../utils/FormatValue';
import { useCreateAcceptanceDraftMutation } from '../../../services/acceptance';

export default function AcceptanceModal({ 
  open, 
  onClose, 
  jobs = [], 
  projectId, 
  contractId,
  onSuccess 
}) {
  const [selectedJobsForAcceptance, setSelectedJobsForAcceptance] = useState([]);
  const [createAcceptanceDraft, { isLoading: creatingAcceptance }] = useCreateAcceptanceDraftMutation();

  if (!open) return null;

  const waitingJobs = (jobs || []).filter(j => j.status === 'waiting_acceptance');

  const handleSubmit = async () => {
    if (selectedJobsForAcceptance.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một công việc');
      return;
    }

    try {
      const payload = {
        project_id: projectId,
        contract_id: contractId,
        job_ids: selectedJobsForAcceptance,
      };
      await createAcceptanceDraft(payload).unwrap();
      toast.success('Đã tạo biên bản nghiệm thu');
      setSelectedJobsForAcceptance([]);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Create acceptance failed', err);
      toast.error(err?.data?.message || err?.message || 'Tạo biên bản nghiệm thu thất bại');
    }
  };

  const handleClose = () => {
    setSelectedJobsForAcceptance([]);
    onClose();
  };

  const toggleJobSelection = (jobId) => {
    if (selectedJobsForAcceptance.includes(jobId)) {
      setSelectedJobsForAcceptance(selectedJobsForAcceptance.filter(id => id !== jobId));
    } else {
      setSelectedJobsForAcceptance([...selectedJobsForAcceptance, jobId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-blue-700 mb-4">Chọn công việc nghiệm thu</h3>
          <hr className="mb-4" />
          
          {waitingJobs.length === 0 ? (
            <div className="text-gray-600 p-4">Không có công việc nào đang chờ nghiệm thu</div>
          ) : (
            <div className="space-y-3 mb-6">
              {waitingJobs.map(job => (
                <label 
                  key={job.id} 
                  className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedJobsForAcceptance.includes(job.id)}
                    onChange={() => toggleJobSelection(job.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {job.name || job.title || `#${job.id}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      Deadline: {formatDate(job.deadline) || '—'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-50"
              disabled={creatingAcceptance}
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={creatingAcceptance || selectedJobsForAcceptance.length === 0}
            >
              {creatingAcceptance ? 'Đang tạo...' : 'Xác nhận nghiệm thu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
