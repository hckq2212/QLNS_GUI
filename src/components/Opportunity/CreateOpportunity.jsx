import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import customerAPI from '../../api/customer.js';
import serviceJob from '../../api/serviceJob.js';
import { toast } from 'react-toastify';
import { useGetServicesQuery } from '../../services/service.js';
import { useCreateOpportunityMutation } from '../../services/opportunity.js';

export default function CreateOpportunity() {
  const token = useSelector((state) => state.auth.accessToken);
  const [createOpportunity, { isLoading: creating }] = useCreateOpportunityMutation();

  // FORM STATE
  const [customerMode, setCustomerMode] = useState('existing');
  const [customerId, setCustomerId] = useState('');
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [description, setDescription] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [services, setServices] = useState([{ service_id: '', quantity: 1, proposed_price: '' }]);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [availableServiceJobs, setAvailableServiceJobs] = useState([]);

  // LẤY SERVICE BẰNG RTK QUERY (có token mới gọi)
  const {
    data: servicesData,
    isLoading: loadingServices,
    isError: servicesError,
    error: servicesErrorObj,   
  } = useGetServicesQuery(undefined, { skip: !token });

  // chuẩn hoá dữ liệu service
  const availableServices = Array.isArray(servicesData)
    ? servicesData
    : Array.isArray(servicesData?.items)
    ? servicesData.items
    : [];


  // LẤY CUSTOMER CŨ BẰNG API CŨ
  useEffect(() => {
    (async () => {
      try {
        const data = await customerAPI.getAll();
        setAvailableCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('failed to load customers', err);
      }
    })();
  }, []);

  // LẤY SERVICE JOB
  useEffect(() => {
    (async () => {
      try {
        const data = await serviceJob.getAll();
        setAvailableServiceJobs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('failed to load service jobs', err);
      }
    })();
  }, []);

  // THÊM / XOÁ / SỬA DÒNG DỊCH VỤ
  function addServiceRow() {
    setServices((s) => [...s, { service_id: '', quantity: 1, proposed_price: '' }]);
  }
  function removeServiceRow(idx) {
    setServices((s) => s.filter((_, i) => i !== idx));
  }
  function updateService(idx, field, value) {
    setServices((s) => s.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  // TÍNH GIÁ DỰ KIẾN
  useEffect(() => {
    const total = services.reduce((acc, s) => {
      const svc = availableServices.find((a) => String(a.id) === String(s.service_id));
      // backend của bạn trả base_cost là string -> convert sang number
      const base = svc ? Number(svc.base_cost) || 0 : 0;
      return acc + base * (Number(s.quantity) || 1);
    }, 0);
    setExpectedPrice(total);
  }, [services, availableServices]);

  // SUBMIT
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const payload = {};

      if (customerMode === 'existing' && customerId) {
        payload.customer_id = Number(customerId);
      } else if (customerMode === 'temp') {
        payload.customer_temp = JSON.stringify({
          name: tempName,
          email: tempEmail,
          phone: tempPhone,
        });
      }

      payload.description = description;
      payload.expected_price = Number(expectedPrice);
      payload.services = services
        .filter((s) => s.service_id)
        .map((s) => ({
          service_id: Number(s.service_id),
          quantity: Number(s.quantity) || 1,
          proposed_price: s.proposed_price ? Number(s.proposed_price) : undefined,
        }));

      await createOpportunity(payload).unwrap();

      toast.success('Tạo cơ hội thành công');

      // reset
      setCustomerId('');
      setTempName('');
      setTempEmail('');
      setTempPhone('');
      setDescription('');
      setExpectedPrice('');
      setServices([{ service_id: '', quantity: 1, proposed_price: '' }]);
    } catch (err) {
      console.error('Tạo cơ hội thất bại:', err);
      toast.error('Tạo cơ hội thất bại');
    }
  }

  // DANH SÁCH ID ĐÃ CHỌN (để chặn chọn trùng)
  const selectedIds = services.map((x) => String(x.service_id || '')).filter(Boolean);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow flex flex-col">
        <label className="block text-lg font-medium text-left">Chọn khách hàng</label>

        {/* chọn KH cũ / mới */}
        <div className="flex gap-4 mb-2">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={customerMode === 'existing'}
              onChange={() => {
                setCustomerMode('existing');
                setTempName('');
                setTempEmail('');
                setTempPhone('');
              }}
            />
            Khách hàng cũ
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={customerMode === 'temp'}
              onChange={() => {
                setCustomerMode('temp');
                setCustomerId('');
              }}
            />
            Khách hàng mới
          </label>
        </div>

        {customerMode === 'existing' ? (
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">-- Chọn khách hàng --</option>
            {availableCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.full_name || c.id}
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-2 flex flex-col">
            <input
              className="border rounded p-2"
              placeholder="Tên KH"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
            />
            <input
              className="border rounded p-2"
              placeholder="Email KH"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
            />
            <input
              className="border rounded p-2"
              placeholder="SĐT KH"
              value={tempPhone}
              onChange={(e) => setTempPhone(e.target.value)}
            />
          </div>
        )}

        {/* mô tả */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-2 w-full border rounded p-2"
          rows={4}
          placeholder="Mô tả"
        />

        {/* chọn dịch vụ */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Chọn dịch vụ</h3>
            <button type="button" onClick={addServiceRow} className="text-blue-600">
              + Thêm dịch vụ
            </button>
          </div>

          {services.map((s, idx) => (
            <div key={idx} className="grid grid-cols-8 gap-2 mb-2">
              <div className="col-span-6">
                <select
                  value={s.service_id}
                  onChange={(e) => updateService(idx, 'service_id', e.target.value)}
                  className="border p-2 w-full rounded"
                  disabled={loadingServices || servicesError}
                >
                  <option value="">-- Chọn dịch vụ --</option>
                  {availableServices
                    .filter(
                      (sv) =>
                        String(sv.id) === String(s.service_id) || !selectedIds.includes(String(sv.id))
                    )
                    .map((sv) => (
                      <option key={sv.id} value={sv.id}>
                        {sv.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  min="1"
                  value={s.quantity}
                  onChange={(e) => updateService(idx, 'quantity', e.target.value)}
                  className="border p-2 w-full rounded"
                />
              </div>
              <div>
                <button type="button" onClick={() => removeServiceRow(idx)} className="text-red-600">
                  Xóa
                </button>
              </div>
            </div>
          ))}

          <input
            disabled
            value={expectedPrice}
            className="mt-3 w-full border rounded p-2 bg-gray-100"
            placeholder="Giá dự kiến (tự tính)"
          />
        </div>

        <button disabled={creating} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {creating ? 'Đang gửi...' : 'Tạo cơ hội'}
        </button>
      </form>
    </div>
  );
}
