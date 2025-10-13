
import React, { useState, useEffect } from 'react';
import opportunityAPI from '../api/opportunity.js';
import serviceAPI from '../api/service.js';
import serviceJob from '../api/serviceJob.js'
import customerAPI from '../api/customer.js';

export default function Opportunity() {
    const [customerId, setCustomerId] = useState('');
    const [tempName, setTempName] = useState('');
    const [tempEmail, setTempEmail] = useState('');
    const [tempPhone, setTempPhone] = useState('');
    const [description, setDescription] = useState('');
    const [expectedPrice, setExpectedPrice] = useState('');
    const [services, setServices] = useState([
        { service_id: '', service_job_id: '', quantity: 1, proposed_price: '' },
    ]);
    const [availableServices, setAvailableServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [servicesError, setServicesError] = useState(null);
    const [availableCustomers, setAvailableCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [customersError, setCustomersError] = useState(null);
    // cache for service-job names keyed by id
    const [serviceJobNames, setServiceJobNames] = useState({});
    const [loadingServiceJobs, setLoadingServiceJobs] = useState({});
    const [serviceJobErrors, setServiceJobErrors] = useState({});
    const [availableServiceJobs, setAvailableServiceJobs] = useState([]);
    const [loadingServiceJobList, setLoadingServiceJobList] = useState(false);
    const [serviceJobListError, setServiceJobListError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // whether temp customer inputs should be disabled (when an existing customer is selected)
    const tempDisabled = customerId && customerId.toString().trim() !== '';

    function addServiceRow() {
        setServices((s) => [...s, { service_id: '', service_job_id: '', quantity: 1, proposed_price: '' }]);
    }

    function removeServiceRow(idx) {
        setServices((s) => s.filter((_, i) => i !== idx));
    }

    function updateService(idx, field, value) {
        setServices((s) => s.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);
        try {
            const payload = {};
            if (customerId && customerId.toString().trim() !== '') {
                payload.customer_id = Number(customerId);
            } else {
                // use customer_temp when no customer_id provided
                const temp = { name: tempName || null, email: tempEmail || null, phone: tempPhone || null };
                payload.customer_temp = JSON.stringify(temp);
            }
            if (description) payload.description = description;
            if (expectedPrice !== '') payload.expected_price = Number(expectedPrice);

            // include services where service_id is present
            const svcPayload = services
                .filter((s) => s.service_id && s.service_id.toString().trim() !== '')
                .map((s) => ({
                    service_id: Number(s.service_id),
                    service_job_id: s.service_job_id ? Number(s.service_job_id) : undefined,
                    quantity: s.quantity != null ? Number(s.quantity) : 1,
                    proposed_price: s.proposed_price !== '' ? Number(s.proposed_price) : undefined,
                }));
            if (svcPayload.length > 0) payload.services = svcPayload;

            const created = await opportunityAPI.create(payload);
            setMessage('Opportunity created successfully');
            // clear form
            setCustomerId('');
            setTempName('');
            setTempEmail('');
            setTempPhone('');
            setDescription('');
            setExpectedPrice('');
            setServices([{ service_id: '', service_job_id: '', quantity: 1, proposed_price: '' }]);
            console.log('created', created);
        } catch (err) {
            console.error('create opportunity failed', err?.response || err.message || err);
            setError(err?.response?.data?.error || err.message || 'Failed to create opportunity');
        } finally {
            setLoading(false);
        }
    }

        // Print a summary of the current opportunity form (for sales to hand to customer)
        function formatCurrency(n) {
                if (n == null || n === '') return '';
                return new Intl.NumberFormat('vi-VN').format(Number(n));
        }

        function handlePrint() {
                // build customer info
                const customer = customerId
                        ? (availableCustomers.find((c) => String(c.id) === String(customerId)) || { name: `Customer #${customerId}` })
                        : { name: tempName || '(Khách hàng tạm)' , email: tempEmail || '', phone: tempPhone || '' };

                // build services table rows
                const rows = services
                        .filter((s) => s.service_id && s.service_id.toString().trim() !== '')
                        .map((s) => {
                                const svc = availableServices.find((a) => String(a.id) === String(s.service_id)) || {};
                                const sj = availableServiceJobs.find((j) => String(j.id) === String(s.service_job_id)) || {};
                                const unit = getServiceBaseCostValue(svc);
                                const qty = s.quantity != null && s.quantity !== '' ? Number(s.quantity) : 1;
                                const lineTotal = unit * qty;
                                return {
                                        serviceName: svc.name || `Service #${s.service_id}`,
                                        serviceJobName: sj.name || sj.title || (s.service_job_id ? `Job #${s.service_job_id}` : ''),
                                        qty,
                                        unit,
                                        lineTotal,
                                        proposed_price: s.proposed_price !== '' ? Number(s.proposed_price) : undefined,
                                };
                        });

                const total = rows.reduce((acc, r) => acc + (r.lineTotal || 0), 0) || expectedPrice || 0;

                const html = `
                        <html>
                        <head>
                            <meta charset="utf-8" />
                            <title>Opportunity</title>
                            <style>
                                body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color:#111 }
                                h1 { font-size: 20px; margin-bottom: 4px }
                                .meta { margin-bottom: 12px }
                                table { width: 100%; border-collapse: collapse; margin-top: 12px }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left }
                                th { background: #f7f7f7 }
                                .right { text-align: right }
                            </style>
                        </head>
                        <body>
                            <h1>Opportunity</h1>
                            <div class="meta">
                                <div><strong>Customer:</strong> ${customer.name || ''}</div>
                                <div><strong>Email:</strong> ${customer.email || ''}</div>
                                <div><strong>Phone:</strong> ${customer.phone || ''}</div>
                                <div><strong>Description:</strong> ${description || ''}</div>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Dịch vụ</th>
                                        <th>Job</th>
                                        <th class="right">Qty</th>
                                        <th class="right">Unit</th>
                                        <th class="right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows.map((r, i) => `
                                        <tr>
                                            <td>${i + 1}</td>
                                            <td>${r.serviceName}</td>
                                            <td>${r.serviceJobName || ''}</td>
                                            <td class="right">${r.qty}</td>
                                            <td class="right">${formatCurrency(r.unit)}</td>
                                            <td class="right">${formatCurrency(r.lineTotal)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="5" class="right"><strong>Tổng</strong></td>
                                        <td class="right"><strong>${formatCurrency(total)}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                            <div style="margin-top:20px">Generated: ${new Date().toLocaleString()}</div>
                        </body>
                        </html>
                `;

                const w = window.open('', '_blank', 'noopener');
                if (!w) {
                        alert('Không thể mở cửa sổ in — cho phép popup cho trang này.');
                        return;
                }
                w.document.write(html);
                w.document.close();
                w.focus();
                // Wait a tick to ensure resources loaded then print
                setTimeout(() => {
                        try { w.print(); } catch (e) { console.error('print failed', e); }
                }, 200);
        }

    // no list fetching — this component only creates an opportunity

    // fetch available services for select
    useEffect(() => {
        (async () => {
            setLoadingServices(true);
            setServicesError(null);
            try {
                const data = await serviceAPI.getAll();
                setAvailableServices(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('failed to load services', err);
                setServicesError(err?.response?.data?.error || err.message || 'Failed to load services');
            } finally {
                setLoadingServices(false);
            }
        })();
    }, []);

    // fetch available customers for select
    useEffect(() => {
        (async () => {
            setLoadingCustomers(true);
            setCustomersError(null);
            try {
                const data = await customerAPI.getAll();
                setAvailableCustomers(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('failed to load customers', err);
                setCustomersError(err?.response?.data?.error || err.message || 'Failed to load customers');
            } finally {
                setLoadingCustomers(false);
            }
        })();
    }, []);

    // fetch available service-jobs for select
    useEffect(() => {
        (async () => {
            setLoadingServiceJobList(true);
            setServiceJobListError(null);
            try {
                const data = await serviceJob.getAll();
                setAvailableServiceJobs(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('failed to load service jobs', err);
                setServiceJobListError(err?.response?.data?.error || err.message || 'Failed to load service jobs');
            } finally {
                setLoadingServiceJobList(false);
            }
        })();
    }, []);

    // auto-calculate expected price as sum of service base cost * quantity
    function getServiceBaseCostValue(sv) {
        if (!sv) return 0;
        // try common field names
        const candidates = ['base_cost', 'baseCost', 'price', 'cost', 'base_price'];
        for (const key of candidates) {
            if (Object.prototype.hasOwnProperty.call(sv, key) && sv[key] != null) {
                const n = Number(sv[key]);
                return Number.isFinite(n) ? n : 0;
            }
        }
        return 0;
    }

    useEffect(() => {
        // compute total expected price from selected services
        const total = services.reduce((acc, s) => {
            if (!s.service_id || s.service_id.toString().trim() === '') return acc;
            const svc = availableServices.find((a) => String(a.id) === String(s.service_id));
            const base = getServiceBaseCostValue(svc);
            const qty = s.quantity != null && s.quantity !== '' ? Number(s.quantity) : 1;
            return acc + base * qty;
        }, 0);
        // set as number (input will show it); keep '' if zero to preserve previous behavior? set 0 for clarity
        setExpectedPrice(total);
    }, [services, availableServices]);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Tạo Opportunity</h2>
            {message && <div className="p-2 mb-4 bg-green-100 text-green-800 rounded">{message}</div>}
            {error && <div className="p-2 mb-4 bg-red-100 text-red-800 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Customer (optional)</label>
                        {loadingCustomers ? (
                            <div className="mt-1 text-xs text-gray-500">Đang tải khách hàng...</div>
                        ) : customersError ? (
                            <div className="mt-1 text-xs text-red-600">{customersError}</div>
                        ) : (
                            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 w-full border rounded p-2">
                                <option value="">-- Khách hàng (optional) --</option>
                                {availableCustomers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name || c.full_name || c.id}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Expected price (auto)</label>
                        <input value={expectedPrice} disabled className="mt-1 w-full border rounded p-2 bg-gray-100" placeholder="Auto-calculated" />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Customer name (temp)</label>
                        <input
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            disabled={tempDisabled}
                            className={`mt-1 w-full border rounded p-2 ${tempDisabled ? 'bg-gray-100' : ''}`}
                            placeholder="Full name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Customer email (temp)</label>
                        <input
                            value={tempEmail}
                            onChange={(e) => setTempEmail(e.target.value)}
                            disabled={tempDisabled}
                            className={`mt-1 w-full border rounded p-2 ${tempDisabled ? 'bg-gray-100' : ''}`}
                            placeholder="Email"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Customer phone (temp)</label>
                        <input
                            value={tempPhone}
                            onChange={(e) => setTempPhone(e.target.value)}
                            disabled={tempDisabled}
                            className={`mt-1 w-full border rounded p-2 ${tempDisabled ? 'bg-gray-100' : ''}`}
                            placeholder="Phone"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full border rounded p-2" rows={4} />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">Services</h3>
                        <button type="button" onClick={addServiceRow} className="text-sm text-blue-600">+ Thêm dịch vụ</button>
                    </div>
                    <div className="space-y-3">
                        {services.map((s, idx) => (
                            <div key={idx} className="grid grid-cols-6 gap-2 items-end">
                                <div className="col-span-2">
                                    <label className="block text-xs">Dịch vụ</label>
                                    {loadingServices ? (
                                        <div className="mt-1 text-xs text-gray-500">Đang tải dịch vụ...</div>
                                    ) : servicesError ? (
                                        <div className="mt-1 text-xs text-red-600">{servicesError}</div>
                                    ) : (
                                        <select value={s.service_id} onChange={(e) => updateService(idx, 'service_id', e.target.value)} className="mt-1 w-full border rounded p-1">
                                            <option value="">-- Chọn dịch vụ --</option>
                                            {availableServices.map((sv) => (
                                                <option key={sv.id} value={sv.id}>{sv.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs">Qty</label>
                                    <input type="number" min="1" value={s.quantity} onChange={(e) => updateService(idx, 'quantity', e.target.value)} className="mt-1 w-full border rounded p-1" />
                                </div>
                                <div>
                                    <button type="button" onClick={() => removeServiceRow(idx)} className="text-sm text-red-600">Xóa</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="button" onClick={handlePrint} className="mr-2 bg-gray-200 text-gray-800 px-4 py-2 rounded">
                        In Opportunity
                    </button>
                    <button disabled={loading} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                        {loading ? 'Đang gửi...' : 'Tạo Opportunity'}
                    </button>
                </div>
            </form>
        </div>
    );
}