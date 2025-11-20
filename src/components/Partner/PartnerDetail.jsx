import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetPartnerByIdQuery, useUpdatePartnerMutation } from '../../services/partner';
import { useGetServiceJobsQuery } from '../../services/serviceJob';
import { useGetServicesQuery } from '../../services/service';
import { useCreatePartnerServiceJobMutation, useGetPartnerServiceJobsByPartnerQuery, useUpdatePartnerServiceJobMutation } from '../../services/partnerServiceJob';
import { formatPrice } from '../../utils/FormatValue';
import { PARTNER_TYPE } from '../../utils/enums';
import { toast } from 'react-toastify';

export default function PartnerDetail({ id: propId } = {}) {
  let routeParamsId = null;
  try {
    const params = useParams();
    routeParamsId = params?.id || params?.partnerId || null;
  } catch (e) {
    routeParamsId = null;
  }
  const id = propId || routeParamsId;

  const { data: partner, isLoading, isError, error, refetch } = useGetPartnerByIdQuery(id, { skip: !id });
  const [updatePartner, { isLoading: isUpdating }] = useUpdatePartnerMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'individual',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    note: '',
  });

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name || '',
        type: partner.type || 'individual',
        contact_name: partner.contact_name || partner.contact || '',
        phone: partner.phone || '',
        email: partner.email || '',
        address: partner.address || '',
        note: partner.note || '',
      });
    }
  }, [partner]);
  const { data: jobsData } = useGetServiceJobsQuery(undefined, { skip: !id });
  const { data: servicesList = [] } = useGetServicesQuery();
  const { data: partnerMappings = [], refetch: refetchMappings } = useGetPartnerServiceJobsByPartnerQuery(id, { skip: !id });
  const [createPartnerServiceJob, { isLoading: creatingPartnerMapping }] = useCreatePartnerServiceJobMutation();
  const [updatePartnerServiceJob, { isLoading: updatingPartnerMapping }] = useUpdatePartnerServiceJobMutation();

  const jobs = useMemo(() => {
    // Prefer service-job mappings returned by partnerServiceJob.getByPartner
    if (partnerMappings && (Array.isArray(partnerMappings) || partnerMappings.items || partnerMappings.data)) {
      const mappings = Array.isArray(partnerMappings) ? partnerMappings : (partnerMappings.items || partnerMappings.data || []);
      // For each mapping, prefer an embedded `service_job` object. If only an id is present,
      // try to resolve it from the full `jobsData` list. Return an array of { job, mapping } so
      // we can display mapping-level fields like `base_cost`.
      const allJobs = jobsData ? (Array.isArray(jobsData) ? jobsData : (jobsData.items || [])) : [];
      return mappings.map((m) => {
        if (!m) return null;
        const embedded = m.service_job || (m.service_job_id && allJobs.find((aj) => String(aj.id || aj._id) === String(m.service_job_id)));
        let resolvedJob = null;
        if (embedded) resolvedJob = embedded;
        else {
          // Some mappings may store only the id under different keys
          const idCandidate = m.service_job_id ?? (m.service_job && (m.service_job.id || m.service_job._id)) ?? m.service_job;
          if (idCandidate) resolvedJob = allJobs.find((aj) => String(aj.id || aj._id) === String(idCandidate)) || { id: idCandidate };
        }
        return resolvedJob ? { job: resolvedJob, mapping: m } : null;
      }).filter(Boolean);
    }
    // Fallback: older data shape where service jobs include a partner_id field
    if (!jobsData) return [];
    const rows = Array.isArray(jobsData) ? jobsData : (jobsData.items || []);
    return rows.filter((j) => {
      if (!j) return false;
      const pid = j.partner_id;
      return pid && String(pid) === String(id);
    }).map((j) => ({ job: j, mapping: null }));
  }, [jobsData, id, partnerMappings]);

  // helper: existing mapping ids for this partner
  const mappedServiceJobIds = React.useMemo(() => {
    if (!partnerMappings) return new Set();
    const arr = Array.isArray(partnerMappings) ? partnerMappings : (partnerMappings.items || partnerMappings.data || []);
    return new Set(arr.map((m) => String(m.service_job_id ?? m.service_job?.id ?? m.service_job)));
  }, [partnerMappings]);

  const [showAttach, setShowAttach] = useState(false);
  const [selectedAttachJobId, setSelectedAttachJobId] = useState('');
  const [editingMapId, setEditingMapId] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  if (!id) return <div className="p-6">No partner id provided</div>;
  if (isLoading) return <div className="p-6">Loading partner...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load partner'}</div>;
  if (!partner) return <div className="p-6 text-gray-600">Partner not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto text-justify">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 bg-white rounded shadow p-6">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-md font-semibold text-blue-700">Thông tin đối tác</h2>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={async () => {
                      try {
                        await updatePartner({ id: partner.id, ...form }).unwrap();
                        toast.success('Cập nhật đối tác thành công');
                        setIsEditing(false);
                        try { refetch && refetch(); } catch (e) {}
                      } catch (err) {
                        toast.error(err?.data?.message || err?.message || 'Cập nhật thất bại');
                      }
                    }}
                    disabled={isUpdating}
                    className="text-sm bg-blue-600 border px-3 py-1 rounded text-white"
                  >
                    {isUpdating ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      if (partner) {
                        setForm({
                          name: partner.name || '',
                          type: partner.type || 'individual',
                          phone: partner.phone || '',
                          email: partner.email || '',
                          address: partner.address || '',
                          note: partner.note || '',
                        });
                      }
                    }}
                    className="text-sm bg-gray-200 border px-3 py-1 rounded"
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="text-sm bg-blue-600 border px-3 py-1 rounded text-white ">Chỉnh sửa</button>
              )}
            </div>
          </div>
          <hr className="my-4" />

          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <div className="text-xs text-gray-500">Tên</div>
              {isEditing ? (
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" />
              ) : (
                <div className="text-sm font-semibold text-blue-600">{partner.name || partner.title || '—'}</div>
              )}
            </div>
             <div>
              <div className="text-xs text-gray-500">Loại</div>
              {isEditing ? (
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2">
                  {Object.keys(PARTNER_TYPE).map((k) => (
                    <option key={k} value={k}>{PARTNER_TYPE[k]}</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm ">{PARTNER_TYPE[partner.type] || '—'}</div>
              )}
            </div>

            <div>
              <div className="text-xs text-gray-500">Người liên hệ</div>
              {isEditing ? (
                <input value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" />
              ) : (
                <div className="text-sm">{partner.contact_name || partner.contact || '—'}</div>
              )}
            </div>

            <div>
              <div className="text-xs text-gray-500">Điện thoại</div>
              {isEditing ? (
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" />
              ) : (
                <div className="text-sm">{partner.phone || '—'}</div>
              )}
            </div>

            <div>
              <div className="text-xs text-gray-500">Email</div>
              {isEditing ? (
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" />
              ) : (
                <div className="text-sm">{partner.email || '—'}</div>
              )}
            </div>

            {isEditing ? (
              <div>
                <div className="text-xs text-gray-500">Địa chỉ</div>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" />
              </div>
            ) : (
              partner.address && (
                <div>
                  <div className="text-xs text-gray-500">Địa chỉ</div>
                  <div className="text-sm">{partner.address}</div>
                </div>
              )
            )}

            {isEditing ? (
              <div>
                <div className="text-xs text-gray-500">Mô tả</div>
                <textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" rows={4} />
              </div>
            ) : (
              partner.note && (
                <div>
                  <div className="text-xs text-gray-500">Mô tả</div>
                  <div className="text-sm">{partner.note}</div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="col-span-7 bg-white rounded shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-md font-semibold text-blue-700">Hạng mục dịch vụ cung cấp</h2>
            <div className="flex items-center gap-2">
              <Link to="/service-job/create" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Tạo hạng mục dịch vụ</Link>
              <button onClick={() => setShowAttach((s) => !s)} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Phân công hạng mục có sẵn</button>
            </div>
          </div>

          {showAttach && (
            <div className="mb-4 p-3 bg-gray-50 rounded border">
              <div className="flex items-center gap-2">
                <select value={selectedAttachJobId} onChange={(e) => setSelectedAttachJobId(e.target.value)} className="border px-2 py-1 rounded text-sm flex-1">
                  <option value="">-- Chọn hạng mục có sẵn --</option>
                  {(Array.isArray(jobsData) ? jobsData : (jobsData?.items || [])).filter((aj) => aj && aj.owner_type === 'partner' && !mappedServiceJobIds.has(String(aj.id || aj._id))).map((aj) => (
                    <option key={aj.id || aj._id} value={aj.id || aj._id}>{aj.name || aj.title || `#${aj.id || aj._id}`}</option>
                  ))}
                </select>
                <button
                  disabled={!selectedAttachJobId || creatingPartnerMapping}
                  onClick={async () => {
                    if (!selectedAttachJobId) return;
                    try {
                      await createPartnerServiceJob({ partner_id: partner.id, service_job_id: selectedAttachJobId }).unwrap();
                      toast.success('Đã phân công hạng mục cho đối tác');
                      setSelectedAttachJobId('');
                      setShowAttach(false);
                      try { refetch && refetch(); } catch (e) {}
                      try { refetchMappings && refetchMappings(); } catch (e) {}
                    } catch (err) {
                      toast.error(err?.data?.message || err?.message || 'Phân công thất bại');
                    }
                  }}
                  className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
                >
                  Thêm
                </button>
              </div>
            </div>
          )}

          {jobs.length === 0 ? (
            <div className="text-sm text-gray-600">Không có hạng mục dịch vụ nào gắn với đối tác này</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-[#e7f1fd] text-left">
                  <tr>
                    <th className="px-4 py-3 text-blue-700">Tên</th>
                    <th className="px-4 py-3 text-blue-700">Giá vốn</th>
                    <th className="px-4 py-3 text-blue-700">Giá cung cấp</th>
                    <th className="px-4 py-3 text-blue-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((entry) => {
                    const j = entry.job || entry;
                    const mapping = entry.mapping || null;
                    const jobId = j.id || j._id || (j.id === 0 ? 0 : undefined);
                    const svcId = j.service_id || j.service?.id || j.serviceId;
                    const svc = Array.isArray(servicesList) ? servicesList.find((s) => String(s.id) === String(svcId)) : null;
                    const supplyPrice = mapping?.base_cost  ?? 0;
                    return (
                      <tr key={jobId || `${mapping?.id || mapping?.service_job_id || Math.random()}`} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 align-top">{j.name || j.title || `#${jobId}`}</td>
                        <td className="px-4 py-3 align-top">{formatPrice(j.base_cost ?? j.price ?? 0)}</td>
                        <td className="px-4 py-3 align-top">
                          {mapping && (editingMapId === (mapping.id || mapping._id || mapping.partner_service_job_id)) ? (
                            <input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="border px-2 py-1 rounded text-sm w-28"
                            />
                          ) : (
                            formatPrice(supplyPrice)
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex gap-2">
                            <Link to={`/service-job/${jobId}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Xem chi tiết</Link>
                            {mapping && (() => {
                              // Use the mapping's own id fields only. Do not use service_job_id here.
                              const mapId = mapping.id || mapping._id || mapping.partner_service_job_id;
                              if (editingMapId === mapId) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <button
                                      disabled={updatingPartnerMapping}
                                      onClick={async () => {
                                        try {
                                          const parsed = Number(String(editingValue).replace(/[^0-9.-]+/g, ''));
                                          if (Number.isNaN(parsed)) {
                                            toast.error('Giá không hợp lệ');
                                            return;
                                          }
                                          if (!mapId) {
                                            toast.error('Không xác định được mapping id');
                                            return;
                                          }
                                          // Build a richer payload — some backend update handlers expect related ids too
                                          const payload = {
                                            base_cost: parsed,
                                            partner_id: mapping.partner_id ?? mapping.partner?.id ?? partner?.id,
                                            service_job_id: mapping.service_job_id ?? mapping.service_job?.id ?? j?.id,
                                          };
                                          // debug log to inspect payload being sent
                                          await updatePartnerServiceJob({ id: mapId, body: payload }).unwrap();
                                          toast.success('Cập nhật giá cung cấp thành công');
                                          setEditingMapId(null);
                                          setEditingValue('');
                                          try { refetchMappings && refetchMappings(); } catch (e) {}
                                        } catch (err) {
                                          toast.error(err?.data?.message || err?.message || 'Cập nhật thất bại');
                                        }
                                      }}
                                      className="px-2 py-1 rounded bg-green-600 text-white text-xs"
                                    >
                                      Lưu
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingMapId(null);
                                        setEditingValue('');
                                      }}
                                      className="px-2 py-1 rounded bg-gray-200 text-sm"
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <button
                                  disabled={updatingPartnerMapping}
                                  onClick={() => {
                                    const current = mapping.base_cost ?? 0;
                                    setEditingMapId(mapId);
                                    setEditingValue(String(current));
                                  }}
                                  className="px-2 py-1 rounded bg-green-600 text-white text-xs"
                                >
                                  Chỉnh sửa giá
                                </button>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
