import React, { useState } from 'react';
import debtAPI from '../api/debt.js';

export default function DebtCreateModal({ activeContract, onClose, onSuccess }) {
  const [installments, setInstallments] = useState([{ amount: activeContract?.total_revenue || 0, due_date: '' }]);
  const [debtSubmitting, setDebtSubmitting] = useState(false);
  const [debtError, setDebtError] = useState(null);

  function fmt(n) { return new Intl.NumberFormat('vi-VN').format(Number(n || 0)); }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow w-full max-w-lg">
        <h4 className="font-semibold mb-2">Tạo công nợ cho hợp đồng #{activeContract.id}</h4>
        <div className="text-sm mb-2">Tổng doanh thu: {fmt(activeContract.total_revenue || 0)}</div>
        <div className="space-y-2">
          {installments.map((it, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input type="date" value={it.due_date || ''} onChange={e => {
                const arr = [...installments]; arr[idx].due_date = e.target.value; setInstallments(arr);
              }} className="border px-2 py-1" />
              <input type="number" value={it.amount || ''} onChange={e => {
                const arr = [...installments]; arr[idx].amount = Number(e.target.value || 0); setInstallments(arr);
              }} className="border px-2 py-1" placeholder="Số tiền" />
              <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => setInstallments(prev => prev.filter((_, i) => i !== idx))}>Xóa</button>
            </div>
          ))}
          <div>
            <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => setInstallments(prev => ([...prev, { amount: 0, due_date: '' }]))}>Thêm đợt</button>
          </div>
        </div>

        <div className="mt-4 text-sm">
          <div>Tổng các đợt: {fmt(installments.reduce((s, it) => s + (Number(it.amount) || 0), 0))}</div>
          <div className="text-xs text-gray-600">Lưu ý: tổng tiền các đợt phải bằng tổng doanh thu của hợp đồng.</div>
          {debtError ? <div className="text-sm text-red-600">{debtError}</div> : null}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => onClose()}>Hủy</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={async () => {
            const sum = installments.reduce((s, it) => s + (Number(it.amount) || 0), 0);
            const target = Number(activeContract.total_revenue || 0);
            if (sum !== target) { setDebtError('Tổng các đợt phải bằng tổng doanh thu của hợp đồng'); return; }
            setDebtSubmitting(true); setDebtError(null);
            try {
              const payload = { installments: installments.map(it => ({ amount: it.amount, due_date: it.due_date })) };
              await debtAPI.create(activeContract.id, payload, { timeout: 30000 });
              alert('Tạo công nợ thành công');
              onClose();
              if (onSuccess) onSuccess();
            } catch (err) {
              console.error('create debt failed', err);
              setDebtError(err?.message || 'Tạo công nợ thất bại');
            } finally { setDebtSubmitting(false); }
          }}>{debtSubmitting ? 'Đang gửi...' : 'Tạo'}</button>
        </div>
      </div>
    </div>
  );
}
  