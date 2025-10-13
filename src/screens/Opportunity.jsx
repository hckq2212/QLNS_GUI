
import React, { useState, useEffect } from 'react';
import opportunityAPI from '../api/opportunity.js';
import serviceAPI from '../api/service.js';

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
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    // This screen only shows the create form; no list/loaders needed.

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

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Tạo Opportunity</h2>
            {message && <div className="p-2 mb-4 bg-green-100 text-green-800 rounded">{message}</div>}
            {error && <div className="p-2 mb-4 bg-red-100 text-red-800 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Customer ID (optional)</label>
                        <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 w-full border rounded p-2" placeholder="Customer ID (use when existing)" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Expected price</label>
                        <input value={expectedPrice} onChange={(e) => setExpectedPrice(e.target.value)} className="mt-1 w-full border rounded p-2" placeholder="e.g. 1000000" />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Customer name (temp)</label>
                        <input value={tempName} onChange={(e) => setTempName(e.target.value)} className="mt-1 w-full border rounded p-2" placeholder="Full name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Customer email (temp)</label>
                        <input value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} className="mt-1 w-full border rounded p-2" placeholder="Email" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Customer phone (temp)</label>
                        <input value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} className="mt-1 w-full border rounded p-2" placeholder="Phone" />
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
                                    <label className="block text-xs">Service Job ID</label>
                                    <input value={s.service_job_id} onChange={(e) => updateService(idx, 'service_job_id', e.target.value)} className="mt-1 w-full border rounded p-1" />
                                </div>
                                <div>
                                    <label className="block text-xs">Qty</label>
                                    <input type="number" min="1" value={s.quantity} onChange={(e) => updateService(idx, 'quantity', e.target.value)} className="mt-1 w-full border rounded p-1" />
                                </div>
                                <div>
                                    <label className="block text-xs">Proposed price</label>
                                    <input value={s.proposed_price} onChange={(e) => updateService(idx, 'proposed_price', e.target.value)} className="mt-1 w-full border rounded p-1" />
                                </div>
                                <div>
                                    <button type="button" onClick={() => removeServiceRow(idx)} className="text-sm text-red-600">Xóa</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button disabled={loading} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                        {loading ? 'Đang gửi...' : 'Tạo Opportunity'}
                    </button>
                </div>
            </form>
        </div>
    );
}