import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetDebtByIdQuery,
  useGetDebtPaymentsByDebtQuery,
  useCreateDebtPaymentMutation,
  useUpdateDebtPaymentMutation,
  useDeleteDebtPaymentMutation,
} from '../../services/debt';
import { useGetContractByIdQuery } from '../../services/contract';
import { formatPrice } from '../../utils/FormatValue';
import { DEBT_STATUS } from '../../utils/enums';
import { toast } from 'react-toastify';

function formatDateForInput(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function DebtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: debt, isLoading: debtLoading, isError: debtError, refetch: refetchDebt } = useGetDebtByIdQuery(id, { skip: !id });
  const { data: payments = [], isLoading: paymentsLoading, refetch: refetchPayments } = useGetDebtPaymentsByDebtQuery(id, { skip: !id });

  const { data: contract } = useGetContractByIdQuery(debt?.contract_id, { skip: !debt?.contract_id });

  const [createPayment, { isLoading: creating }] = useCreateDebtPaymentMutation();
  const [updatePayment, { isLoading: updating }] = useUpdateDebtPaymentMutation();
  const [deletePayment, { isLoading: deleting }] = useDeleteDebtPaymentMutation();

  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newNote, setNewNote] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');

  const totalDebt = Number(debt?.amount ?? debt?.debt_amount ?? 0) || 0;
  const paidSum = Array.isArray(payments) ? payments.reduce((s, p) => s + (Number(p.paid_amount ?? p.amount ?? 0) || 0), 0) : 0;
  const remaining = totalDebt - paidSum;

  if (!id) return <div className="p-6">No debt id provided</div>;
  if (debtLoading) return <div className="p-6">Loading debt...</div>;
  if (debtError) return <div className="p-6 text-red-600">Failed to load debt</div>;

  async function handleCreatePayment() {
    const amt = Math.round(Number(newAmount || 0));
    if (!amt || amt <= 0) { toast.info('Nhập số tiền hợp lệ'); return; }
    try {
      await createPayment({ debtId: id, body: { paid_amount: amt, paid_at: newDate || null, note: newNote || null } }).unwrap();
      toast.success('Thêm khoản thanh toán thành công');
      setNewAmount(''); setNewDate(''); setNewNote('');
      try { refetchPayments && refetchPayments(); refetchDebt && refetchDebt(); } catch (e) {}
    } catch (err) {
      console.error('create payment failed', err);
      toast.error(err?.data?.message || err?.message || 'Thêm thất bại');
    }
  }

  function startEdit(p) {
    setEditingId(p.id ?? p.payment_id ?? null);
    setEditAmount(String(p.paid_amount ?? p.amount ?? ''));
    setEditDate(formatDateForInput(p.paid_date || p.date || p.created_at));
    setEditNote(p.note || p.description || '');
  }

  async function handleSaveEdit(paymentId) {
    const amt = Math.round(Number(editAmount || 0));
    if (!amt || amt <= 0) { toast.info('Nhập số tiền hợp lệ'); return; }
    try {
      await updatePayment({ paymentId, body: { paid_amount: amt, paid_at: editDate || null, note: editNote || null } }).unwrap();
      toast.success('Cập nhật thanh toán thành công');
      setEditingId(null);
      try { refetchPayments && refetchPayments(); refetchDebt && refetchDebt(); } catch (e) {}
    } catch (err) {
      console.error('update payment failed', err);
      toast.error(err?.data?.message || err?.message || 'Cập nhật thất bại');
    }
  }

  async function handleDelete(paymentId) {
    if (!window.confirm('Xóa khoản thanh toán này?')) return;
    try {
      await deletePayment(paymentId).unwrap();
      toast.success('Xóa thành công');
      try { refetchPayments && refetchPayments(); refetchDebt && refetchDebt(); } catch (e) {}
    } catch (err) {
      console.error('delete payment failed', err);
      toast.error(err?.data?.message || err?.message || 'Xóa thất bại');
    }
  }

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-4 text-left grid-rows-2">
          <div className="col-span-7 bg-white rounded shadow p-6 row-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-semibold text-blue-600">Chi tiết công nợ</h2>
            </div>
            <hr className="mt-4" />

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="col-span-1 bg-white rounded p-4">
                <div className="text-sm text-gray-500">Tiêu đề</div>
                <div className="text-md font-medium text-blue-600">{debt.title  || `#${debt.id ?? debt.debt_id}`}</div>
              </div>
              <div className="text-gray-500 text-sm col-span-1 bg-white rounded p-4">
                <p className="">Trạng thái công nợ:</p>
                 {DEBT_STATUS[debt?.status] || debt?.status || '—'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="col-span-1 bg-white rounded p-4">
                <div className="text-sm text-gray-500">Tổng nợ</div>
                <div className="text-md font-medium text-blue-600">{formatPrice(totalDebt)}</div>
              </div>
              <div className="col-span-1 bg-white rounded p-4">
                <div className="text-sm text-gray-500">Còn lại</div>
                <div className="text-md font-medium text-red-600">{formatPrice(remaining)}</div>
              </div>
            </div>

            

           

            <div className=" rounded p-4">
              <h3 className="font-medium mb-2 text-blue-600">Các đợt thanh toán</h3>
              <div className="overflow-x-auto ">
                <table className="w-full text-sm ">
                  <thead className=" text-blue-600">
                    <tr className="bg-[#e7f1fd]">
                      <th className="px-3 py-2 text-left">Ngày</th>
                      <th className="px-3 py-2 text-left">Số tiền</th>
                      <th className="px-3 py-2 text-left">Ghi chú</th>
                      <th className="px-3 py-2 text-left">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments && payments.length > 0 ? (
                      payments.map((p) => {
                        const pid = p.id ?? p.payment_id;
                        if (editingId === pid) {
                          return (
                            <tr key={pid} className="border-t">
                              <td className="px-3 py-2 align-top"><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="border px-2 py-1" /></td>
                              <td className="px-3 py-2 align-top"><input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="border px-2 py-1" /></td>
                              <td className="px-3 py-2 align-top"><input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)} className="border px-2 py-1 w-full" /></td>
                              <td className="px-3 py-2 align-top flex gap-2">
                                <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => handleSaveEdit(pid)} disabled={updating}>Lưu</button>
                                <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => setEditingId(null)}>Hủy</button>
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={pid} className="border-t">
                            <td className="px-3 py-2 align-top">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : (p.date ? new Date(p.date).toLocaleDateString() : '')}</td>
                            <td className="px-3 py-2 align-top">{formatPrice(Number(p.paid_amount ?? p.amount ?? 0))}</td>
                            <td className="px-3 py-2 align-top">{p.note || p.description || '-'}</td>
                            <td className="px-3 py-2 align-top flex gap-2">
                              <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => startEdit(p)}>Sửa</button>
                              <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => handleDelete(pid)} disabled={deleting}>Xóa</button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td className="p-4 text-center" colSpan={4}>{paymentsLoading ? 'Đang tải...' : 'Chưa có khoản thanh toán'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <div className="col-span-5 bg-white rounded shadow p-6 h-fit">
            <div>
              <div className="text-md font-semibold text-blue-700">Hợp đồng liên quan</div>
              <hr className="my-4" />
              <div className="text-sm text-gray-700">
                <div className="mb-2"><p className="text-gray-500">Tên hợp đồng:</p> {contract?.name}</div>
                <div className="mb-2"><p className="text-gray-500">Mã hợp đồng:</p> {contract?.code}</div>
               
              </div>
            </div>
            <div className="mt-4">
              {debt?.contract_id && (
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => navigate(`/contract/${debt.contract_id}`)}>Xem hợp đồng</button>
              )}
            </div>
          </div>
          
            <div className="col-span-5 bg-white rounded shadow p-6 h-fit">
            <div>
              <div className="text-md font-semibold text-blue-700">Thêm khoản thanh toán</div>
              <hr className="my-4" />
              <div className="flex flex-col  gap-4 items-start">
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="border px-2 py-1" />
                <div className="flex gap-2">
                    <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Số tiền" className="border px-2 py-1" />
                    <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Ghi chú" className="border px-2 py-1 flex-1" />
                </div>
               
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleCreatePayment} disabled={creating}>Thêm</button>
              </div>
            </div>
          </div>


        </div>
      </div>
    </>
  );
}
