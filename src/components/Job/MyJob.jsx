import { useEffect, useState } from "react";
import jobAPI from "../../api/job";
import { formatDate } from "../../utils/FormatValue";

export default function MyJob() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const data = await jobAPI.getMyJob(); 
        console.log("Job data:", data);
        setJobs(data);
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
      <table className="min-w-full text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2">Tên công việc</th>
            <th className="px-4 py-2">Dự án</th>
            <th className="px-4 py-2">Deadline</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td className="px-4 py-3 align-top">{job.name}</td>
              <td className="px-4 py-3 align-top">{job.project || job.contract_id}</td>
              <td className="px-4 py-3 align-top">{formatDate(job.deadline) || "Chưa có"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
