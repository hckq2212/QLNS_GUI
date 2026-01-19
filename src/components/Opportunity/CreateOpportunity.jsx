import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import customerAPI from '../../api/customer.js';
import { useGetServiceJobsQuery } from '../../services/serviceJob.js';
import { toast } from 'react-toastify';
import { useGetServicesQuery } from '../../services/service.js';
import { useGetAllBusinessFieldsQuery } from '../../services/businessField.js';
import { PRIORITY_OPTIONS, REGION_OPTIONS } from '../../utils/enums';
import { formatPrice } from '../../utils/FormatValue';
import { useCreateOpportunityMutation } from '../../services/opportunity.js';

export default function CreateOpportunity() {
  const token = useSelector((state) => state.auth.accessToken);
  const navigate = useNavigate();
  const [createOpportunity, { isLoading: creating }] = useCreateOpportunityMutation();

  // Helper functions for price formatting
  const formatPriceInput = (value) => {
    if (!value) return '';
    const numValue = String(value).replace(/[^0-9]/g, '');
    return numValue ? formatPrice(numValue) : '';
  };

  const parsePriceInput = (value) => {
    if (!value) return '';
    return String(value).replace(/[^0-9]/g, '');
  };

  // FORM STATE
  const [createdOpportunityId, setCreatedOpportunityId] = useState(null);
  const [opportunityName, setOpportunityName] = useState('');
  const [description, setDescription] = useState('');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [expectedRevenue, setExpectedRevenue] = useState('');
  const [budget, setBudget] = useState('');
  const [successProbability, setSuccessProbability] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [expectedStartDate, setExpectedStartDate] = useState('');
  const [priority, setPriority] = useState(PRIORITY_OPTIONS[1]?.value || 'medium');
  const [region, setRegion] = useState(REGION_OPTIONS[0]?.value || 'all');
  const [businessField, setBusinessField] = useState('');
  const [implementationMonths, setImplementationMonths] = useState('');
  const [services, setServices] = useState([{ service_id: '', quantity: 1, proposed_price: '' }]);
  const [createProject, setCreateProject] = useState('Không');
  const [approver, setApprover] = useState('');
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [links, setLinks] = useState(['']);
  const fileInputRef = useRef(null);

  // Error states
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);

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

  // LẤY BUSINESS FIELDS bằng RTK Query
  const {
    data: businessFieldsData,
    isLoading: loadingBusinessFields,
    isError: businessFieldsError,
  } = useGetAllBusinessFieldsQuery(undefined, { skip: !token });

  const availableBusinessFields = Array.isArray(businessFieldsData)
    ? businessFieldsData
    : Array.isArray(businessFieldsData?.items)
      ? businessFieldsData.items
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

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setShowErrors(true);
      toast.error('Vui lòng điền đầy đủ thông tin');
      // Scroll to first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(`[data-field="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      const payload = {};

      // customer info is collected in step 2 after opportunity is created
      if (opportunityName) payload.name = opportunityName;
      payload.description = description;
      payload.expected_price = Number(expectedPrice);
      payload.expected_revenue = Number(expectedRevenue);
      if (budget) payload.expected_budget = Number(budget);
      if (successProbability) payload.success_rate = Number(successProbability);
      if (expectedEndDate) payload.expected_end_date = expectedEndDate;
      if (expectedStartDate) payload.estimated_start_date = expectedStartDate;
      if (priority) payload.priority = priority;
      if (region) payload.region = region;
      if (businessField) payload.business_field = businessField;
      if (implementationMonths) payload.implementation_months = Number(implementationMonths);
      payload.services = services
        .filter((s) => s.service_id)
        .map((s) => ({
          service_id: Number(s.service_id),
          quantity: Number(s.quantity) || 1,
          proposed_price: s.proposed_price ? Number(s.proposed_price) : undefined,
        }));

      // Prepare valid links
      const validLinks = links.filter(link => link.trim() !== '');

      // If attachments (files) are selected or links provided, build FormData and append fields/files
      let toSend = payload;
      if ((attachments && attachments.length > 0) || validLinks.length > 0) {
        const fd = new FormData();
        // append scalar fields
        if (payload.name) fd.append('name', payload.name);
        if (payload.description) fd.append('description', payload.description);
        if (payload.expected_price !== undefined) fd.append('expected_price', String(payload.expected_price));
        if (payload.expected_revenue !== undefined) fd.append('expected_revenue', String(payload.expected_revenue));
        if (payload.expected_budget !== undefined) fd.append('expected_budget', String(payload.expected_budget));
        if (payload.success_rate !== undefined) fd.append('success_rate', String(payload.success_rate));
        if (payload.expected_end_date) fd.append('expected_end_date', payload.expected_end_date);
        if (payload.estimated_start_date) fd.append('estimated_start_date', payload.estimated_start_date);
        if (payload.priority) fd.append('priority', payload.priority);
        if (payload.region) fd.append('region', payload.region);
        if (payload.business_field) fd.append('business_field', payload.business_field);
        if (payload.implementation_months !== undefined) fd.append('implementation_months', String(payload.implementation_months));
        // services as JSON string
        fd.append('services', JSON.stringify(payload.services || []));
        // append files under field name 'attachments' (server uses upload.array('attachments', 5))
        attachments.forEach((f) => fd.append('attachments', f));
        // append links as JSON to be merged into attachments array by backend
        if (validLinks.length > 0) {
          fd.append('attachments', JSON.stringify(validLinks.map(link => ({ type: 'link', url: link }))));
        }
        toSend = fd;
      }

      const res = await createOpportunity(toSend).unwrap();

      toast.success('Tạo cơ hội thành công');

      // Navigate to the newly created opportunity detail page
      const opportunityId = res?.id || res?.data?.id || res?.opportunity?.id

      if (opportunityId) {
        // Use setTimeout to ensure toast doesn't interfere with navigation
        setTimeout(() => {
          navigate(`/opportunity/${opportunityId}`, { replace: true });
        }, 100);
      } else {
        console.error('No opportunity ID in response. Full response:', JSON.stringify(res, null, 2));
      }
    } catch (err) {
      toast.error('Tạo cơ hội thất bại');
    }
  }

  // DANH SÁCH ID ĐÃ CHỌN (để chặn chọn trùng)
  const selectedIds = services.map((x) => String(x.service_id || '')).filter(Boolean);

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    if (!opportunityName?.trim()) newErrors.opportunityName = 'Vui lòng nhập tên cơ hội';
    if (!description?.trim()) newErrors.description = 'Vui lòng nhập mô tả';
    if (!businessField) newErrors.businessField = 'Vui lòng chọn lĩnh vực';
    if (!expectedRevenue) newErrors.expectedRevenue = 'Vui lòng nhập doanh thu kỳ vọng';
    if (!expectedStartDate) newErrors.expectedStartDate = 'Vui lòng chọn ngày dự kiến khởi công';
    if (!expectedEndDate) newErrors.expectedEndDate = 'Vui lòng chọn ngày dự kiến kết thúc';
    if (!implementationMonths) newErrors.implementationMonths = 'Vui lòng nhập số tháng triển khai';
    if (!budget) newErrors.budget = 'Vui lòng nhập ngân sách dự kiến';
    if (!successProbability) newErrors.successProbability = 'Vui lòng nhập khả năng thành công';
    const hasService = services.some(s => s.service_id);
    if (!hasService) newErrors.services = 'Vui lòng chọn ít nhất một dịch vụ';
    return newErrors;
  };

  const isFormValid = () => {
    const newErrors = validateForm();
    return Object.keys(newErrors).length === 0;
  };

  function handleFilesChange(e) {
    const files = Array.from(e.target.files || []);
    // validation: max 5 files and total <= 25MB
    if (files.length > 5) {
      toast.error('Chỉ được upload tối đa 5 file');
      e.target.value = null;
      setAttachments([]);
      return;
    }
    const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
    const MAX = 25 * 1024 * 1024; // 25MB
    if (totalSize > MAX) {
      toast.error('Tổng dung lượng file không được vượt quá 25MB');
      e.target.value = null;
      setAttachments([]);
      return;
    }
    setAttachments(files);
  }

  return (
    <div className="p-6 w-full mx-auto">

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow flex flex-col max-w-7xl mx-auto">
        <h2 className="text-2xl font-semibold mb-2 text-blue-600">Tạo cơ hội</h2>
        <hr />
        <div className="mb-2" data-field="opportunityName">
          <input
            type="text"
            value={opportunityName}
            onChange={(e) => setOpportunityName(e.target.value)}
            className={`mt-1 w-full border rounded p-2 ${showErrors && errors.opportunityName ? 'border-red-500' : ''}`}
            placeholder="Nhập tên doanh nghiệp. VD: GETVINI"
          />
          {showErrors && errors.opportunityName && (
            <div className="text-red-500 text-sm mt-1">{errors.opportunityName}</div>
          )}
        </div>
        {/* mô tả */}
        <div className="relative" data-field="description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`mt-2 w-full border rounded p-2 ${showErrors && errors.description ? 'border-red-500' : ''}`}
            rows={4}
            placeholder="Mô tả"
            maxLength={200}
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {description.length}/200
          </div>
          {showErrors && errors.description && (
            <div className="text-red-500 text-sm mt-1">{errors.description}</div>
          )}
        </div>

        <div className="mb-2" data-field="businessField">
          <label className="block text-sm text-gray-700 mb-1">Lĩnh vực</label>
          <select
            value={businessField}
            onChange={(e) => setBusinessField(e.target.value)}
            className={`w-full border rounded p-2 ${showErrors && errors.businessField ? 'border-red-500' : ''}`}
            disabled={loadingBusinessFields || businessFieldsError}
          >
            <option value="">-- Chọn lĩnh vực --</option>
            {availableBusinessFields.map((bf) => (
              <option key={bf.code} value={bf.code}>
                {bf.name}
              </option>
            ))}
          </select>
          {showErrors && errors.businessField && (
            <div className="text-red-500 text-sm mt-1">{errors.businessField}</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="space-y-3">
            <div className="flex items-center gap-3" data-field="expectedRevenue">
              <label className="w-100 text-sm text-gray-700">Doanh thu kỳ vọng</label>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={expectedRevenue ? formatPriceInput(expectedRevenue) : ''}
                  onChange={(e) => setExpectedRevenue(parsePriceInput(e.target.value))}
                  className={`border rounded p-2 w-full pr-12 ${showErrors && errors.expectedRevenue ? 'border-red-500' : ''}`}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">VNĐ</span>
              </div>
            </div>
            {showErrors && errors.expectedRevenue && (
              <div className="text-red-500 text-sm ml-24">{errors.expectedRevenue}</div>
            )}
            <div className="flex items-center gap-3" data-field="expectedStartDate">
              <label className="w-40 text-sm text-gray-700">Dự kiến khởi công</label>
              <div className="flex-1">
                <input
                  type="date"
                  value={expectedStartDate}
                  onChange={(e) => setExpectedStartDate(e.target.value)}
                  className={`border rounded p-2 ${showErrors && errors.expectedStartDate ? 'border-red-500' : ''}`}
                />
                {showErrors && errors.expectedStartDate && (
                  <div className="text-red-500 text-sm mt-1">{errors.expectedStartDate}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3" data-field="expectedEndDate">
              <label className="w-40 text-sm text-gray-700">Dự kiến kết thúc</label>
              <div className="flex-1">
                <input
                  type="date"
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  className={`border rounded p-2 ${showErrors && errors.expectedEndDate ? 'border-red-500' : ''}`}
                />
                {showErrors && errors.expectedEndDate && (
                  <div className="text-red-500 text-sm mt-1">{errors.expectedEndDate}</div>
                )}
              </div>
            </div>



            <div className="flex items-center gap-3">
              <label className="w-40 text-sm text-gray-700">Vùng miền triển khai</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="border rounded p-2">
                {REGION_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3" data-field="implementationMonths">
              <label className="w-40 text-sm text-gray-700">Số tháng triển khai</label>
              <div className="flex-1">
                <div className="relative w-20">
                  <input
                    type="number"
                    min="1"
                    value={implementationMonths}
                    onChange={(e) => setImplementationMonths(e.target.value)}
                    className={`border rounded p-2 w-20  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${showErrors && errors.implementationMonths ? 'border-red-500' : ''}`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">Tháng</span>
                </div>
                {showErrors && errors.implementationMonths && (
                  <div className="text-red-500 text-sm mt-1">{errors.implementationMonths}</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3" data-field="budget">
              <label className="w-40 text-sm text-gray-700">Ngân sách dự kiến</label>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={budget ? formatPriceInput(budget) : ''}
                  onChange={(e) => setBudget(parsePriceInput(e.target.value))}
                  className={`border rounded p-2 w-full pr-12 ${showErrors && errors.budget ? 'border-red-500' : ''}`}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">VNĐ</span>
              </div>
            </div>
            {showErrors && errors.budget && (
              <div className="text-red-500 text-sm ml-44">{errors.budget}</div>
            )}

            <div className="flex items-center gap-3">
              <label className="w-40 text-sm text-gray-700">Độ ưu tiên</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border rounded p-2">
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3" data-field="successProbability">
              <label className="w-40 text-sm text-gray-700">Khả năng thành công</label>
              <div className="flex-1">
                <div className="relative w-20">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={successProbability}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) {
                        setSuccessProbability(val);
                      }
                    }}
                    className={`border rounded p-2  w-15 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${showErrors && errors.successProbability ? 'border-red-500' : ''}`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">%</span>
                </div>
                {showErrors && errors.successProbability && (
                  <div className="text-red-500 text-sm mt-1">{errors.successProbability}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* chọn dịch vụ */}
        <div data-field="services">
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
))}          <input
            disabled
            value={formatPrice(expectedPrice)}
            className="mt-3 w-full border rounded p-2 bg-gray-100"
            placeholder="Giá dự kiến (tự tính)"
          />
          {showErrors && errors.services && (
            <div className="text-red-500 text-sm mt-2">{errors.services}</div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả yêu cầu khách hàng</label>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-500 mb-2">Link tài liệu</label>
            {links.map((link, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => {
                    const newLinks = [...links];
                    newLinks[idx] = e.target.value;
                    setLinks(newLinks);
                  }}
                  className="flex-1 border rounded p-2"
                  placeholder="https://"
                />
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                    className="text-red-600 px-3"
                  >
                    Xóa
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLinks([...links, ''])}
              className="text-blue-600 text-sm"
            >
              + Thêm link
            </button>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">Tệp đính kèm (tối đa 5 file, tổng 25MB)</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFilesChange}
              className="mb-2"
            />
            {attachments && attachments.length > 0 && (
              <div className="text-sm text-gray-600 mb-2">
                {attachments.map((f) => (
                  <div key={f.name}>{f.name} — {(f.size / 1024 / 1024).toFixed(2)} MB</div>
                ))}
              </div>
            )}
          </div>

        </div>
        <button 
          disabled={creating} 
          type="submit" 
          className={`px-4 py-2 rounded text-white transition-colors ${
            isFormValid() 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {creating ? 'Đang gửi...' : 'Tạo cơ hội'}
        </button>
      </form>
    </div>
  );
}
