import React from 'react';

export default function PaymentScheduleEditor({ schedules, onChange }) {
  function updateRow(idx, field, value) {
    const next = schedules.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    onChange(next);
  }

  function addRow() {
    onChange([...schedules, { due_date: '', amount: '' }]);
  }

  function removeRow(idx) {
    onChange(schedules.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div className="mb-2 flex justify-between items-center">
        <h4 className="font-semibold">Payment schedule</h4>
        <button type="button" onClick={addRow} className="text-sm text-blue-600">+ Add</button>
      </div>
      <div className="space-y-2">
        {schedules.map((s, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-2 items-end">
            <div>
              <label className="block text-xs">Due date</label>
              <input type="date" value={s.due_date} onChange={(e) => updateRow(idx, 'due_date', e.target.value)} className="mt-1 w-full border rounded p-1" />
            </div>
            <div>
              <label className="block text-xs">Amount</label>
              <input value={s.amount} onChange={(e) => updateRow(idx, 'amount', e.target.value)} className="mt-1 w-full border rounded p-1" />
            </div>
            <div className="flex items-center">
              <button type="button" onClick={() => removeRow(idx)} className="text-sm text-red-600">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
