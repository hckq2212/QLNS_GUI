import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetReviewFormQuery, useCreateReviewMutation } from '../../services/jobReview';

function ResultsList({ results } = {}) {
  if (!results || !Array.isArray(results) || results.length === 0) return <div className="text-gray-600">Không có kết quả</div>;
  return (
    <ul className="space-y-2 text-left">
      {results.map((r, idx) => (
        <li key={`${r.url ?? 'result'}-${idx}`} className="">
          <div className="text-sm">
            <a href={r.url} target="_blank" rel="noreferrer" className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full mr-2 mb-2 text-sm">
              {r.filename || r.description || r.url}
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CriteriaReview({ criteria = [], initialReview = [], onChange } = {}) {
  const initialList = Array.isArray(initialReview) ? initialReview : [];
  const [rows, setRows] = useState(() =>
    criteria.map((c) => {
      const found = initialList.find((r) => Number(r.criteria_id) === Number(c.id));
      const criteriaSource = (criteria || []).find((cc) => Number(cc.id) === Number(c.id));
      return {
        criteria_id: c.id,
        criteria_name: c.name,
        is_checked: !!(found?.is_checked ?? criteriaSource?.is_checked),
        score: found?.score ?? criteriaSource?.score ?? null,
        note: found?.note ?? found?.comment ?? '',
        review_id: found?.review_id ?? null,
      };
    })
  );

  useEffect(() => {
    const list = Array.isArray(initialReview) ? initialReview : [];
    const next = criteria.map((c) => {
      const found = list.find((r) => Number(r.criteria_id) === Number(c.id));
      const criteriaSource = (criteria || []).find((cc) => Number(cc.id) === Number(c.id));
      return {
        criteria_id: c.id,
        criteria_name: c.name,
        is_checked: !!(found?.is_checked ?? criteriaSource?.is_checked),
        score: found?.score ?? criteriaSource?.score ?? null,
        note: found?.note ?? found?.comment ?? '',
        review_id: found?.review_id ?? null,
      };
    });
    setRows((prev) => {
      try {
        if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
      } catch (e) {
        // fallthrough
      }
      return next;
    });
  }, [criteria, initialReview]);

  function toggleChecked(idx) {
    const copy = [...rows];
    copy[idx] = { ...copy[idx], is_checked: !copy[idx].is_checked };
    setRows(copy);
    onChange && onChange(copy);
  }

  return (
    <div className="grid grid-cols-2 text-left items-center gap-4">
      {rows.map((r, idx) => (
        <div key={r.criteria_id} className="flex items-start gap-3">
          <div className="">
            <input
              type="checkbox"
              checked={!!r.is_checked}
              onChange={() => toggleChecked(idx)}
              aria-label={`check-criteria-${r.criteria_id}`}
            />
          </div>
          <div className="flex-1">
            <div className="text-sm">{r.criteria_name}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReviewJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reviewType, setReviewType] = useState('lead');
  
  const { data, isLoading, isError, error, refetch } = useGetReviewFormQuery(
    { id, type: reviewType },
    { skip: !id }
  );

  const job = data?.job ?? null;
  const results = Array.isArray(data?.evidence) ? data.evidence : [];
  const criteria = data?.criteria || [];
  const reviewObj = data?.review ?? null;

  const [localReviewRows, setLocalReviewRows] = useState([]);
  const [overallComment, setOverallComment] = useState('');
  const [createReview, { isLoading: isSaving, isError: saveError, error: saveErrorObj }] = useCreateReviewMutation();

  useEffect(() => {
    const reviewList = Array.isArray(reviewObj)
      ? reviewObj
      : Array.isArray(reviewObj?.criteria)
      ? reviewObj.criteria
      : [];
    const summary = !Array.isArray(reviewObj) && reviewObj ? reviewObj : null;
    const init = criteria.map((c) => {
      const found = reviewList.find((r) => Number(r.criteria_id) === Number(c.id));
      const criteriaSource = (criteria || []).find((cc) => Number(cc.id) === Number(c.id));
      return {
        criteria_id: c.id,
        review_id: found?.review_id ?? null,
        is_checked: !!(found?.is_checked ?? criteriaSource?.is_checked),
        score: found?.score ?? criteriaSource?.score ?? null,
        note: found?.note ?? found?.comment ?? '',
      };
    });
    setLocalReviewRows((prev) => {
      try {
        if (JSON.stringify(prev) === JSON.stringify(init)) return prev;
      } catch (e) {
        return init;
      }
      return init;
    });
    setOverallComment(summary?.comment ?? summary?.note ?? data?.review_comment ?? data?.comment ?? '');
  }, [criteria, reviewObj, data]);

  if (!id) return <div className="p-6">No job id provided</div>;
  if (isLoading) return <div className="p-6">Loading review form...</div>;
  if (isError) return (
    <div className="p-6 text-red-600">
      Error loading review form: {error?.message || 'Unknown error'}
    </div>
  );

  function handleRowsChange(rows) {
    setLocalReviewRows(rows);
  }

  async function handleSave() {
    const payload = {
      job_id: job?.job_id ?? job?.id ?? id,
      review: localReviewRows,
      comment: overallComment,
    };
    console.log('Saving review payload:', payload);
    try {
      await createReview({ id, type: reviewType, body: payload }).unwrap();
      refetch();
      alert('Lưu đánh giá thành công');
      // Navigate back to job detail or project
      navigate(`/job/${id}`);
    } catch (err) {
      console.error('save review error', err);
      alert('Lưu đánh giá thất bại: ' + (err?.data?.message || err?.message || 'Unknown error'));
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-blue-600">Đánh giá công việc</h2>
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="px-3 py-1 rounded bg-white border text-sm hover:bg-gray-50">Quay lại</button>
          <button onClick={() => refetch()} className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Load lại</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <section className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3 text-left text-blue-500">Kết quả</h3>
            <hr className='mb-4' />
            <ResultsList results={results} />
          </section>

          <section className="bg-white rounded shadow p-4 text-left">
            <h3 className="font-medium mb-3 text-blue-500">Tiêu chí</h3>
            <hr className='mb-4' />
            <CriteriaReview criteria={criteria} initialReview={reviewObj} onChange={handleRowsChange} />
          </section>

          <section className="bg-white rounded shadow p-4 text-left">
            <h3 className="font-medium mb-3 text-blue-500">Đánh giá</h3>
            <hr className='mb-4' />
            <textarea
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              rows={6}
              className="w-full border rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Ghi chú chung cho kết quả đánh giá"
            />

            <div className="flex justify-end mt-4 items-center space-x-3">
              {saveError && (
                <div className="text-sm text-red-600">Lỗi: {saveErrorObj?.data?.message || saveErrorObj?.message || 'Không lưu được'}</div>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-5 py-2 text-white rounded ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-green-700'}`}>
                {isSaving ? 'Đang lưu...' : 'Lưu đánh giá'}
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="bg-white rounded shadow p-4">
            <h3 className="font-medium mb-3 text-blue-500 text-left">Loại đánh giá</h3>
            <hr className='mb-4' />
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reviewType"
                  value="lead"
                  checked={reviewType === 'lead'}
                  onChange={(e) => setReviewType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Lead</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reviewType"
                  value="sale"
                  checked={reviewType === 'sale'}
                  onChange={(e) => setReviewType(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Sale</span>
              </label>
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
}
