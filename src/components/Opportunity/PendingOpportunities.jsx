import React, { useEffect, useState } from 'react';
import opportunityAPI from '../../api/opportunity.js';
import { useApproveMutation, useGetOpportunityByStatusQuery } from '../../services/opportunity.js';
import { useGetAllCustomerQuery } from '../../services/customer';
import { useGetAllUserQuery } from '../../services/user';
import { useGetOpportunityServicesQuery } from '../../services/opportunity.js';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

export default function PendingOpportunities() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [expanded, setExpanded] = useState({});
  const [approveOpportunity, { isLoading: approving }] = useApproveMutation();
  const token = useSelector((state) => state.auth.accessToken);
  // use RTK Query hook to get pending opportunities
  const {
    data: oppQueryData,
    isLoading: oppQueryLoading,
    isError: oppQueryIsError,
    error: oppQueryError,
  } = useGetOpportunityByStatusQuery('waiting_bod_approval');

  // batch lookups via RTK Query caches
  const { data: customersData } = useGetAllCustomerQuery();
  const { data: usersData } = useGetAllUserQuery();

  useEffect(() => {
    (async () => {
      setLoading(oppQueryLoading);
      setError(null);
      try {
        const data = oppQueryData;

        const listData = Array.isArray(data) ? data : [];
        // build lookups from RTK Query caches
        const customerById = {};
        if (Array.isArray(customersData)) {
          customersData.forEach((c) => { customerById[c.id] = c.name || c.customer_name || (c.customer && c.customer.name) || null; });
        }

        const userById = {};
        if (Array.isArray(usersData)) {
          usersData.forEach((u) => { userById[u.id] = u.full_name|| null; });
        }

        const enriched = listData.map((o) => {
          // determine customer: only use existing object or RTK cache result; do not fall back to ad-hoc fields
          const customer = o.customer ? o.customer : (o.customer_id && customerById[o.customer_id] ? { name: customerById[o.customer_id] } : undefined);

          // determine creator: only set if RTK cache provides a name; otherwise keep existing created_by_user as-is
          const createdByUser = (o.created_by && userById[o.created_by]) ? { id: o.created_by, name: userById[o.created_by] } : (o.created_by_user || undefined);

          // determine services: only map when we have an array; when mapping, only use s.name or the RTK-cached name
          let services = undefined;
          const sourceServices = Array.isArray(o.services) && o.services.length > 0
            ? o.services
            : (Array.isArray(o.service_list) ? o.service_list : null);
          if (Array.isArray(sourceServices)) {
            services = sourceServices.map((s) => ({
              ...s,
              name: s.name || serviceNameById[s.service_id || s.id] || undefined,
            }));
          }

          return {
            ...o,
            customer,
            created_by_user: createdByUser,
            services,
          };
        });

        setList(enriched);
      } catch (err) {
        console.error('failed to load pending opportunities', err);
        setError(err?.message || 'Failed to load pending opportunities');
      } finally {
        setLoading(false);
      }
    })();
  }, [oppQueryData, oppQueryLoading, oppQueryIsError, oppQueryError, customersData, usersData]);

  async function handleApprove(id) {
    if (!window.confirm('Bạn có chắc muốn duyệt cơ hội này?')) return;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      // Optionally, approver can include payment plan in body; we'll send empty body
      await approveOpportunity(id).unwrap();
      setList((l) => l.filter((x) => x.id !== id));
      toast.success('Đã duyệt cơ hội')
    } catch (err) {
      console.error('approve failed', err);
      alert(err?.message || 'Approve failed');
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  async function handleReject(id) {
    if (!window.confirm('Bạn có chắc muốn từ chối cơ hội này?')) return;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await opportunityAPI.reject(id, {});
      setList((l) => l.filter((x) => x.id !== id));
      toast.message('Đã từ chối cơ hội')
    } catch (err) {
      console.error('reject failed', err);
      alert(err?.message || 'Reject failed');
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : list.length === 0 ? (
        <div className="text-sm text-gray-600">Không có cơ hội nào đang chờ duyệt</div>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <div key={o.id} className="p-4 border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-left">Cơ hội #{o.id}</div>
                  <div className="text-sm text-gray-700">Khách hàng: {o.customer?.name || 'Unknown'}</div>
                  {/* <div className="text-sm text-gray-700">Công ty: {o.customer?.company || (o.customer_temp.company) || 'Unknown'}</div> */}
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => setExpanded((p) => ({ ...p, [o.id]: !p[o.id] }))}
                    className="bg-gray-200 text-gray-800 px-3 py-1 rounded"
                  >
                    {expanded[o.id] ? 'Đóng' : 'Xem chi tiết'}
                  </button>
                  <button
                    disabled={actionLoading[o.id]}
                    onClick={() => handleApprove(o.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    {actionLoading[o.id] ? '...' : 'Duyệt'}
                  </button>
                  <button
                    disabled={actionLoading[o.id]}
                    onClick={() => handleReject(o.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    {actionLoading[o.id] ? '...' : 'Không duyệt'}
                  </button>
                </div>
              </div>
              {expanded[o.id] && (
                <div className="mt-3 bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-700 mb-2 text-left">
                    <strong>Người tạo:</strong>{' '}
                    { o.created_by_user?.name || 'Unknown' }
                  </div>
                  {o.description && 
                  <div className="mt-2 text-sm text-gray-600 font-bold text-left">
                    Mô tả: 
                    <p className='font-normal'>{o.description}</p>
                  </div>}
                  <div>
                    <OpportunityServices oppId={o.id} fallbackServices={Array.isArray(o.services) ? o.services : null} serviceListString={o.service_list} />
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OpportunityServices({ oppId, fallbackServices, serviceListString }) {
  // fetch services for a specific opportunity via RTK Query
  const { data, isLoading, isError } = useGetOpportunityServicesQuery(oppId);

  const services = Array.isArray(data)
    ? data
    : (Array.isArray(fallbackServices) ? fallbackServices : null);

  if (isLoading) return <div className="text-sm text-gray-500">Loading services...</div>;
  if (isError) return <div className="text-sm text-red-600">Không thể tải dịch vụ</div>;

  if (Array.isArray(services) && services.length > 0) {
    return (
      <div className="mt-2">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 border">Dịch vụ</th>
              <th className="px-3 py-2 border">Số lượng</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s, i) => (
              <tr key={s.id ?? s.service_id ?? i} className="border-t">
                <td className="px-3 py-2 align-top">{s.name || `Service #${s.service_id || s.id || i}`}</td>
                <td className="px-3 py-2 align-top">{s.quantity ?? s.qty ?? 1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (serviceListString) {
    return <div className="mt-2 text-sm text-gray-700">{String(serviceListString)}</div>;
  }

  return <div className="mt-2 text-sm text-gray-500">Không có dịch vụ chi tiết</div>;
}
