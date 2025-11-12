import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetServiceJobByIdQuery, useUpdateServiceJobMutation, useRemoveServiceJobMutation } from '../../services/serviceJob';
import { useGetServicesQuery, useGetServicesByJobIdQuery } from '../../services/service';
import { useGetPartnersQuery } from '../../services/partner';
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
  const { data: servicesFromBackend = [] } = useGetServicesByJobIdQuery(job?.id, { skip: !job?.id });
  const { data: partnersData = [] } = useGetPartnersQuery();
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

  const partnerName = useMemo(() => {
    try {
      const list = Array.isArray(partnersData) ? partnersData : (partnersData?.items || []);
      const pid = job?.partner_id || job?.partner?.id || job?.partnerId;
      if (!pid) return job?.partner_name || null;
      const p = list.find((x) => String(x.id) === String(pid));
      return p?.name || job?.partner_name || String(pid);
    } catch (e) {
      return job?.partner_name || null;
    }
  }, [partnersData, job]);

  // prefer backend-provided full service objects for this job when available
  const servicesForJob = useMemo(() => {
    if (Array.isArray(servicesFromBackend) && servicesFromBackend.length > 0) return servicesFromBackend;
    // fallback: try resolving via master services list and job.service_id
    try {
      const list = Array.isArray(servicesList) ? servicesList : (servicesList?.items || []);
      const sid = job?.service_id ?? job?.service;
      if (!sid) return [];
      const s = list.filter((x) => String(x.id) === String(sid) || String(x.service_id) === String(sid));
      return s;
    } catch (e) {
      return [];
    }
  }, [servicesFromBackend, servicesList, job]);

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
      <div className="grid grid-cols-12 gap-4 text-left">
        {/* Left: job info */}
        <div className="col-span-5 bg-white rounded shadow p-6">
          <div className='flex justify-between'>
            <h2 className="text-md font-semibold text-blue-700">Chi tiết hạng mục dịch vụ</h2>
            <button onClick={() => { /* toggle edit in future */ }} className="text-sm text-white border px-3 py-1 bg-blue-700 rounded">Chỉnh sửa</button>
          </div>

          <hr className="my-4" />

          <div className='space-y-4'>
            <div>
              <div className="text-xs text-gray-500">Tên</div>
              <div className="text-sm font-semibold">{job.name || job.title || '—'}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Giá vốn</div>
              <div className="text-sm">{formatPrice(job.base_cost ?? job.price ?? 0)} VND</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Bên phụ trách</div>
              <div className="text-sm">{SERVICE_JOB_LABELS[job.owner_type] || 'Nội bộ'}</div>
              {partnerName && <div className="text-xs text-gray-500">{partnerName}</div>}
            </div>

            {job.description && (
              <div>
                <div className="text-xs text-gray-500">Mô tả</div>
                <div className="text-sm text-gray-700">{job.description}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: services using this job */}
        <div className="col-span-7 bg-white rounded shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-md font-semibold text-blue-700">Dịch vụ đang sử dụng hạng mục này</h2>
          </div>

          {(!servicesForJob || servicesForJob.length === 0) ? (
            <div className="text-sm text-gray-600">Không có dịch vụ nào sử dụng hạng mục này</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-[#e7f1fd] text-left">
                  <tr>
                    <th className="px-4 py-3 text-blue-700">Tên dịch vụ</th>
                    <th className="px-4 py-3 text-blue-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesForJob.map((s) => (
                    <tr key={s.id || s._id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 align-top">{s.name || s.title || `#${s.id || s._id}`}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex gap-2">
                          {s.id && <Link to={`/service/${s.id}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Xem</Link>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
