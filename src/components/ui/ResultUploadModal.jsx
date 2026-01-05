import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { useSaveContractServiceResultMutation, useUpdateContractServiceResultMutation, useDeleteContractServiceResultMutation } from '../../services/contract';

export default function ResultUploadModal({ open, onClose, service, initialUrls = [], onSaved }) {
  const [rows, setRows] = useState([{ description: '', url: '' }]);
  const [modalSaving, setModalSaving] = useState(false);
  const [saveContractServiceResult] = useSaveContractServiceResultMutation();
  const [updateContractServiceResult] = useUpdateContractServiceResultMutation();
  const [deleteContractServiceResult] = useDeleteContractServiceResultMutation();
  const [deletedIndexes, setDeletedIndexes] = useState([]);

  useEffect(() => {
    if (!open) return;
    // initialize rows from service.result or initialUrls
    if (service && service.result) {
      if (Array.isArray(service.result)) {
        // items may be strings, { description, url }, or { name, job_id, evidence: [{url, filename}] }
        const parsed = service.result.slice(0, 3).map((it, origIdx) => {
          if (!it) return { description: '', url: '' };
          if (typeof it === 'string') return { description: '', url: String(it), _existing: true, _originalUrl: String(it), _existingIndex: origIdx };
          
          // New format: { name, job_id, evidence: [{url, filename}] }
          if (it.name && it.evidence && Array.isArray(it.evidence) && it.evidence[0]?.url) {
            return { 
              description: it.name, 
              url: it.evidence[0].url, 
              _existing: true, 
              _originalUrl: it.evidence[0].url, 
              _existingIndex: origIdx 
            };
          }
          
          return { description: it.description || it.name || it.title || '', url: it.url || it.link || '', _existing: true, _originalUrl: it.url || it.link || '', _existingIndex: origIdx };
        });
        setRows(parsed.length ? parsed : [{ description: '', url: '' }]);
      } else if (typeof service.result === 'string') {
          setRows([{ description: '', url: String(service.result), _existing: true, _originalUrl: String(service.result), _existingIndex: 0 }]);
      } else if (service.result && typeof service.result === 'object') {
        setRows([{ description: service.result.description || service.result.name || '', url: service.result.url || '', _existing: true, _originalUrl: service.result.url || '', _existingIndex: 0 }]);
      } else {
        setRows([{ description: '', url: '' }]);
      }
    } else if (Array.isArray(initialUrls) && initialUrls.length > 0) {
      const parsed = initialUrls.slice(0, 3).map((it) => ({ description: '', url: it || '', _existing: false }));
      setRows(parsed.length ? parsed : [{ description: '', url: '' }]);
    } else {
      setRows([{ description: '', url: '' }]);
    }
  }, [open, service, initialUrls]);

  if (!open) return null;

  const addRow = () => {
    if (rows.length >= 3) return;
    setRows((r) => [...r, { description: '', url: '' }]);
  };

  const deleteRow = (idx) => {
    setRows((r) => {
      const toRemove = r[idx];
      if (toRemove && toRemove._existing && (typeof toRemove._existingIndex === 'number')) {
        setDeletedIndexes((d) => [...d, toRemove._existingIndex]);
      }
      return r.filter((_, i) => i !== idx);
    });
  };

  const handleSave = async () => {
    const idToSave = service?.id ?? service?.contract_service_id ?? service?.idToSave;
    if (!idToSave) return toast.error('Không xác định được id dịch vụ');
    const payloads = rows
    .map(r => ({
        description: (r.description || '').trim(),
        url: (r.url || '').trim(),
    }))
  .filter(p => p.url.length > 0);   // đảm bảo cả 3 rows rỗng đều biến mất

    // if (payloads.length === 0) return toast.error('Vui lòng nhập ít nhất 1 URL');
    console.log("PAYLOADS SEND:", payloads)

    try {
      setModalSaving(true);
      // first delete any removed existing indexes (sort desc to avoid reindexing issues)
      const toDelete = Array.from(new Set(deletedIndexes)).sort((a, b) => b - a);
      for (const idx of toDelete) {
        try {
          console.log('DELETING OLD RESULT BY INDEX:', { id: idToSave, index: idx });
          await deleteContractServiceResult({ id: idToSave, index: idx }).unwrap();
        } catch (e) {
          console.warn('Failed to delete old result index', idx, e);
        }
      }

      // then save or update payloads
      for (const pRow of rows) {
        const p = { description: (pRow.description || '').trim(), url: (pRow.url || '').trim() };
        if (!p.url) continue;
        if (pRow._existing && (typeof pRow._existingIndex === 'number')) {
          // update existing item at index
          try {
            console.log('UPDATING EXISTING RESULT:', { id: idToSave, index: pRow._existingIndex, ...p });
            await updateContractServiceResult({ id: idToSave, index: pRow._existingIndex, url: p.url, description: p.description }).unwrap();
          } catch (e) {
            console.warn('Failed to update result at index', pRow._existingIndex, e);
            // fallback to save as new
            try { await saveContractServiceResult({ id: idToSave, url: p.url, description: p.description }).unwrap(); } catch (e2) { console.warn('Fallback save failed', e2); }
          }
        } else {
          // new item
          try {
            console.log('SAVING NEW RESULT:', { id: idToSave, ...p });
            await saveContractServiceResult({ id: idToSave, url: p.url, description: p.description }).unwrap();
          } catch (e) {
            console.warn('Failed to save new result', p, e);
          }
        }
      }
      toast.success('Đã lưu kết quả');
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      console.error('Save multiple results failed', err);
      toast.error(err?.data?.message || err?.message || 'Lưu kết quả thất bại');
    } finally {
      setModalSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 ">
      <div className="bg-white rounded shadow-lg w-fit  p-6">
        <h3 className="text-lg font-semibold mb-3">Upload kết quả dịch vụ</h3>
        <div className="text-sm text-gray-600 mb-3">Bạn có thể dán tối đa 3 link</div>
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Mô tả (tùy chọn)"
                value={row.description}
                onChange={(e) => { const next = [...rows]; next[idx].description = e.target.value; setRows(next); }}
                className="flex-1 border px-2 py-1 rounded"
              />
              <input
                type="url"
                placeholder="URL kết quả"
                value={row.url}
                onChange={(e) => { const next = [...rows]; next[idx].url = e.target.value; setRows(next); }}
                className="flex-2 border px-2 py-1 rounded"
              />
              <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => deleteRow(idx)}>Xóa</button>
            </div>
          ))}
          <div>
            <button className="px-2 py-1 bg-gray-100 rounded" onClick={addRow} disabled={rows.length >= 3}>Thêm đường dẫn</button>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => { onClose && onClose(); }} className="px-3 py-1 rounded border">Hủy</button>
          <button
            type="button"
            className="px-4 py-1 rounded bg-green-600 text-white"
            disabled={modalSaving}
            onClick={handleSave}
          >
            {modalSaving ? 'Đang gửi...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

ResultUploadModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  service: PropTypes.object,
  initialUrls: PropTypes.array,
  onSaved: PropTypes.func,
};
