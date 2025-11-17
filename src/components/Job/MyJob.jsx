import React, { useEffect, useState } from 'react';
import { useGetMyJobQuery } from '../../services/job';
import projectAPI from '../../api/project';
import { formatDate } from '../../utils/FormatValue';
import { JOB_STATUS_LABELS } from '../../utils/enums';
import { useNavigate } from 'react-router-dom';

export default function MyJob() {
  const { data: jobs = [], isLoading, isError, error } = useGetMyJobQuery();
  const [jobsWithProject, setJobsWithProject] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchProjects = async () => {
      if (!jobs || jobs.length === 0) {
        setJobsWithProject([]);
        return;
      }
      setLoadingProjects(true);
      try {
        const withProject = await Promise.all(
          jobs.map(async (job) => {
            try {
              const p = await projectAPI.getById(job.project_id);
              return { ...job, project_name: p?.name || p?.project_name || `#${job.project_id}` };
            } catch (e) {
              return { ...job, project_name: job.project_name || '—' };
            }
          })
        );
        if (mounted) setJobsWithProject(withProject);
      } catch (err) {
        console.error('Failed to fetch projects for jobs', err);
        if (mounted) setJobsWithProject(jobs);
      } finally {
        if (mounted) setLoadingProjects(false);
      }
    };

    fetchProjects();
    return () => { mounted = false; };
  }, [jobs]);

  if (isLoading || loadingProjects) return <p>Đang tải...</p>;
  if (isError) return <p style={{ color: 'red' }}>Lỗi: {error?.message || 'Không thể tải công việc'}</p>;
  if (!jobsWithProject.length) return <p>Không có công việc.</p>;

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-blue-600">Công việc của tôi</h3>
      <table className="min-w-full text-left border">
        <thead className="bg-[#e7f1fd] text-blue-600 border">
          <tr>
            <th className="px-4 py-2">Tên công việc</th>
            <th className="px-4 py-2">Dự án</th>
            <th className="px-4 py-2">Deadline</th>
            <th className="px-4 py-2">Trạng thái</th>
            <th className="px-4 py-2">Hành động</th>
          </tr>
        </thead>
        <tbody className="border">
          {jobsWithProject.map((job) => (
            <tr key={job.id}>
              <td className="px-4 py-3 align-top">{job.name || job.title || `#${job.id}`}</td>
              <td className="px-4 py-3 align-top">{job.project_name || '—'}</td>
              <td className="px-4 py-3 align-top">{formatDate(job.deadline) || 'Chưa có'}</td>
              <td className="px-4 py-3 align-top">{JOB_STATUS_LABELS[job.status] || job.status}</td>
              <td className="px-4 py-3 align-top">
                <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => navigate(`/job/${job.id}`)}>Xem chi tiết</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
