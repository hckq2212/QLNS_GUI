import React, { useState, useEffect } from 'react';
import { useCreateDebtForContractMutation } from '../../services/debt.js';
import { formatPrice } from '../../utils/FormatValue.js';
import { toast } from 'react-toastify';

export default function DebtCreateModal({ activeContract, onClose, onSuccess }) {
  const [installments, setInstallments] = useState([{ amount: Math.round(Number(activeContract?.total_revenue || 0)), due_date: '', percent: '' }]);
  const [debtSubmitting, setDebtSubmitting] = useState(false);
  const [debtError, setDebtError] = useState(null);
  const [createDebtForContract, { isLoading: creatingDebt, error: createDebtError }] = useCreateDebtForContractMutation();

  const targetTotal = Math.round(Number(activeContract?.total_revenue || 0));
  console.log(activeContract)

  useEffect(() => {
    setInstallments([{ amount: Math.round(Number(activeContract?.total_revenue || 0)), due_date: '', percent: '' }]);
    setDebtError(null);
  }, [activeContract]);

  function handleAdd() {
    setInstallments(prev => ([...prev, { amount: 0, due_date: '', percent: '' }]));
    setDebtError(null);
  }

  function handleDelete(index) {
    setInstallments(prev => prev.filter((_, i) => i !== index));
    setDebtError(null);
  }

  function handleAmountChange(index, value) {
    const val = Math.round(Number(value || 0));
    if (val < 0) { setDebtError('Số tiền không được âm'); return; }
    setInstallments(prev => {
      const next = prev.map((it, i) => i === index ? { ...it, amount: val, percent: '' } : it);
      setDebtError(null);
      return next;
    });
  }

  function handlePercentChange(index, value) {
    if (value === '') {
      setInstallments(prev => prev.map((it, i) => i === index ? { ...it, percent: '' } : it));
      return;
    }
    const n = Number(value);
    if (Number.isNaN(n)) return;
    const clamped = Math.max(0, Math.min(100, n));
    setInstallments(prev => prev.map((it, i) => i === index ? { ...it, percent: String(clamped) } : it));
    setDebtError(null);
  }

  const getRowAmount = (it) => {
    if (it && it.percent !== undefined && it.percent !== '' && !Number.isNaN(Number(it.percent))) {
      return Math.round(targetTotal * Number(it.percent) / 100);
    }
    return Math.round(Number(it.amount) || 0);
  };

  // derived validation
  const currentSum = installments.reduce((s, it) => s + getRowAmount(it), 0);
  const allPositive = installments.length > 0 && installments.every(it => getRowAmount(it) > 0);
  const allHaveDates = installments.length > 0 && installments.every(it => (it.due_date && String(it.due_date).trim() !== ''));
  // require due_date strictly greater than today
  const today = new Date();
  today.setHours(0,0,0,0);
  const allDatesInFuture = installments.length > 0 && installments.every(it => {
    if (!it.due_date) return false;
    const d = new Date(it.due_date + 'T00:00:00');
    return d > today;
  });
  const isValid = currentSum === targetTotal && allPositive && allHaveDates && allDatesInFuture && !debtSubmitting;
  // no global fee; per-row percent handled per installment


  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded shadow  w-fit p-10">
        <h4 className="font-semibold mb-2">Tạo lộ trình thanh toán cho hợp đồng {activeContract.code}</h4>
        <div className="text-sm mb-2">Tổng doanh thu: {formatPrice(activeContract.total_revenue || 0)}</div>
        <div className="space-y-2">
          {installments.map((it, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input type="date" value={it.due_date || ''} onChange={e => {
                const arr = [...installments]; arr[idx].due_date = e.target.value; setInstallments(arr);
              }} className="border px-2 py-1" />
              <input
                type="number"
                value={getRowAmount(it) || ''}
                onChange={e => { handleAmountChange(idx, e.target.value); }}
                className={`border px-2 py-1 ${it.percent ? 'bg-gray-50' : ''}`}
                placeholder="Số tiền"
                readOnly={it.percent !== ''}
              />
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={it.percent || ''}
                onChange={e => handlePercentChange(idx, e.target.value)}
                className="border px-2 py-1 w-[4rem]"
                placeholder="%"
              />
              <input
                type="text"
                name="title"
                id=""
                placeholder='Nội dung'
                className='border px-2 py-1 w-24'
                value={it.title || ''}
                onChange={e => { const arr = [...installments]; arr[idx].title = e.target.value; setInstallments(arr); }}
              />
              <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => handleDelete(idx)}>Xóa</button>
            </div> 
          ))}
          <div>
            <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => handleAdd()}>Thêm đợt</button>
          </div>
        </div>

        <div className="mt-4 text-sm">
          <div>Tổng các đợt: {formatPrice(currentSum)}</div>
          {debtError ? <div className="text-sm text-red-600">{debtError}</div> : null}
          {!allHaveDates ? <div className="text-sm text-yellow-600">Vui lòng nhập ngày đáo hạn cho tất cả đợt</div> : null}
          {!allPositive ? <div className="text-sm text-yellow-600">Mỗi đợt phải có số tiền lớn hơn 0</div> : null}
          {!allDatesInFuture ? <div className="text-sm text-yellow-600">Ngày đáo hạn phải lớn hơn hôm nay</div> : null}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => onClose()}>Hủy</button>
              <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={async () => {
              const sum = currentSum;
              const target = targetTotal;
              if (sum !== target) { setDebtError('Tổng các đợt phải bằng tổng doanh thu của hợp đồng'); return; }
              if (!allHaveDates || !allPositive || !allDatesInFuture) { setDebtError('Vui lòng sửa các lỗi trước khi tạo'); return; }
              setDebtSubmitting(true); setDebtError(null);
              try {
                // create each installment as a separate debt record using RTK Query mutation
                const ops = installments.map((it) => {
                  const amt = getRowAmount(it);
                  const body = { amount: Number(amt) || 0, due_date: it.due_date || null, title: it.title || null };
                  return createDebtForContract({ contractId: activeContract.id, body }).unwrap();
                });
                const results = await Promise.allSettled(ops);
                const rejected = results.filter((r) => r.status === 'rejected');
                if (rejected.length > 0) {
                  toast.error('Tạo lộ trình thanh toán thất bại');
                } else {
                  toast.success('Tạo lộ trình thanh toán thành công');
                  onClose();
                  if (onSuccess) onSuccess();
                }
              } catch (err) {
                console.error('create debt failed', err);
                setDebtError(err?.message || 'Tạo lộ trình thanh toán thất bại');
              } finally {
                setDebtSubmitting(false);
              }
            }}
            disabled={!isValid}
          >
            {debtSubmitting ? 'Đang gửi...' : 'Tạo'}
          </button>
        </div>
      </div>
    </div>
  );
}
  