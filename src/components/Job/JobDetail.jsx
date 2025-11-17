import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import jobAPI from '../../api/job';
import projectAPI from '../../api/project';
import { useGetContractByIdQuery } from '../../services/contract';
import { useGetCustomerByIdQuery } from '../../services/customer';
import { useGetUserByIdQuery } from '../../services/user';
import { formatDate } from '../../utils/FormatValue';
import { JOB_STATUS_LABELS } from '../../utils/enums';
import { toast } from 'react-toastify';

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
  const { data: assignedUser } = useGetUserByIdQuery(job?.assigned_id, { skip: !job?.assigned_id });

  const statusOptions = Object.keys(JOB_STATUS_LABELS || {});

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

            <div className="mb-4">
              <div className="text-xs text-gray-500">Mã công việc</div>
              <div className="text-lg font-medium text-blue-600">{job.code || '—'}</div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-gray-500">Trạng thái</div>
              <div className="text-lg font-medium text-blue-600">{JOB_STATUS_LABELS[job.status] || job.status || '—'}</div>
            </div>
          </div>

          {job.description && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">Mô tả</div>
              <div className="text-sm text-gray-700">{job.description}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Ngày bắt đầu</div>
              <div className="text-sm text-gray-700">{formatDate(job.start_date) || '—'}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Deadline</div>
              <div className="text-sm text-gray-700">{formatDate(job.deadline) || '—'}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm text-gray-500">Người thực hiện</div>
            <div className="text-sm text-gray-700 mt-2">{assignedUser?.full_name || assignedUser?.name || job.assigned_id || 'Chưa có'}</div>
          </div>

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
              <div className="text-sm text-gray-500">Attachments</div>
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

        <div className="col-span-4 bg-white rounded shadow p-6">
          <div className="text-md font-semibold text-blue-700">Liên quan</div>
          <hr className="my-4" />

          <div className="text-sm text-gray-700">
            <div className="mb-2"><p className="text-gray-500">Dự án:</p> {project?.name || project?.project_name || (project ? `#${project.id}` : '—')}</div>
            <div className="mb-2"><p className="text-gray-500">Hợp đồng:</p> {contract?.name || contract?.code || (contract ? `#${contract.id}` : '—')}</div>
            <div className="mb-2"><p className="text-gray-500">Khách hàng:</p> {customer?.name || '—'}</div>
            <div className="mb-2"><p className="text-gray-500">Điện thoại:</p> {customer?.phone || '—'}</div>
            <div className="mb-2"><p className="text-gray-500">Email:</p> {customer?.email || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
