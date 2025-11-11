import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetServiceJobByIdQuery, useUpdateServiceJobMutation, useRemoveServiceJobMutation } from '../../services/serviceJob';
import { useGetServicesQuery } from '../../services/service';
import { formatPrice } from '../../utils/FormatValue';
import { toast } from 'react-toastify';
import { SERVICE_JOB_LABELS } from '../../utils/enums';

export default function ServiceJobDetail({ id: propId } = {}) {
  let routeId = null;
  try {
    const p = useParams();
    routeId = p?.id || null;
  } catch (e) {
    routeId = null;
  }
  const id = propId || routeId;
  const navigate = useNavigate();

  const { data: job, isLoading, isError, error, refetch } = useGetServiceJobByIdQuery(id, { skip: !id });
  const { data: servicesList = [] } = useGetServicesQuery();
  const [updateJob, { isLoading: updating }] = useUpdateServiceJobMutation();
  const [removeJob, { isLoading: removing }] = useRemoveServiceJobMutation();

  const [form, setForm] = useState({ name: '', base_cost: '', owner_type: '' });

  useEffect(() => {
    if (job) setForm({ name: job.name || job.title || '', base_cost: job.base_cost ?? job.price ?? ''});
  }, [job]);

  const serviceObj = useMemo(() => {
    const sid = job?.service_id ?? job?.service;
    if (!sid) return null;
    const s = (servicesList || []).find((x) => String(x.id) === String(sid) || String(x.service_id) === String(sid));
    if (s) return s;
    // if not in master list, return minimal object
    return { id: sid, name: job?.service_name || job?.service_name || `#${sid}` };
  }, [job, servicesList]);

  if (!id) return <div className="p-6">No service job id provided</div>;
  if (isLoading) return <div className="p-6">Loading service job...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load'}</div>;
  if (!job) return <div className="p-6 text-gray-600">Service job not found</div>;

  const handleSave = async () => {
    try {
      const payload = { name: form.name, base_cost: form.base_cost !== '' ? Number(form.base_cost) : undefined };
      await updateJob({ id: job.id, body: payload }).unwrap();
      toast.success('Cập nhật thành công');
      try { refetch && refetch(); } catch (e) {}
    } catch (err) {
      console.error('update failed', err);
      toast.error(err?.data?.message || err?.message || 'Cập nhật thất bại');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xác nhận xóa service job này?')) return;
    try {
      await removeJob(job.id).unwrap();
      toast.success('Đã xóa');
      navigate('/service-job');
    } catch (err) {
      console.error('remove failed', err);
      toast.error(err?.data?.message || err?.message || 'Xóa thất bại');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-10 gap-4 text-left">
        <div className="col-span-12 bg-white rounded shadow p-6">
            <div className='flex justify-between'>
                <h2 className="text-md font-semibold text-blue-700">Chi tiết Service Job</h2>
                <button onClick={() => {  }} className="text-sm bg-white border px-3 py-1 text-blue-700 rounded">Chỉnh sửa</button>
            </div>
          
          <hr className="my-4" />

          <div className='grid grid-cols-3'>
            <div className="mb-4">
              <div className="text-xs text-gray-500">Tên</div>
              <p>{form.name}</p>
            </div>

            <div className="mb-4">
              <div className="text-xs text-gray-500">Giá vốn</div>
              <p>{formatPrice(form.base_cost)} VND</p>
            </div>
          </div>


          <div>
            <div className="mb-4">
              <div className="text-xs text-gray-500">Dịch vụ</div>
              <div className="text-sm text-gray-700">
                {serviceObj ? (
                  <div>
                    {serviceObj.id ? (
                      <Link to={`/service/${serviceObj.id}`} className="text-blue-600 underline">{serviceObj.name || serviceObj.service_name || `#${serviceObj.id}`}</Link>
                    ) : (
                      <span>{serviceObj.name || serviceObj.service_name || '—'}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>
            </div>

          </div>
            <div className='grid grid-cols-2'>
                <div className="mb-4">
                    <div className="text-xs text-gray-500">Bên phụ trách</div>
                    <p>{SERVICE_JOB_LABELS[job.owner_type]}</p>
                </div>
                {job.partner_id && (
                    <div className="mb-4">
                    <div className="text-sm text-gray-500">Đối tác</div>
                    <div className="text-sm text-gray-700">{job.partner_id}</div>
                    </div>
                )}
            </div>       


          {job.description && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">Mô tả</div>
              <div className="text-sm text-gray-700">{job.description}</div>
            </div>
          )}



          
        </div>

      </div>
    </div>
  );
}
