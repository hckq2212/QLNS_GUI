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
  contractServices = [],
  onSuccess 
}) {
  const [selectedJobsForAcceptance, setSelectedJobsForAcceptance] = useState([]);
  const [createAcceptanceDraft, { isLoading: creatingAcceptance }] = useCreateAcceptanceDraftMutation();

  if (!open) return null;

  // Extract result items from contract services where is_accepted is false
  const resultItems = [];
  (contractServices || []).forEach(service => {
      if (service.result && Array.isArray(service.result)) {
      service.result.forEach(item => {
        const status = item?.status;
        if (item && item.job_id && status && String(status).toLowerCase() === 'waiting_acceptance') {
          resultItems.push({
            ...item,
            serviceName: service.name || service.service_name,
          });
        }
      });
    }
  });

  const handleSubmit = async () => {
    if (selectedJobsForAcceptance.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một kết quả');
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
          <h3 className="text-xl font-semibold text-blue-700 mb-4">Chọn kết quả nghiệm thu</h3>
          <hr className="mb-4" />
          
          {resultItems.length === 0 ? (
            <div className="text-gray-600 p-4">Không có kết quả nào chờ nghiệm thu</div>
          ) : (
            <div className="space-y-3 mb-6">
              {resultItems.map((item, idx) => (
                <label 
                  key={`${item.job_id}-${idx}`} 
                  className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedJobsForAcceptance.includes(item.job_id)}
                    onChange={() => toggleJobSelection(item.job_id)}
                    className="mt-1"
                    disabled={String(item.status).toLowerCase() !== 'waiting_acceptance'}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {item.name || `#${item.job_id}`}
                    </div>
                    {item.serviceName && (
                      <div className="text-sm text-gray-500">
                        Dịch vụ: {item.serviceName}
                      </div>
                    )}
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
