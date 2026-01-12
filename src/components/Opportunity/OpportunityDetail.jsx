import React, { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGetOpportunityByIdQuery, useApproveMutation } from '../../services/opportunity.js';
import { useGetAllCustomerQuery } from '../../services/customer';
import { useUpdateOpportunityMutation } from '../../services/opportunity';
import { useGetAllUserQuery } from '../../services/user';
import { useGetOpportunityServicesQuery } from '../../services/opportunity.js';
import { useGetServicesQuery } from '../../services/service';
import { useGetReferralsQuery, useGetReferralCustomersQuery, useGetReferralByIdQuery } from '../../services/referral';
import { useGetQuoteByOpportunityIdQuery } from '../../services/quote';
import { useParams, useNavigate } from 'react-router-dom';
import { formatPrice, formatRate } from '../../utils/FormatValue.js';
import { PRIORITY_OPTIONS, REGION_OPTIONS, CUSTOMER_STATUS_OPTIONS } from '../../utils/enums.js';
import PriceQuoteModal from '../ui/PriceQuoteModal';
import ViewQuoteModal from '../ui/ViewQuoteModal';
import UpdateQuoteModal from '../ui/UpdateQuoteModal';
import opportunityAPI from '../../api/opportunity.js';
import { toast } from 'react-toastify';
import CreateConFromOppoModal from '../ui/CreateConFromOppoModal.jsx';


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

  const { data: opp, isLoading, isError, error, refetch } = useGetOpportunityByIdQuery(id, { skip: !id });
  const { data: servicesData } = useGetOpportunityServicesQuery(id, { skip: !id });
  const { data: servicesList = [] } = useGetServicesQuery();
  const { data: customers } = useGetAllCustomerQuery(undefined, { skip: !token });
  const { data: users } = useGetAllUserQuery(undefined, { skip: !token });
  const { data: referrals = [] } = useGetReferralsQuery(undefined, { skip: !token });
  
  // Fetch quote data to check status
  const { data: quoteData } = useGetQuoteByOpportunityIdQuery(id, { skip: !id });
  
  // State for referral selection
  const [selectedReferralId, setSelectedReferralId] = useState(null);
  const { data: referralCustomers = [] } = useGetReferralCustomersQuery(selectedReferralId, { 
    skip: !selectedReferralId 
  });

  // Get referral details for display
  const referralId = opp?.referral_id || opp?.customer_temp?.referral_id;
  const { data: referralDetail } = useGetReferralByIdQuery(referralId, { 
    skip: !referralId 
  });

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

  // editable customer draft for inline editing
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerDraft, setCustomerDraft] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerType, setCustomerType] = useState(() => {
    // Initialize based on opp data on first render
    const source = opp?.customer_source || opp?.customer_temp?.customer_source;
    const refId = opp?.referral_id || opp?.customer_temp?.referral_id;
    return source === 'partner' || refId ? 'referral' : 'direct';
  });
  const [customerTypeInitialized, setCustomerTypeInitialized] = useState(false);
  // price quote modal
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [viewQuoteOpen, setViewQuoteOpen] = useState(false);
  const [updateQuoteOpen, setUpdateQuoteOpen] = useState(false);
  const [createConOpen, setCreateConOpen] = useState(false);
  const [updateOpportunity, { isLoading: updatingOpportunity }] = useUpdateOpportunityMutation();
  const [approveOpportunity, { isLoading: approving }] = useApproveMutation();
  const navigate = useNavigate();
  const role = useSelector((s) => s.auth.role);

  // initialize draft when customer changes (but not while editing)
  useEffect(() => {
    if (!editingCustomer && opp) {
      setCustomerDraft(customer);
      setSelectedCustomerId(customer?.id || null);
      
      // Only initialize customer type once on first load
      if (!customerTypeInitialized) {
        const source = opp?.customer_source || opp?.customer_temp?.customer_source;
        const refId = opp?.referral_id || opp?.customer_temp?.referral_id;
        
        if (source === 'partner' || refId) {
          setCustomerType('referral');
          setSelectedReferralId(refId || null);
        } else {
          setCustomerType('direct');
          setSelectedReferralId(null);
        }

        setCustomerTypeInitialized(true);
      }
    }
  }, [customer, editingCustomer, opp, customerTypeInitialized]);

  if (!id) return <div className="p-6">No opportunity id provided</div>;
  if (isLoading) return <div className="p-6">Loading opportunity...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.message || 'Failed to load opportunity'}</div>;
  if (!opp) return <div className="p-6 text-gray-600">Opportunity not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto text-justify">
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-8 bg-white rounded shadow p-6">
          <div>
            <h2 className='text-md font-semibold  text-blue-700'>
              Thông tin cơ hội
            </h2>
          </div>
          <hr className='my-4' />
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs text-gray-500">Người tạo</div>
              <div className="text-lg font-semibold text-blue-600">{creator?.full_name}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-500">Tên cơ hội</div>
            <div className="text-lg font-medium text-blue-600">{opp.name  || '—'}</div>
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
                      const label = svc?.name  || s.name  || `Service ${svcId || s.id}`;
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
              
              <div>
                <div className="text-xs text-gray-500">Số tháng triển khai</div>
                <div className="text-sm text-gray-700">{opp.implementation_months} tháng</div>
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

        <div className="col-span-4 bg-white rounded shadow p-6 h-fit">
          <div className="text-md font-semibold  flex justify-between text-blue-700">
            Thông tin khách hàng
              {!editingCustomer ? (
                <button onClick={() => { setEditingCustomer(true); setCustomerDraft(customer); }} className="text-sm bg-white border px-3 py-1 rounded">Chỉnh sửa</button>
              ) : null}
          </div>
          <hr className='my-4' />
          <div className="mt-3 text-sm text-gray-700">
            <div className="flex justify-end mb-2">
            </div>
            {editingCustomer ? (
              <div>
                <div className="mb-2">
                  <p className='text-gray-500'>Loại khách hàng:</p>
                  <select className="mt-1 w-full border rounded p-2" value={customerType} onChange={(e) => {
                    setCustomerType(e.target.value);
                    if (e.target.value === 'referral') {
                      setSelectedReferralId(null);
                    }
                  }}>
                    <option value="direct">Khách hàng trực tiếp</option>
                    <option value="referral">Khách hàng liên kết</option>
                  </select>
                </div>

                {customerType === 'referral' && (
                  <div className="mb-2">
                    <p className='text-gray-500'>Đối tác giới thiệu:</p>
                    <select 
                      className="mt-1 w-full border rounded p-2" 
                      value={selectedReferralId || ''} 
                      onChange={(e) => {
                        setSelectedReferralId(e.target.value);
                        // Reset customer selection when referral changes
                        setSelectedCustomerId(null);
                      }}
                    >
                      <option value="">-- Chọn đối tác giới thiệu --</option>
                      {Array.isArray(referrals) && referrals.map((r) => (
                        <option key={r.id} value={r.id}>{r.name || r.partner_name || `#${r.id}`}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-2">
                  <p className='text-gray-500'>Trạng thái khách hàng:</p>
                  <select className="mt-1 w-full border rounded p-2" value={customerDraft?.status || ''} onChange={(e) => setCustomerDraft((d) => ({ ...d, status: e.target.value }))}>
                    <option value="">-- Chọn trạng thái --</option>
                    {CUSTOMER_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* if potential, allow freeform inputs and save to opportunity.customer_temp */}
                {customerDraft?.status === 'potential' ? (
                  <>
                    <div className="mb-2">
                      <p className='text-gray-500'>Tên khách hàng:</p>
                      <input type='text' className="mt-1 w-full border rounded p-2" value={customerDraft?.name || ''} onChange={(e) => setCustomerDraft((d) => ({ ...d, name: e.target.value }))} />
                    </div>
                    <div className="mb-2">
                      <p className='text-gray-500'>Điện thoại:</p>
                      <input type='number' className="mt-1 w-full border rounded p-2" value={customerDraft?.phone || customerDraft?.phone_number || ''} onChange={(e) => setCustomerDraft((d) => ({ ...d, phone: e.target.value }))} />
                    </div>
                    <div className="mb-2">
                      <p className='text-gray-500'>Email:</p>
                      <input type='email' className="mt-1 w-full border rounded p-2" value={customerDraft?.email || ''} onChange={(e) => setCustomerDraft((d) => ({ ...d, email: e.target.value }))} />
                    </div>
                    <div className="mb-2">
                      <p className='text-gray-500'>CMND/Hộ chiếu:</p>
                      <input
                        type='text'
                        className="mt-1 w-full border rounded p-2"
                        value={customerDraft?.identity_code || customerDraft?.identify_code || customerDraft?.id_number || ''}
                        onChange={(e) => setCustomerDraft((d) => ({ ...d, identity_code: e.target.value, identify_code: e.target.value }))}
                      />
                    </div>
                    <div className="mb-2">
                      <p className='text-gray-500'>Mã số thuế:</p>
                      <input
                        type='number'
                        className="mt-1 w-full border rounded p-2"
                        value={customerDraft?.tax_code || ''}
                        onChange={(e) => setCustomerDraft((d) => ({ ...d, tax_code: e.target.value }))}
                      />
                    </div>
                    <div className="mb-2">
                      <p className='text-gray-500'>Địa chỉ:</p>
                      <input type='text' className="mt-1 w-full border rounded p-2" value={customerDraft?.address || ''} onChange={(e) => setCustomerDraft((d) => ({ ...d, address: e.target.value }))} />
                    </div>
                  </>
                ) : customerType === 'referral' && !selectedReferralId ? (
                  /* If referral type but no referral selected, show message */
                  <div className="mb-2 text-sm text-gray-500 italic">
                    Vui lòng chọn đối tác giới thiệu trước
                  </div>
                ) : (
                  /* otherwise allow selecting an existing customer from dropdown */
                  <div className="mb-2">
                    <p className='text-gray-500'>Chọn khách hàng hiện có:</p>
                    <select className="mt-1 w-full border rounded p-2" value={ selectedCustomerId  || ''} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                      <option value="">-- Chọn khách hàng --</option>
                      {customerType === 'referral' && selectedReferralId ? (
                        /* Show customers from selected referral partner */
                        Array.isArray(referralCustomers) && referralCustomers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name || c.customer_name || `#${c.id}`}</option>
                        ))
                      ) : (
                        /* Show all customers for direct type */
                        Array.isArray(customers) && customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name || c.customer_name || `#${c.id}`} - {c?.tax_code}</option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded" disabled={updatingOpportunity} onClick={async () => {
                    try {
                      const body = {};

                      if (customerDraft?.status === 'potential') {
                        body.customer_temp = {
                          name: customerDraft.name || '',
                          phone: customerDraft.phone || customerDraft.phone_number || '',
                          email: customerDraft.email || '',
                          status: customerDraft.status || 'potential',
                          identity_code: customerDraft.identity_code || customerDraft.id_number || '',
                          tax_code: customerDraft.tax_code,
                          address: customerDraft.address || '',
                          customer_source: customerType === 'referral' ? 'partner' : 'direct',
                          referral_id: customerType === 'referral' && selectedReferralId ? Number(selectedReferralId) : null,
                        };
                        body.customer_id = null;
                      } else {
                        // use selectedCustomerId if present, otherwise fallback to draft.id
                        const cid = selectedCustomerId || customerDraft?.id || null;
                        if (cid) body.customer_id = Number(cid);
                        body.customer_temp = null;
                        
                        // Set customer_source based on customerType for existing customers
                        if (customerType === 'referral') {
                          body.customer_source = 'partner';
                          if (selectedReferralId) {
                            body.referral_id = Number(selectedReferralId);
                          }
                        } else {
                          body.customer_source = 'direct';
                          body.referral_id = null;
                        }
                      }
                      await updateOpportunity({ id: opp.id, body }).unwrap();
                      toast.success('Cập nhật thông tin khách hàng thành công');
                      setEditingCustomer(false);
                    } catch (err) {
                      console.error('Update opportunity customer failed', err);
                      toast.error('Cập nhật thất bại');
                    }
                  }}>{updatingOpportunity ? 'Đang lưu...' : 'Lưu'}</button>
                  <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => { setEditingCustomer(false); setCustomerDraft(customer); setSelectedCustomerId(customer?.id || null); }}>Hủy</button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2 flex flex-col">
                  <p className='text-gray-500'>Loại khách hàng:</p> 
                  {(opp?.customer_source === 'partner' || opp?.customer_temp?.customer_source === 'partner') 
                    ? 'Khách hàng liên kết' 
                    : 'Khách hàng trực tiếp'}
                </div>
                {((opp?.customer_source === 'partner' || opp?.customer_temp?.customer_source === 'partner') && 
                  (opp?.referral_id || opp?.customer_temp?.referral_id)) && (
                  <div className="mb-2 flex flex-col">
                    <p className='text-gray-500'>Đối tác giới thiệu:</p> 
                    {referralDetail?.name || `#${referralId}`}
                  </div>
                )}
                <div className="mb-2 flex flex-col"><p className='text-gray-500'>Khách hàng:</p> {customer?.name  || opp?.customer_temp?.name || 'Chưa có'}</div>
                <div className="mb-2 flex flex-col"><p className='text-gray-500'>Điện thoại:</p> {customer?.phone || customer?.phone_number || opp?.customer_temp?.phone || 'Chưa có'}</div>
                <div className="mb-2 flex flex-col"><p className='text-gray-500'>Email:</p> {customer?.email || opp?.customer_temp?.email || 'Chưa có'}</div>
                <div className="mb-2 flex flex-col"><p className='text-gray-500'>Trạng thái:</p> {(
                  CUSTOMER_STATUS_OPTIONS.find((o) => o.value === (customer?.status || opp?.customer_temp?.status))?.label
                  || customer?.status
                  || opp?.customer_temp?.status
                  || 'Chưa có'
                )}</div>
                <div className="mb-2 flex flex-col"><p className='text-gray-500'>CMNND/Hộ chiếu:</p> {customer?.identity_code || customer?.identify_code || customer?.id_number || opp?.customer_temp?.identity_code || opp?.customer_temp?.identify_code || 'Chưa có'}</div>
                <div className="mb-2 flex flex-col"><p className='text-gray-500'>Mã số thuế:</p> {customer?.tax_code || opp?.customer_temp?.tax_code || 'Chưa có'}</div>
                {(customer?.address || opp?.customer_temp?.address) && <div className="mb-2"><p>Địa chỉ:</p> {customer?.address || opp?.customer_temp?.address}</div>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Price quote action footer */}
      <div className="mt-6 flex items-center gap-3 justify-between">

        {(opp.status == 'approved') && (
          <button onClick={() => setQuoteOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Làm báo giá</button>
        )}
        {/* BOD / Admin actions: Duyệt / Không duyệt - Only show if customer info exists */}
        {(role === 'bod' || role === 'admin' && opp.status == 'waiting_bod_approval') && (opp.customer_id || opp.customer_temp) ? (
          <div className="ml-4 flex items-center gap-2">
            <button
              disabled={approving}
              onClick={async () => {
                if (!window.confirm('Bạn có chắc muốn duyệt cơ hội này?')) return;
                try {
                  await approveOpportunity(opp.id).unwrap();
                  toast.success('Đã duyệt cơ hội');
                  // RTK Query invalidation should refetch, but call refetch to be safe
                  try { refetch && refetch(); } catch (e) { /* ignore */ }
                } catch (err) {
                  console.error('approve failed', err);
                  toast.error(err?.message || 'Duyệt thất bại');
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {approving ? 'Đang...' : 'Duyệt'}
            </button>

            <button
              disabled={false}
              onClick={async () => {
                if (!window.confirm('Bạn có chắc muốn từ chối cơ hội này?')) return;
                try {
                  await opportunityAPI.reject(opp.id, {});
                  toast.success('Đã từ chối cơ hội');
                  // refetch the opportunity to update UI
                  try { refetch && refetch(); } catch (e) { /* ignore */ }
                } catch (err) {
                  console.error('reject failed', err);
                  toast.error(err?.message || 'Từ chối thất bại');
                }
              }}
              className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded"
            >
              Không duyệt
            </button>
          </div>
        ) : (role === 'bod' || role === 'admin') && opp.status == 'waiting_bod_approval' && !opp.customer_id && !opp.customer_temp ? (
          <div className="ml-4 text-orange-600 font-medium">
            Vui lòng thêm thông tin khách hàng trước khi duyệt
          </div>
        ) : null}
      </div>
      {(opp.status == 'quoted' || opp.status == 'contract_created' ) && (
        <div className="flex gap-2 mt-6">
          <button onClick={() => setViewQuoteOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Xem báo giá</button>
        </div>
      )}
      {(opp.status == 'quote_rejected') && (
        <div className="flex gap-2 mt-6">
          <button onClick={() => setUpdateQuoteOpen(true)} className="bg-orange-600 text-white px-4 py-2 rounded">Sửa báo giá</button>
        </div>
      )}
      {(opp.status == 'quoted' && (quoteData?.status === 'approved' || (Array.isArray(quoteData) && quoteData[0]?.status === 'approved'))) && (
        <div className="flex gap-2 mt-6">
          <button onClick={() => setCreateConOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Tạo hợp đồng</button>
        </div>
      )}

      <PriceQuoteModal 
        isOpen={quoteOpen} 
        onClose={() => {
          setQuoteOpen(false);
          // Refetch opportunity data to update status
          try { refetch && refetch(); } catch (e) { /* ignore */ }
        }} 
        opportunity={opp} 
      />
      <ViewQuoteModal isOpen={viewQuoteOpen} onClose={() => setViewQuoteOpen(false)} opportunity={opp} />
      <UpdateQuoteModal 
        isOpen={updateQuoteOpen} 
        onClose={() => {
          setUpdateQuoteOpen(false);
          try { refetch && refetch(); } catch (e) { /* ignore */ }
        }} 
        opportunity={opp} 
      />

      {createConOpen && (
        <CreateConFromOppoModal
          selectedOpportunity={opp}
          onClose={() => setCreateConOpen(false)}
          onCreated={(contract) => {
            // Navigate to contract detail page
            const contractId = contract?.id || contract?.contract?.id;
            if (contractId) {
              navigate(`/contract/${contractId}`);
            }
            // refresh opportunity and close modal
            try { refetch && refetch(); } catch (e) {}
            setCreateConOpen(false);
          }}
        />
      )}
    </div>
  );
}
