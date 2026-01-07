import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAcceptanceByIdQuery, useApproveAcceptanceByBODMutation, useRejectAcceptanceByBODMutation } from '../../services/acceptance';
import { formatDate } from '../../utils/FormatValue';
import { ACCEPTANCE_STATUS_LABELS } from '../../utils/enums';
import { toast } from 'react-toastify';

function ResultsList({ results = [] }) {
  if (!results || results.length === 0) return <div className="text-gray-600">Không có kết quả</div>;
  return (
    <div className="flex flex-wrap gap-2">
      {results.map((r, idx) => {
        const evidenceUrl = r.evidence && r.evidence.length > 0 ? r.evidence[0].url : null;
        return evidenceUrl ? (
          <a
            key={`${r.job_id ?? idx}`}
            href={evidenceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm hover:bg-orange-200"
          >
            {r.name || `Job #${r.job_id}`}
          </a>
        ) : (
          <span
            key={`${r.job_id ?? idx}`}
            className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
          >
            {r.name || `Job #${r.job_id}`} (Không có link)
          </span>
        );
      })}
    </div>
  );
}

export default function AcceptanceDetail({ id: propId } = {}) {
  const { id: routeId } = useParams();
  const id = propId || routeId;
  const navigate = useNavigate();

  const { data: acceptance, isLoading, isError, error, refetch } = useGetAcceptanceByIdQuery(id, { skip: !id });
  const acc = acceptance?.data || acceptance || null;
  const [approve, { isLoading: approving }] = useApproveAcceptanceByBODMutation();
  const [reject, { isLoading: rejecting }] = useRejectAcceptanceByBODMutation();

  const [rejectComment, setRejectComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [localResults, setLocalResults] = useState([]);
  const [overallComment, setOverallComment] = useState('');
  const [selectedForApprove, setSelectedForApprove] = useState([]);
  const [selectAllForApprove, setSelectAllForApprove] = useState(false);

  useEffect(() => {
    if (acc) {
      const resultList = acc.result || acc.jobs || [];
      setLocalResults(resultList);
      setOverallComment(acc.comment || '');
      // start with no items selected for approve
      setSelectedForApprove([]);
    }
  }, [acc]);

  if (!id) return <div className="p-6">No acceptance id provided</div>;
  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load acceptance'}</div>;
  if (!acc) return <div className="p-6 text-gray-600">Acceptance not found</div>;

  const resultList = acc.result || acc.jobs || [];
  const allAccepted = localResults.length > 0 && localResults.every(r => r.status && r.status !== 'waiting_acceptance');
  const waitingCount = (localResults || []).filter(r => r.status === 'waiting_acceptance').length;
  const canShowApproverControls = acc.status === 'submitted_bod' || waitingCount > 0;

  function toggleSelectForApprove(jobId) {
    if (selectedForApprove.includes(jobId)) {
      setSelectedForApprove(selectedForApprove.filter(id => id !== jobId));
    } else {
      setSelectedForApprove([...selectedForApprove, jobId]);
    }
  }

  function toggleSelectAllForApprove() {
    if (selectAllForApprove) {
      setSelectedForApprove([]);
      setSelectAllForApprove(false);
    } else {
      const ids = (localResults || []).filter(r => r.status === 'waiting_acceptance').map(r => r.job_id).filter(Boolean);
      setSelectedForApprove(ids);
      setSelectAllForApprove(true);
    }
  }

  const handleApproveSelected = async () => {
    if (!window.confirm(`Xác nhận duyệt ${selectedForApprove.length} mục?`)) return;
    try {
      console.debug('approving selected', { acceptanceId: acc.id, jobIds: selectedForApprove });
      await Promise.all(selectedForApprove.map(jobId => approve({ id: acc.id, jobId }).unwrap()));
      toast.success(`Đã duyệt ${selectedForApprove.length} mục`);
      setSelectedForApprove([]);
      setSelectAllForApprove(false);
      refetch && refetch();
    } catch (err) {
      console.error('approve error', err);
      const msg = err?.data?.message || err?.error || err?.message || JSON.stringify(err);
      toast.error('Không thể duyệt: ' + msg);
    }
  };

  const handleRejectSelected = async () => {
    if (!window.confirm(`Xác nhận từ chối ${selectedForApprove.length} mục?`)) return;
    try {
      console.debug('rejecting selected', { acceptanceId: acc.id, jobIds: selectedForApprove });
      await Promise.all(selectedForApprove.map(jobId => reject({ id: acc.id, jobId }).unwrap()));
      toast.success(`Đã từ chối ${selectedForApprove.length} mục`);
      setSelectedForApprove([]);
      setSelectAllForApprove(false);
      refetch && refetch();
    } catch (err) {
      console.error('reject error', err);
      const msg = err?.data?.message || err?.error || err?.message || JSON.stringify(err);
      toast.error('Không thể từ chối: ' + msg);
    }
  };

  const handleReject = async () => {
    try {
      await reject(id).unwrap();
      toast.success('Đã từ chối biên bản nghiệm thu');
      setShowRejectModal(false);
      setRejectComment('');
    } catch (err) {
      console.error('reject error', err);
      const msg = err?.data?.message || err?.error || err?.message || JSON.stringify(err);
      toast.error('Không thể từ chối: ' + msg);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-blue-600">Biên bản nghiệm thu {acc.id}</h2>
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="px-3 py-1 rounded bg-white border text-sm hover:bg-gray-50">Quay lại</button>
          <button onClick={() => refetch()} className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Load lại</button>
    
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <section className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3 text-left text-blue-500">Kết quả</h3>
            <hr className="mb-4" />
            <ResultsList results={resultList} />
          </section>

          <section className="bg-white rounded shadow p-4 text-left">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-blue-500">Danh sách nghiệm thu</h3>
              {  (
                <div className="flex items-center gap-3">
                  <button onClick={handleApproveSelected} className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700" type="button" disabled={selectedForApprove.length === 0 || approving}>Duyệt đã chọn</button>
                  <button onClick={handleRejectSelected} className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700" type="button" disabled={selectedForApprove.length === 0 || rejecting}>Không duyệt đã chọn</button>
                </div>
              )}
            </div>
            <hr className="mb-4" />

            <div className="space-y-3">
              {localResults.map((item, idx) => (
                <div key={item.job_id ?? idx} className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50">

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-blue-600">{item.name || `Job #${item.job_id}`}</div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={selectedForApprove.includes(item.job_id)} onChange={() => toggleSelectForApprove(item.job_id)} disabled={item.status !== 'submitted'} />
                        <span className="text-xs">Chọn</span>
                      </label>
                    </div>

                    {item.evidence && item.evidence.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.evidence.map((ev, i) => (
                          <a key={i} href={ev.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{ev.filename || 'Link'}</a>
                        ))}
                      </div>
                      
                    )}
                <div className="mt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{ACCEPTANCE_STATUS_LABELS[item.status] || item.status || '—'}</span>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3 text-blue-500 text-left">Thông tin</h3>
            <hr className="mb-4" />
            <div className="space-y-3 text-left text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-500">Dự án</label>
                <p className="mt-1">{acc.project_name || `#${acc.project_id}`}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Trạng thái</label>
                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${acc.status === 'approved' ? 'bg-green-100 text-blue-800' : acc.status === 'rejected' ? 'bg-red-100 text-red-800' : acc.status === 'submitted_bod' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {ACCEPTANCE_STATUS_LABELS[acc.status] || acc.status}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Người tạo</label>
                <p className="mt-1">{acc.created_by_name || `#${acc.created_by}`}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Ngày tạo</label>
                <p className="mt-1">{formatDate(acc.created_at) || '—'}</p>
              </div>
              {acc.approved_by && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Người duyệt</label>
                    <p className="mt-1">{acc.approved_by_name || `#${acc.approved_by}`}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Ngày duyệt</label>
                    <p className="mt-1">{formatDate(acc.approved_at) || '—'}</p>
                  </div>
                </>
              )}
            </div>
          </section>
        </aside>
      </div>

    
    </div>
  );
}
