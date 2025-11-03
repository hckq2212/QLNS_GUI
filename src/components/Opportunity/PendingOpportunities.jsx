import React, { useEffect, useState } from 'react';
import opportunityAPI from '../../api/opportunity.js';
import customerAPI from '../../api/customer.js';
import userAPI from '../../api/user.js';
import serviceAPI from '../../api/service.js';
import { useApproveMutation } from '../../services/opportunity.js';
import { useSelector } from 'react-redux';

export default function PendingOpportunities() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [expanded, setExpanded] = useState({});
  const [approveOpportunity, { isLoading: approving }] = useApproveMutation();
  const token = useSelector((state) => state.auth.accessToken);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await opportunityAPI.getAllPending();
        const listData = Array.isArray(data) ? data : [];

  // enrich customer names for entries that only have customer_id
        const customerIds = Array.from(new Set(listData.map(o => o.customer_id).filter(Boolean)));
        if (customerIds.length > 0) {
          try {
            const fetched = await Promise.allSettled(customerIds.map(id => customerAPI.getById(id).catch(() => null)));
            const byId = {};
            fetched.forEach((r, idx) => {
              const id = customerIds[idx];
              if (r.status === 'fulfilled' && r.value) {
                byId[id] = r.value.name || r.value.customer_name || (r.value.customer && r.value.customer.name) || null;
              }
            });
            const enriched = listData.map(o => ({
              ...o,
              customer: o.customer || (o.customer_id ? { name: byId[o.customer_id] || o.customer_name || o.customer_temp || null } : o.customer)
            }));
            setList(enriched);
          } catch (e) {
            // if enrichment fails, still set the raw list
              setList(listData);
          }
        } else {
          setList(listData);
        }

          // enrich creator names for entries that have created_by as an id
          const creatorIds = Array.from(new Set(listData.map(o => o.created_by).filter(Boolean)));
          if (creatorIds.length > 0) {
            try {
              const fetchedCreators = await Promise.allSettled(
                creatorIds.map((id) => userAPI.getById(id).catch(() => null))
              );
              const byCreator = {};
              fetchedCreators.forEach((r, idx) => {
                const id = creatorIds[idx];
                if (r.status === 'fulfilled' && r.value) {
                  // userAPI.getById returns the user object in res.data — attempt common name fields
                  byCreator[id] =  r.value.full_name || null;
                }
              });
              // merge creator name into existing list state if possible
              setList((prev) => prev.map((o) => ({
                ...o,
                created_by_user: o.created_by && byCreator[o.created_by] ? { id: o.created_by, name: byCreator[o.created_by] } : (o.created_by_user || null)
              })));
            } catch (e) {
              // ignore creator enrichment failures
            }
          }

          // enrich services for each opportunity from opportunity_service endpoint
          try {
            const oppIds = listData.map((o) => o.id).filter(Boolean);
            if (oppIds.length > 0) {
              const fetchedServices = await Promise.allSettled(
                oppIds.map((id) => opportunityAPI.getService(id).catch(() => null))
              );
              const servicesByOpp = {};
              fetchedServices.forEach((r, idx) => {
                const id = oppIds[idx];
                if (r.status === 'fulfilled' && Array.isArray(r.value)) {
                  servicesByOpp[id] = r.value;
                }
              });
              // collect distinct service_ids to resolve names
              const allServiceIds = Array.from(
                new Set(
                  Object.values(servicesByOpp)
                    .flat()
                    .map((s) => s.service_id || s.id)
                    .filter(Boolean)
                )
              );
              const serviceNameById = {};
              if (allServiceIds.length > 0) {
                const fetchedNames = await Promise.allSettled(
                  allServiceIds.map((sid) => serviceAPI.getById(sid).catch(() => null))
                );
                fetchedNames.forEach((r, idx) => {
                  const sid = allServiceIds[idx];
                  if (r.status === 'fulfilled' && r.value) {
                    serviceNameById[sid] = r.value.name || r.value.service_name || null;
                  }
                });
              }
              // merge services into the list state
              setList((prev) => prev.map((o) => ({
                ...o,
                services: (o.services && o.services.length > 0 ? o.services : (servicesByOpp[o.id] || o.services))?.map((s) => ({
                  ...s,
                  name: s.name || serviceNameById[s.service_id || s.id] || s.service_name || s.name || null,
                })) || []
              })));
            }
          } catch (e) {
            // non-fatal: leave services as-is
          }
      } catch (err) {
        console.error('failed to load pending opportunities', err);
        setError(err?.message || 'Failed to load pending opportunities');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleApprove(id) {
    if (!window.confirm('Bạn có chắc muốn duyệt cơ hội này?')) return;
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      // Optionally, approver can include payment plan in body; we'll send empty body
      await approveOpportunity(id).unwrap();
      setList((l) => l.filter((x) => x.id !== id));
      alert('Đã duyệt');
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
      alert('Đã từ chối');
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
                  <div className="text-sm text-gray-700">Khách hàng: {o.customer?.name || (o.customer_temp.name) || 'Unknown'}</div>
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
                    {Array.isArray(o.services) && o.services.length > 0 ? (
                      <div className="mt-2">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-3 py-2 border">Dịch vụ</th>
                              <th className="px-3 py-2 border">Số lượng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {o.services.map((s, i) => (
                              <tr key={s.id ?? s.service_id ?? i} className="border-t">
                                <td className="px-3 py-2 align-top">
                                  {s.name || s.service_name || `Service #${s.service_id || s.id || i}`}
                                </td>
                                <td className="px-3 py-2 align-top">{s.quantity ?? s.qty ?? 1}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : o.service_list ? (
                      <div className="mt-2 text-sm text-gray-700">{String(o.service_list)}</div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-500">Không có dịch vụ chi tiết</div>
                    )}
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
