import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetServiceByIdQuery } from '../../services/service';
import { useGetPartnersQuery } from '../../services/partner';
import { useGetServiceJobsByServiceIdQuery } from '../../services/serviceJob';
import { formatPrice } from '../../utils/FormatValue';
import { SERVICE_JOB_LABELS } from '../../utils/enums';

export default function ServiceDetail({ id: propId } = {}) {
  let routeParamsId = null;
  try {
    const params = useParams();
    routeParamsId = params?.id || params?.serviceId || null;
  } catch (e) {
    routeParamsId = null;
  }
  const id = propId || routeParamsId;

  const { data: service, isLoading, isError, error } = useGetServiceByIdQuery(id, { skip: !id });
  const { data: jobsData } = useGetServiceJobsByServiceIdQuery(id, { skip: !id });
  const { data: partners = [] } = useGetPartnersQuery();

  const jobs = useMemo(() => {
    if (!jobsData) return [];
    return Array.isArray(jobsData) ? jobsData : (jobsData.items || []);
  }, [jobsData]);

  if (!id) return <div className="p-6">No service id provided</div>;
  if (isLoading) return <div className="p-6">Loading service...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load service'}</div>;
  if (!service) return <div className="p-6 text-gray-600">Service not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto text-justify">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 bg-white rounded shadow p-6">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-md font-semibold text-blue-700">Thông tin dịch vụ</h2>
            <div className="flex gap-2">
              <Link to={`/service/${service.id}`} className="text-sm bg-blue-600 border px-3 py-1 rounded text-white ">Chỉnh sửa</Link>
            </div>
          </div>
          <hr className="my-4" />

          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <div className="text-xs text-gray-500">Tên</div>
              <div className="text-sm font-semibold">{service.name || service.title || '—'}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Giá vốn</div>
              <div className="text-sm">{formatPrice(service.base_cost ?? service.price ?? 0)}</div>
            </div>

            {service.description && (
              <div>
                <div className="text-xs text-gray-500">Mô tả</div>
                <div className="text-sm">{service.description}</div>
              </div>
            )}

            {service.note && (
              <div>
                <div className="text-xs text-gray-500">Ghi chú</div>
                <div className="text-sm">{service.note}</div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-7 bg-white rounded shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-md font-semibold text-blue-700">Hạng mục dịch vụ thuộc {service.name}</h2>
            <Link to={`/service-job/create?service_id=${service.id}`} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Tạo hạng mục dịch vụ</Link>
          </div>

          {jobs.length === 0 ? (
            <div className="text-sm text-gray-600">Không có hạng mục dịch vụ nào cho dịch vụ này</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-[#e7f1fd] text-left">
                  <tr>
                    <th className="px-4 py-3 text-blue-700">Tên</th>
                    <th className="px-4 py-3 text-blue-700">Bên phụ trách</th>
                    <th className="px-4 py-3 text-blue-700">Giá vốn</th>
                    <th className="px-4 py-3 text-blue-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => {
                    const pid = j.partner_id || j.partner?.id || j.partnerId;
                    const partner = Array.isArray(partners) ? partners.find((p) => String(p.id) === String(pid)) : null;
                    return (
                      <tr key={j.id || j._id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 align-top">{j.name || j.title || `#${j.id || j._id}`}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="text-sm">{SERVICE_JOB_LABELS[j.owner_type] || 'Nội bộ'}</div>
                          <div className="text-xs text-gray-500">{partner?.name || j.partner_name || ''}</div>
                        </td>
                        <td className="px-4 py-3 align-top">{formatPrice(j.base_cost ?? j.price ?? 0)}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex gap-2">
                            <Link to={`/service-job/${j.id || j._id}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Xem</Link>
                            <Link to={`/service-job/${j.id || j._id}/edit`} className="px-2 py-1 rounded bg-yellow-600 text-white text-xs">Sửa</Link>
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
