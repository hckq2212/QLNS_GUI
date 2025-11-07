import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useGetOpportunityByIdQuery } from '../../services/opportunity.js';
import { useGetAllCustomerQuery } from '../../services/customer';
import { useGetAllUserQuery } from '../../services/user';
import { useGetOpportunityServicesQuery } from '../../services/opportunity.js';
import { useGetServicesQuery } from '../../services/service';
import { useParams } from 'react-router-dom';
import { formatPrice, formatRate } from '../../utils/FormatValue.js';
import { PRIORITY_OPTIONS, REGION_OPTIONS } from '../../utils/enums.js';

export default function OpportunityDetail({ id: propId } = {}) {
  // try to get id from prop, otherwise from route params
  let routeParamsId = null;
  try {
    const params = useParams();
    routeParamsId = params?.id || params?.opportunityId || null;
  } catch (e) {
    routeParamsId = null;
  }
  const id = propId || routeParamsId;

  const token = useSelector((s) => s.auth.accessToken);

  const { data: opp, isLoading, isError, error } = useGetOpportunityByIdQuery(id, { skip: !id });
  const { data: servicesData } = useGetOpportunityServicesQuery(id, { skip: !id });
  // all services master list (used to resolve service_id -> service name)
  const { data: servicesList = [] } = useGetServicesQuery();
  const { data: customers } = useGetAllCustomerQuery(undefined, { skip: !token });
  const { data: users } = useGetAllUserQuery(undefined, { skip: !token });

  const customer = useMemo(() => {
    if (!opp) return null;
    if (opp.customer) return opp.customer;
    if (opp.customer_id && Array.isArray(customers)) return customers.find((c) => c.id === opp.customer_id) || null;
    return null;
  }, [opp, customers]);

  const creator = useMemo(() => {
    if (!opp) return null;
    // prefer server-provided user object when available
    if (opp.created_by_user) return opp.created_by_user;
    if (opp.created_by && Array.isArray(users)) return users.find((u) => u.id === opp.created_by) || null;
    return null;
  }, [opp, users]);

  const attachments = useMemo(() => {
    if (!opp) return [];
    // attachments may come as jsonb array or as a JSON string
    if (Array.isArray(opp.attachments)) return opp.attachments;
    if (!opp.attachments) return [];
    try {
      if (typeof opp.attachments === 'string') {
        const parsed = JSON.parse(opp.attachments);
        return Array.isArray(parsed) ? parsed : [];
      }
      // if it's an object that is not an array, try to convert to array
      if (typeof opp.attachments === 'object') {
        return Array.isArray(opp.attachments) ? opp.attachments : Object.values(opp.attachments);
      }
    } catch (e) {
      return [];
    }
    return [];
  }, [opp]);

  if (!id) return <div className="p-6">No opportunity id provided</div>;
  if (isLoading) return <div className="p-6">Loading opportunity...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load opportunity'}</div>;
  if (!opp) return <div className="p-6 text-gray-600">Opportunity not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto text-justify">
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-8 bg-white rounded shadow p-6">
          <div>
            <h2 className='text-lg font-semibold  text-blue-700'>
              Thông tin cơ hội
            </h2>
          </div>
          <hr className='my-4' />
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs text-gray-500">Người tạo</div>
              <div className="text-sm font-semibold">{creator?.full_name}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-500">Tên cơ hội</div>
            <div className="text-lg font-medium">{opp.name  || '—'}</div>
          </div>

          {opp.description && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">Mô tả cơ hội</div>
              <div className="text-sm text-gray-700">{opp.description}</div>
            </div>
          )}

          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500">Dịch vụ</div>
                <div className="mt-2">
                  {Array.isArray(servicesData) && servicesData.length > 0 ? (
                    servicesData.map((s) => {
                      // opportunity_service row contains service_id -> resolve from master services list
                      const svcId = s.service_id || s.service?.id || s.service_id;
                      const svc = Array.isArray(servicesList) ? servicesList.find((x) => x.id === svcId) : null;
                      const label = svc?.name || svc?.service_name || s.name || s.opportunity_service_name || `Service ${svcId || s.id}`;
                      return (
                        <span key={s.id || svcId} className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full mr-2 mb-2 text-sm">
                          {label}
                        </span>
                      );
                    })
                  ) : Array.isArray(opp.opportunity_services) && opp.opportunity_services.length > 0 ? (
                    opp.opportunity_services.map((s, i) => {
                      const svcId = s.service_id || s.service?.id;
                      const svc = Array.isArray(servicesList) ? servicesList.find((x) => x.id === svcId) : null;
                      const label = svc?.name ||  s.name  || `Service ${svcId || s.id || i}`;
                      return (
                        <span key={s.id || svcId || i} className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full mr-2 mb-2 text-sm">{label}</span>
                      );
                    })
                  ) : Array.isArray(opp.services) && opp.services.length > 0 ? (
                    opp.services.map((s, i) => (
                      <span key={i} className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full mr-2 mb-2 text-sm">{s.name || s.service_name || `Service ${s.service_id || s.id || i}`}</span>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">Không có dịch vụ</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Độ ưu tiên</div>
                <div className="text-sm text-gray-700">
                  {PRIORITY_OPTIONS.find((p) => p.value === opp.priority)?.label || '—'}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Doanh thu kỳ vọng</div>
                <div className="text-sm text-gray-700">{formatPrice(opp.expected_revenue )} VND</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500">Ngân sách dự kiến</div>
                <div className="text-sm text-gray-700">{formatPrice(opp.expected_budget) } VND</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Khả năng thành công</div>
                <div className="text-sm text-gray-700">{formatRate(opp.success_rate) || '—'}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Vùng miền</div>
                <div className="text-sm text-gray-700">{REGION_OPTIONS.find((r) => r.value === opp.region)?.label || '—'}</div>
              </div>
            </div>
          </div>


          {attachments && attachments.length > 0 && (
            <div className="mb-4 mt-6">
              <div className="text-sm text-gray-500">Tệp đính kèm</div>
              <div className="mt-2 text-sm text-gray-700 space-y-2">
                {attachments.map((a, i) => (
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
          <div className="text-lg font-semibold  text-blue-700">Thông tin khách hàng</div>
          <hr className='my-4' />
          <div className="mt-3 text-sm text-gray-700">
            <div className="mb-2 flex flex-col"><p className='text-gray-500'>Khách hàng:</p> {customer?.name || customer?.customer_name || 'Chưa có'}</div>
            <div className="mb-2 flex flex-col"><p className='text-gray-500'>Điện thoại:</p> {customer?.phone || customer?.phone_number || customer?.mobile || 'Chưa có'}</div>
            <div className="mb-2 flex flex-col"><p className='text-gray-500'>Email:</p> {customer?.email || 'Chưa có'}</div>
            <div className="mb-2 flex flex-col"><p className='text-gray-500'>Trạng thái:</p> {customer?.status || 'Chưa có'}</div>
            <div className="mb-2 flex flex-col"><p className='text-gray-500'>Mã định danh:</p> {customer?.identify_code || customer?.id_number || 'Chưa có'}</div>
            {customer?.address && <div className="mb-2"><p>Địa chỉ:</p> {customer.address}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
