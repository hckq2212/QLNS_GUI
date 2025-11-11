import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetPartnerByIdQuery } from '../../services/partner';
import { useGetServiceJobsQuery } from '../../services/serviceJob';
import { useGetServicesQuery } from '../../services/service';
import { formatPrice } from '../../utils/FormatValue';
import { PARTNER_TYPE } from '../../utils/enums';

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
  const { data: jobsData } = useGetServiceJobsQuery(undefined, { skip: !id });
  const { data: servicesList = [] } = useGetServicesQuery();

  const jobs = useMemo(() => {
    if (!jobsData) return [];
    const rows = Array.isArray(jobsData) ? jobsData : (jobsData.items || []);
    return rows.filter((j) => {
      // job may reference partner by partner_id or partnerId
      if (!j) return false;
      const pid = j.partner_id ?? j.partnerId ?? j.partner?.id ?? j.assigned_partner_id;
      return pid && String(pid) === String(id);
    });
  }, [jobsData, id]);

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
              <Link to={`/partner/${partner.id}/edit`} className="text-sm bg-white border px-3 py-1 rounded text-blue-600 ">Chỉnh sửa</Link>
            </div>
          </div>
          <hr className="my-4" />

          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <div className="text-xs text-gray-500">Tên</div>
              <div className="text-sm font-semibold">{partner.name || partner.title || '—'}</div>
            </div>
             <div>
              <div className="text-xs text-gray-500">Loại</div>
              <div className="text-sm ">{PARTNER_TYPE[partner.type] || '—'}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Người liên hệ</div>
              <div className="text-sm">{partner.contact_name || partner.contact || '—'}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Điện thoại</div>
              <div className="text-sm">{partner.phone || '—'}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-sm">{partner.email || '—'}</div>
            </div>

            {partner.address && (
              <div>
                <div className="text-xs text-gray-500">Địa chỉ</div>
                <div className="text-sm">{partner.address}</div>
              </div>
            )}

            {partner.description && (
              <div>
                <div className="text-xs text-gray-500">Mô tả</div>
                <div className="text-sm">{partner.description}</div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-7 bg-white rounded shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-md font-semibold text-blue-700">Service Jobs cung cấp</h2>
            <Link to="/service-job/create" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Tạo Service Job</Link>
          </div>

          {jobs.length === 0 ? (
            <div className="text-sm text-gray-600">Không có service job nào gắn với đối tác này</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-[#e7f1fd] text-left">
                  <tr>
                    <th className="px-4 py-3 text-blue-700">Tên</th>
                    <th className="px-4 py-3 text-blue-700">Service</th>
                    <th className="px-4 py-3 text-blue-700">Giá vốn</th>
                    <th className="px-4 py-3 text-blue-700">Bên phụ trách</th>
                    <th className="px-4 py-3 text-blue-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => {
                    const svcId = j.service_id || j.service?.id || j.serviceId;
                    const svc = Array.isArray(servicesList) ? servicesList.find((s) => String(s.id) === String(svcId)) : null;
                    return (
                      <tr key={j.id || j._id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 align-top">{j.name || j.title || `#${j.id || j._id}`}</td>
                        <td className="px-4 py-3 align-top">{svc?.name || j.service_name || `#${svcId || ''}`}</td>
                        <td className="px-4 py-3 align-top">{formatPrice(j.base_cost ?? j.price ?? 0)}</td>
                        <td className="px-4 py-3 align-top">{j.owner_type}</td>
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
