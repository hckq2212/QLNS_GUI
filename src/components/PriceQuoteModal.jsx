import { useEffect } from 'react';

export default function PriceQuoteModal({ isOpen = false, onClose = () => {}, opportunity = null }) {
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape') onClose();
        }
        if (isOpen) {
            window.addEventListener('keydown', onKey);
        }
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg w-11/12 max-w-3xl shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Báo giá {opportunity ? `${opportunity.name || opportunity.title || ('#' + opportunity.id)}${opportunity.customerName ? ` — ${opportunity.customerName}` : ''}` : ''}</h3>
                    <button onClick={onClose} aria-label="Đóng" className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Đóng</button>
                </div>

                <div className="mb-4 text-sm space-y-1">
                    {opportunity ? (
                        <div>
                            <div><strong>Khách hàng:</strong> {opportunity.customerName || '—'}</div>
                            <div><strong>Trạng thái:</strong> {opportunity.status}</div>
                            <div><strong>Mô tả:</strong> {opportunity.description || opportunity.note || '—'}</div>
                        </div>
                    ) : (
                        <div>Không có dữ liệu cơ hội.</div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr>
                                <th className="text-left border-b border-gray-200 px-3 py-2 text-sm text-gray-700">Hạng mục</th>
                                <th className="text-right border-b border-gray-200 px-3 py-2 text-sm text-gray-700">Giá vốn</th>
                                <th className="text-right border-b border-gray-200 px-3 py-2 text-sm text-gray-700">Giá bán tối thiểu</th>
                                <th className="text-right border-b border-gray-200 px-3 py-2 text-sm text-gray-700">Giá bán đề xuất</th>
                                <th className="text-center border-b border-gray-200 px-3 py-2 text-sm text-gray-700">Chọn giá</th>
                                <th className="text-right border-b border-gray-200 px-3 py-2 text-sm text-gray-700">Tỉ suất lợi nhuận</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="px-3 py-2 border-b border-gray-100 text-sm">—</td>
                                <td className="px-3 py-2 border-b border-gray-100 text-sm text-right">—</td>
                                <td className="px-3 py-2 border-b border-gray-100 text-sm text-right">—</td>
                                <td className="px-3 py-2 border-b border-gray-100 text-sm text-right">—</td>
                                <td className="px-3 py-2 border-b border-gray-100 text-sm text-center">—</td>
                                <td className="px-3 py-2 border-b border-gray-100 text-sm text-right">—</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}