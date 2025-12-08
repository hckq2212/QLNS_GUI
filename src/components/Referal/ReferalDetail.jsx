import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetReferralByIdQuery, useUpdateReferralMutation, useGetReferralCustomersQuery } from '../../services/referral';
import { toast } from 'react-toastify';

export default function ReferalDetail({ id: propId } = {}) {
  let routeParamsId = null;
  try {
    const params = useParams();
    routeParamsId = params?.id || params?.referralId || null;
  } catch (e) {
    routeParamsId = null;
  }
  const id = propId || routeParamsId;

  const { data: referral, isLoading, isError, error, refetch } = useGetReferralByIdQuery(id, { skip: !id });
  const { data: customers = [], isLoading: customersLoading } = useGetReferralCustomersQuery(id, { skip: !id });
  const [updateReferral, { isLoading: isUpdating }] = useUpdateReferralMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    note: '',
  });

  useEffect(() => {
    if (referral) {
      setForm({
        name: referral.name || referral.partner_name || '',
        contact_name: referral.contact_name || referral.contact || '',
        phone: referral.phone || referral.phone_number || '',
        email: referral.email || '',
        address: referral.address || '',
        note: referral.note || '',
      });
    }
  }, [referral]);

  if (!id) return <div className="p-6">No referral id provided</div>;
  if (isLoading) return <div className="p-6">Loading referral partner...</div>;
  if (isError) return <div className="p-6 text-red-600">Error: {error?.data?.error || error?.message || 'Failed to load referral'}</div>;
  if (!referral) return <div className="p-6 text-gray-600">Referral partner not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto text-justify">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 bg-white rounded shadow p-6">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-md font-semibold text-blue-700">Thông tin đối tác giới thiệu</h2>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={async () => {
                      try {
                        await updateReferral({ id: referral.id, body: form }).unwrap();
                        toast.success('Cập nhật đối tác thành công');
                        setIsEditing(false);
                        try { refetch && refetch(); } catch (e) {}
                      } catch (err) {
                        toast.error(err?.data?.error || err?.message || 'Cập nhật thất bại');
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
                      if (referral) {
                        setForm({
                          name: referral.name || referral.partner_name || '',
                          contact_name: referral.contact_name || referral.contact || '',
                          phone: referral.phone || referral.phone_number || '',
                          email: referral.email || '',
                          address: referral.address || '',
                          note: referral.note || '',
                        });
                      }
                    }}
                    className="text-sm bg-gray-200 border px-3 py-1 rounded"
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="text-sm bg-blue-600 border px-3 py-1 rounded text-white">Chỉnh sửa</button>
              )}
            </div>
          </div>
          <hr className="my-4" />

          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <div className="text-xs text-gray-500">Tên đối tác</div>
              {isEditing ? (
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" />
              ) : (
                <div className="text-sm font-semibold text-blue-600">{referral.name || referral.partner_name || '—'}</div>
              )}
            </div>


            <div>
              <div className="text-xs text-gray-500">Điện thoại</div>
              {isEditing ? (
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" />
              ) : (
                <div className="text-sm">{referral.phone || referral.phone_number || '—'}</div>
              )}
            </div>

            <div>
              <div className="text-xs text-gray-500">Email</div>
              {isEditing ? (
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" />
              ) : (
                <div className="text-sm">{referral.email || '—'}</div>
              )}
            </div>

            {isEditing ? (
              <div>
                <div className="text-xs text-gray-500">Địa chỉ</div>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" />
              </div>
            ) : (
              referral.address && (
                <div>
                  <div className="text-xs text-gray-500">Địa chỉ</div>
                  <div className="text-sm">{referral.address}</div>
                </div>
              )
            )}

            {isEditing ? (
              <div>
                <div className="text-xs text-gray-500">Ghi chú</div>
                <textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="mt-1 block w-full border rounded px-3 py-2" rows={4} />
              </div>
            ) : (
              referral.note && (
                <div>
                  <div className="text-xs text-gray-500">Ghi chú</div>
                  <div className="text-sm">{referral.note}</div>
                </div>
              )
            )}

            <div>
              <div className="text-xs text-gray-500">Trạng thái</div>
              <div className="text-sm">
                <span className={`px-2 py-1 rounded text-xs ${
                  referral.is_active === false 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {referral.is_active === false ? 'Không hoạt động' : 'Hoạt động'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-7 bg-white rounded shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-md font-semibold text-blue-700">Khách hàng liên kết</h2>
          </div>

          {customersLoading ? (
            <div className="text-sm text-gray-600">Đang tải danh sách khách hàng...</div>
          ) : customers.length === 0 ? (
            <div className="text-sm text-gray-600">Chưa có khách hàng nào được giới thiệu bởi đối tác này</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-[#e7f1fd] text-left">
                  <tr>
                    <th className="px-4 py-3 text-blue-700">Tên khách hàng</th>
                    <th className="px-4 py-3 text-blue-700">Email</th>
                    <th className="px-4 py-3 text-blue-700">Điện thoại</th>
                    <th className="px-4 py-3 text-blue-700">Trạng thái</th>
                    <th className="px-4 py-3 text-blue-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 align-top">{customer.name || customer.customer_name || '—'}</td>
                      <td className="px-4 py-3 align-top">{customer.email || '—'}</td>
                      <td className="px-4 py-3 align-top">{customer.phone || customer.phone_number || '—'}</td>
                      <td className="px-4 py-3 align-top">
                        <span className={`px-2 py-1 rounded text-xs ${
                          customer.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : customer.status === 'potential'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {customer.status === 'active' ? 'Hoạt động' : customer.status === 'potential' ? 'Tiềm năng' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link to={`/customer/${customer.id}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">
                          Xem chi tiết
                        </Link>
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
