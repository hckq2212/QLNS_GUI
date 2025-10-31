import { useEffect, useState } from "react";
import jobAPI from "../../api/job";
import { formatDate } from "../../utils/FormatValue";
import { JOB_STATUS_LABELS } from "../../utils/enums";
import { toast } from 'react-toastify';
import projectAPI from "../../api/project";

export default function MyJob() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
  const fetchJobData = async () => {
    try {
      const jobs = await jobAPI.getMyJob(); // array
      console.log("Job data:", jobs);

      // fetch project for each job (in parallel)
      const jobsWithProject = await Promise.all(
        jobs.map(async (job) => {
          try {
            const project = await projectAPI.getById(job.project_id);
            return { ...job, project_name: project.name };
          } catch (e) {
            // nếu gọi API dự án lỗi thì vẫn trả job
            return { ...job, project_name: "—" };
          }
        })
      );

      setJobs(jobsWithProject);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Đã xảy ra lỗi khi tải công việc");
    } finally {
      setLoading(false);
    }
  };

  fetchJobData();
}, []);



  if (loading) return <p>Đang tải...</p>;
  if (error) return <p style={{ color: "red" }}>Lỗi: {error}</p>;
  if (!jobs.length) return <p>Không có công việc nào.</p>;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm">Tìm theo trạng thái:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border px-2 py-1 rounded">
          <option value="all">Tất cả</option>
          <option value="in_progress">{JOB_STATUS_LABELS.in_progress}</option>
          <option value="done">{JOB_STATUS_LABELS.done}</option>
          <option value="cancelled">{JOB_STATUS_LABELS.cancelled}</option>
        </select>
      </div>

      <table className="min-w-full text-left border">
        <thead className="bg-gray-50 border">
          <tr>
            <th className="px-4 py-2">Tên công việc</th>
            <th className="px-4 py-2">Dự án</th>
            <th className="px-4 py-2">Deadline</th>
            <th className="px-4 py-2">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="border">
          {jobs.filter(j => filterStatus === 'all' ? true : j.status === filterStatus).map((job) => {
            const allowed = ['in_progress', 'done', 'cancelled'];
            const hasCurrent = allowed.includes(job.status);
            return (
              <tr key={job.id}>
                <td className="px-4 py-3 align-top">{job.name}</td>
                <td className="px-4 py-3 align-top">{job.project_name}</td>
                <td className="px-4 py-3 align-top">{formatDate(job.deadline) || "Chưa có"}</td>
                <td className="px-4 py-3 align-top">
                  <select
                    value={job.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      setUpdating(s => ({ ...s, [job.id]: true }));
                      try {
                        await jobAPI.update(job.id, { status: newStatus });
                        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
                        toast.success('Cập nhật trạng thái thành công');
                      } catch (err) {
                        console.error('Update status failed', err);
                        toast.error('Cập nhật trạng thái thất bại');
                      } finally {
                        setUpdating(s => ({ ...s, [job.id]: false }));
                      }
                    }}
                    disabled={!!updating[job.id]}
                    className="border px-2 py-1 rounded"
                  >
                    {!hasCurrent && <option value={job.status}>{JOB_STATUS_LABELS[job.status] ?? job.status}</option>}
                    {allowed.map(s => (
                      <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
