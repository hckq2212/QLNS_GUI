import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import customerAPI from '../../api/customer.js';
import { useGetServiceJobsQuery } from '../../services/serviceJob.js';
import { toast } from 'react-toastify';
import { useGetServicesQuery } from '../../services/service.js';
import { PRIORITY_OPTIONS, REGION_OPTIONS } from '../../utils/enums';
import { useCreateOpportunityMutation } from '../../services/opportunity.js';

export default function CreateOpportunity() {
  const token = useSelector((state) => state.auth.accessToken);
  const [createOpportunity, { isLoading: creating }] = useCreateOpportunityMutation();

  // FORM STATE
  const [createdOpportunityId, setCreatedOpportunityId] = useState(null);
  const [opportunityName, setOpportunityName] = useState('');
  const [description, setDescription] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [expectedRevenue, setExpectedRevenue] = useState('');
  const [budget, setBudget] = useState('');
  const [successProbability, setSuccessProbability] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [priority, setPriority] = useState(PRIORITY_OPTIONS[1]?.value || 'medium');
  const [region, setRegion] = useState(REGION_OPTIONS[0]?.value || 'all');
  const [services, setServices] = useState([{ service_id: '', quantity: 1, proposed_price: '' }]);

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




  // LẤY SERVICE JOB bằng RTK Query
  const {
    data: serviceJobsData,
    isLoading: loadingServiceJobs,
    isError: serviceJobsError,
    error: serviceJobsErrorObj,
  } = useGetServiceJobsQuery(undefined, { skip: !token });

  const availableServiceJobs = Array.isArray(serviceJobsData)
    ? serviceJobsData
    : Array.isArray(serviceJobsData?.items)
    ? serviceJobsData.items
    : [];

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

      // customer info is collected in step 2 after opportunity is created
  if (opportunityName) payload.name = opportunityName;
  payload.description = description;
  payload.expected_price = Number(expectedPrice);
  payload.expected_revenue = Number(expectedRevenue);
  if (budget) payload.budget = Number(budget);
  if (successProbability) payload.success_rate = Number(successProbability);
  if (expectedEndDate) payload.expected_end_date = expectedEndDate;
  if (priority) payload.priority = priority;
  if (region) payload.region = region;
      payload.services = services
        .filter((s) => s.service_id)
        .map((s) => ({
          service_id: Number(s.service_id),
          quantity: Number(s.quantity) || 1,
          proposed_price: s.proposed_price ? Number(s.proposed_price) : undefined,
        }));

        console.log(payload)
  const res = await createOpportunity(payload).unwrap();
  toast.success('Tạo cơ hội thành công');
  // move to step 2 for customer info
  setCreatedOpportunityId(res?.id || null);
  // keep form state (we'll fill customer in step 2)
  // reset form inputs after successful creation
  setOpportunityName('');
  setDescription('');
  setExpectedPrice('');
  setExpectedRevenue('');
  setBudget('');
  setSuccessProbability('');
  setExpectedEndDate('');
  setPriority(PRIORITY_OPTIONS[1]?.value || 'medium');
  setCreateProject('Không');
  setRegion(REGION_OPTIONS[0]?.value || 'all');
  setApprover('');
  setServices([{ service_id: '', quantity: 1, proposed_price: '' }]);
  setAvailableCustomers([]);
    } catch (err) {
      console.error('Tạo cơ hội thất bại:', err);
      toast.error('Tạo cơ hội thất bại');
    }
  }

  // DANH SÁCH ID ĐÃ CHỌN (để chặn chọn trùng)
  const selectedIds = services.map((x) => String(x.service_id || '')).filter(Boolean);

  return (
    <div className="p-6 w-full mx-auto">

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow flex flex-col max-w-7xl mx-auto">
        <h2 className="text-2xl font-semibold mb-2">Thông tin cơ hội</h2>
        <div className="mb-2">
          <input
            type="text"
            value={opportunityName}
            onChange={(e) => setOpportunityName(e.target.value)}
            className="mt-1 w-full border rounded p-2"
            placeholder="Nhập tên cơ hội"
          />
        </div>
        {/* mô tả */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-2 w-full border rounded p-2"
          rows={4}
          placeholder="Mô tả"
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 ">
              <label className="w-100 text-sm text-gray-700">Doanh thu kỳ vọng</label>
                <input
                type="number"
                value={expectedRevenue}
                onChange={(e) => setExpectedRevenue(e.target.value)}
                className="border rounded p-2 flex-1"
                placeholder="VNĐ"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-40 text-sm text-gray-700">Dự kiến kết thúc</label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="border rounded p-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-40 text-sm text-gray-700">Vùng miền triển khai</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="border rounded p-2">
                {REGION_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="w-40 text-sm text-gray-700">Ngân sách dự kiến</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="border rounded p-2 flex-1"
                placeholder="VNĐ"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-40 text-sm text-gray-700">Độ ưu tiên</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border rounded p-2">
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-40 text-sm text-gray-700">Khả năng thành công</label>
              <input
                type="number"
                min="0"
                max="100"
                value={successProbability}
                onChange={(e) => setSuccessProbability(e.target.value)}
                className="border rounded p-2 w-40"
                placeholder="%"
              />
            </div>
          </div>
        </div>

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
