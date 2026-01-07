import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import jobAPI from '../../api/job';
import projectAPI from '../../api/project';
import { useGetContractByIdQuery } from '../../services/contract';
import { useGetCustomerByIdQuery } from '../../services/customer';
import { useGetUserByIdQuery } from '../../services/user';
import { useGetPartnerByIdQuery } from '../../services/partner';
import { formatDate } from '../../utils/FormatValue';
import { JOB_STATUS_LABELS } from '../../utils/enums';
import { toast } from 'react-toastify';
import { useFinishJobMutation, useUpdateJobMutation, useReworkJobMutation } from '../../services/job';
import { useGetTeamByIdQuery } from '../../services/team';
import { useGetReviewFormQuery } from '../../services/jobReview';

export default function JobDetail({ id: propId } = {}) {
  let routeId = null;
  try {
    const p = useParams();
    routeId = p?.id || null;
  } catch (e) {
    routeId = null;
  }
  const id = propId || routeId;

  const role = useSelector((s) => s.auth.role);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [finishJob, { isLoading: finishing }] = useFinishJobMutation();
  const [updateJob, { isLoading: updatingJob }] = useUpdateJobMutation();
  const [reworkJob, { isLoading: reworking }] = useReworkJobMutation();
  
  // Lấy thông tin đánh giá (cả lead và sale)
  const { data: leadReview } = useGetReviewFormQuery({ id, type: 'lead' }, 
    { 
      skip: !id || !job 
    });
  const { data: saleReview } = useGetReviewFormQuery({ id, type: 'sale' },
    { 
      skip: !id || !job 
    });

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await jobAPI.getById(id);
        if (!mounted) return;
        setJob(data);
        // try load project if present
        if (data?.project_id) {
          try {
            const p = await projectAPI.getById(data.project_id);
            if (mounted) setProject(p);
          } catch (e) {
            console.warn('Failed to load project for job', e);
          }
        } else {
          setProject(null);
        }
      } catch (err) {
        console.error('Load job failed', err);
        if (mounted) setError(err?.message || 'Lỗi khi tải công việc');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  const { data: contract } = useGetContractByIdQuery(job?.contract_id, { skip: !job?.contract_id });
  const customerId = useMemo(() => {
    if (job?.customer_id) return job.customer_id;
    if (contract?.customer_id) return contract.customer_id;
    return null;
  }, [job, contract]);

  const { data: customer } = useGetCustomerByIdQuery(customerId, { skip: !customerId });
  // assigned user/partner will be resolved in AssigneeName component
  const teamId = project?.team_id || project?.team?.id || project?.teamId || null;
  const { data: team } = useGetTeamByIdQuery(teamId, { skip: !teamId });
  const currentUser = useSelector((s) => s.auth.user || null);
  const tokenFromState = useSelector((s) => s.auth.accessToken || null);

  const currentUserId = React.useMemo(() => {
    // prefer explicit user object from store
    if (currentUser) {
      if (currentUser.id) return currentUser.id;
      if (currentUser.user_id) return currentUser.user_id;
    }
    // fallback: parse JWT access token (state or localStorage)
    const raw = tokenFromState || (typeof window !== 'undefined' && localStorage.getItem('accessToken'));
    if (!raw) return null;
    try {
      const parts = raw.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.user_id || payload.id || payload.sub || null;
    } catch (e) {
      console.warn('Failed to parse JWT for user id fallback', e);
      return null;
    }
  }, [currentUser, tokenFromState]);

  const statusOptions = Object.keys(JOB_STATUS_LABELS || {});

  const evidenceList = useMemo(() => {
    if (!job) return [];
    if (Array.isArray(job.evidence)) return job.evidence;
    if (Array.isArray(job.evidences)) return job.evidences;
    if (Array.isArray(job.evidence_files)) return job.evidence_files;
    if (Array.isArray(job.files)) {
      const ef = job.files.filter((f) => f && (f.field === 'evidence' || f.field === 'evidence_file' || f.field === 'evidence_files'));
      if (ef.length) return ef;
    }
    return [];
  }, [job]);

  if (!id) return <div className="p-6">No job id provided</div>;
  if (loading) return <div className="p-6">Loading job...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!job) return <div className="p-6 text-gray-600">Job not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-4 text-left">
        <div className="col-span-8 bg-white rounded shadow p-6">
          <h2 className="text-md font-semibold text-blue-700">Thông tin công việc</h2>
          <hr className="my-4" />

          <div className='grid grid-cols-3'>
            <div className="mb-4">
              <div className="text-xs text-gray-500">Tên công việc</div>
              <div className="text-lg font-medium text-blue-600">{job.name || job.title || `#${job.id}`}</div>
            </div>

          </div>
    
          <div className="grid grid-cols-2 gap-4">
            <div>
                <div className="mb-2 text-sm"><p className="text-gray-500">Dự án:</p> {project?.name || project?.project_name || (project ? `#${project.id}` : '—')}</div>
            </div>

            <div>
             <div className="mb-2 text-sm"><p className="text-gray-500">Khách hàng:</p> {customer?.name || '—'}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm text-gray-500">Người thực hiện</div>
            <div className="text-sm text-gray-700"><AssigneeName job={job} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-xs text-gray-500">Ngày bắt đầu</div>
              <div className="text-sm text-gray-700">{formatDate(job.start_date) || '—'}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Deadline</div>
              <div className="text-sm text-gray-700">{formatDate(job.deadline) || '—'}</div>
            </div>
          </div>

            {job.description && (
            <div className="mb-4 mt-4">
              <div className="text-sm text-gray-500">Mô tả</div>
              <div className="text-sm text-gray-700">{job.description}</div>
            </div>
          )}


          {Array.isArray(job.files) && job.files.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-500">Tệp đính kèm</div>
              <div className="mt-2 text-sm text-gray-700 space-y-2">
                {job.files.map((f, i) => (
                  <div key={f.url || f.name || i}>
                    {f.url ? (
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {f.name || f.filename || `File ${i + 1}`}
                      </a>
                    ) : (
                      <span>{f.name || f.filename || `File ${i + 1}`}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(job.attachments) && job.attachments.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-500">Tài liệu</div>
              <div className="mt-2 text-sm text-gray-700 space-y-2">
                {job.attachments.map((a, i) => (
                  <div key={a.url || a.name || i}>
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {a.name || a.filename || `File ${i + 1}`}
                      </a>
                    ) : (
                      <span>{a.name || a.filename || `File ${i + 1}`}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="col-span-4 bg-white rounded shadow p-6 h-fit">
          <div className="text-md font-semibold text-blue-700">Thực hiện công việc</div>
          <hr className="my-4" />

          <div className="text-sm text-gray-700">
           
            {evidenceList && evidenceList.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-500">Bằng chứng đã upload</div>
                <div className="mt-2 text-sm text-gray-700 space-y-2">
                  {evidenceList.map((f, i) => (
                    <div key={f.url || f.name || i}>
                      {f.url ? (
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          {f.name || f.filename || `File ${i + 1}`}
                        </a>
                      ) : (
                        <span>{f.name || f.filename || `File ${i + 1}`}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(job.status == "in_progress") && (
                

                <div className="mt-4">
                     <div className="mb-3">
              <label className="text-sm text-gray-500">Upload bằng chứng </label>
              <input
                type="file"
                multiple
                onChange={(e) => setEvidenceFiles(e.target.files ? Array.from(e.target.files) : [])}
                className="block mt-2"
              />
              {evidenceFiles && evidenceFiles.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  <div>Đã chọn {evidenceFiles.length} tệp:</div>
                  <ul className="list-disc ml-5 mt-1 overflow-hidden">
                    {evidenceFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                  </ul>
                </div>
              )}
            </div>
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"   
                disabled={finishing || !evidenceFiles || evidenceFiles.length === 0}
                onClick={async () => {
                  if (!job?.id) return toast.error('Không xác định được công việc');
                  if (!evidenceFiles || evidenceFiles.length === 0) {
                    return toast.error('Vui lòng upload ít nhất một file bằng chứng');
                  }
                  try {
                    const form = new FormData();
                    (evidenceFiles || []).forEach((f) => form.append('evidence', f));
                    await finishJob({ id: job.id, formData: form }).unwrap();
                    toast.success('Hoàn thành công việc thành công');
                    // refresh job data
                    try {
                      const fresh = await jobAPI.getById(job.id);
                      setJob(fresh);
                    } catch (e) { console.warn('Failed to refresh job after finish', e); }
                    setEvidenceFiles([]);
                  } catch (err) {
                    console.error('Finish job failed', err);
                    toast.error(err?.data?.error || err?.message || 'Hoàn thành thất bại');
                  }
                }}
              >
                {finishing ? 'Đang xử lý...' : 'Hoàn thành công việc'}
              </button>
            </div>
            )}

            {(job.status === "rework") && (
                <div className="mt-4">
                  <div className="mb-3">
                    <label className="text-sm text-gray-500">Sửa kết quả (Upload bằng chứng mới)</label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setEvidenceFiles(e.target.files ? Array.from(e.target.files) : [])}
                      className="block mt-2"
                    />
                    {evidenceFiles && evidenceFiles.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        <div>Đã chọn {evidenceFiles.length} tệp:</div>
                        <ul className="list-disc ml-5 mt-1 overflow-hidden">
                          {evidenceFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                  <button
                    className="px-3 py-2 bg-orange-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={reworking || !evidenceFiles || evidenceFiles.length === 0}
                    onClick={async () => {
                      if (!job?.id) return toast.error('Không xác định được công việc');
                      if (!evidenceFiles || evidenceFiles.length === 0) {
                        return toast.error('Vui lòng upload ít nhất một file bằng chứng');
                      }
                      try {
                        const form = new FormData();
                        (evidenceFiles || []).forEach((f) => form.append('evidence', f));
                        await reworkJob({ id: job.id, formData: form }).unwrap();
                        toast.success('Cập nhật kết quả thành công');
                        // refresh job data
                        try {
                          const fresh = await jobAPI.getById(job.id);
                          setJob(fresh);
                        } catch (e) { console.warn('Failed to refresh job after rework', e); }
                        setEvidenceFiles([]);
                      } catch (err) {
                        console.error('Rework job failed', err);
                        toast.error(err?.data?.error || err?.message || 'Cập nhật thất bại');
                      }
                    }}
                  >
                    {reworking ? 'Đang xử lý...' : 'Cập nhật kết quả'}
                  </button>
                </div>
            )}

            {job.status === 'review' && team && (String(team.lead_user_id) === String(currentUserId)) && (
              <div className="mt-4">
                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded"
                  onClick={() => {
                    if (!job?.id) return toast.error('Không xác định được công việc');
                    window.location.href = `/job/${job.id}/review`;
                  }}
                >
                  Đánh giá công việc
                </button>
              </div>
            )}          
          </div>
        </div>

        {(leadReview?.review || saleReview?.review) && (
          <div className="col-span-8 bg-white rounded shadow p-6  ">
            <h2 className="text-md font-semibold text-blue-700">Đánh giá công việc</h2>
            <hr className="my-4" />
            <div className="grid grid-cols-2 gap-4">

            {leadReview && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-blue-600 mb-3">Đánh giá của Lead</h3>
                <div className="grid grid-cols-2 gap-4">

                  {leadReview.review?.reviewed_by && (
                    <div>
                      <div className="text-xs text-gray-500">Người đánh giá</div>
                      <div className="text-sm text-gray-700">
                        <ReviewerName userId={leadReview.review.reviewed_by} />
                      </div>
                    </div>
                  )}

                  {leadReview.review?.reviewed_at && (
                    <div>
                      <div className="text-xs text-gray-500">Ngày đánh giá</div>
                      <div className="text-sm text-gray-700">{formatDate(leadReview.review.reviewed_at)}</div>
                    </div>
                  )}

                  {leadReview.review?.status && (
                    <div>
                      <div className="text-xs text-gray-500">Trạng thái</div>
                      <div className={`text-sm font-medium ${
                        leadReview.review.status === 'approved' ? 'text-green-600' : 
                        leadReview.review.status === 'rejected' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {leadReview.review.status === 'approved' ? 'Đã duyệt' : 
                         leadReview.review.status === 'rejected' ? 'Từ chối' : leadReview.review.status}
                      </div>
                    </div>
                  )}
                </div>

                {leadReview.review?.comment && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">Nhận xét</div>
                    <div className="text-sm  mt-2 p-3">
                      {leadReview.review.comment}
                    </div>
                  </div>
                )}

                {leadReview.criteria && Array.isArray(leadReview.criteria) && leadReview.criteria.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-2">Chi tiết tiêu chí đánh giá</div>
                    <div className="space-y-2">
                      {leadReview.criteria.map((criterion, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              {criterion.name || criterion.criterion_name || `Tiêu chí ${idx + 1}`}
                            </span>
                            <span className="text-sm font-semibold text-blue-600">
                              {criterion.is_checked == true ? (
                                <span className="text-green-600">Đã đạt</span>
                              ) : criterion.is_checked == false ? (
                                <span className="text-red-600">Chưa đạt</span>
                              ) : (
                                'Chưa đánh giá'
                              )}
                            </span>
                          </div>
                          {criterion.comment && (
                            <div className="text-xs text-gray-600 mt-1">{criterion.comment}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {saleReview && (
              <div className={leadReview }>
                <h3 className="text-md font-semibold text-blue-600 mb-3">Đánh giá của Sale</h3>
                <div className="grid grid-cols-2 gap-4">

                  {saleReview.review?.reviewed_by && (
                    <div>
                      <div className="text-xs text-gray-500">Người đánh giá</div>
                      <div className="text-sm text-gray-700">
                        <ReviewerName userId={saleReview.review.reviewed_by} />
                      </div>
                    </div>
                  )}

                  {saleReview.review?.reviewed_at && (
                    <div>
                      <div className="text-xs text-gray-500">Ngày đánh giá</div>
                      <div className="text-sm text-gray-700">{formatDate(saleReview.review.reviewed_at)}</div>
                    </div>
                  )}

                  {saleReview.review?.status && (
                    <div>
                      <div className="text-xs text-gray-500">Trạng thái</div>
                      <div className={`text-sm font-medium ${
                        saleReview.review.status === 'approved' ? 'text-green-600' : 
                        saleReview.review.status === 'rejected' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {saleReview.review.status === 'approved' ? 'Đã duyệt' : 
                         saleReview.review.status === 'rejected' ? 'Từ chối' : saleReview.review.status}
                      </div>
                    </div>
                  )}
                </div>

                {saleReview.review?.comment && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">Nhận xét</div>
                    <div className="text-sm  mt-2 p-3">
                      {saleReview.review.comment}
                    </div>
                  </div>
                )}

                {saleReview.criteria && Array.isArray(saleReview.criteria) && saleReview.criteria.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-2">Chi tiết tiêu chí đánh giá</div>
                    <div className="space-y-2">
                      {saleReview.criteria.map((criterion, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              {criterion.name || criterion.criterion_name || `Tiêu chí ${idx + 1}`}
                            </span>
                            <span className="text-sm font-semibold text-blue-600">
                              {criterion.is_checked == true ? (
                                <span className="text-green-600">Đã đạt</span>
                              ) : criterion.is_checked == false ? (
                                <span className="text-red-600">Chưa đạt</span>
                              ) : (
                                'Chưa đánh giá'
                              )}
                            </span>
                          </div>
                          {criterion.comment && (
                            <div className="text-xs text-gray-600 mt-1">{criterion.comment}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!leadReview && !saleReview && (
              <div className="text-sm text-gray-500 text-center py-4">
                Chưa có đánh giá
              </div>
            )}
          </div>
          </div>
        )}
      </div>
      
    </div>
  );
}


function AssigneeName({ job }) {
  const assignedId = job?.assigned_id;
  const assignedType = job?.assigned_type;
  // fetch partner only when assigned type is partner
  const { data: partner, isLoading: partnerLoading } = useGetPartnerByIdQuery(assignedId, { skip: !(assignedType === 'partner' && assignedId) });
  const { data: user, isLoading: userLoading } = useGetUserByIdQuery(assignedType === 'partner' ? null : assignedId, { skip: assignedType === 'partner' || !assignedId });

  if (!assignedId) return <span>Chưa có</span>;
  if (assignedType === 'partner') {
    if (partnerLoading) return <span className="text-sm text-gray-500">#{assignedId} (đang tải...)</span>;
    return <span>{partner?.name || partner?.company_name || `#${assignedId}`}</span>;
  }

  if (userLoading) return <span className="text-sm text-gray-500">#{assignedId} (đang tải...)</span>;
  return <span>{user?.full_name || user?.name || `#${assignedId}`}</span>;
}

function ReviewerName({ userId }) {
  const { data: user, isLoading } = useGetUserByIdQuery(userId, { skip: !userId });
  
  if (!userId) return <span>—</span>;
  if (isLoading) return <span className="text-sm text-gray-500">Đang tải...</span>;
  return <span>{user?.full_name || user?.name || `#${userId}`}</span>;
}
