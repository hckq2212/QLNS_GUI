import React, { useEffect, useMemo, useState } from 'react';
import projectAPI from '../../api/project.js';


// Chart.js + react wrapper
import { Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ProjectChart() {
    const [count, setCount] = useState(null);
    const [countNew, setCountNew] = useState(null)
    const [countInProgress, setCountInProgress] = useState(null)
    const [countComplete, setCountComplete] = useState(null)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await projectAPI.getAll();
                const projects = Array.isArray(data) ? data : [];
                if (mounted) setCount(projects.length);
            } catch (err) {
                console.error('Lỗi khi lấy thông tin dự án', err);
                if (mounted) setError(err?.message || 'Lỗi khi lấy thông tin dự án');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    // prepare chart data using counts we fetch in other effects
    const chartData = useMemo(() => {
        const newCount = countNew ?? 0;
        const inProgressCount = countInProgress ?? 0;
        const completeCount = countComplete ?? 0;
        // other = total - sum of known (guard non-negative)
        const other = Math.max(0, (count ?? 0) - (newCount + inProgressCount + completeCount));

        return {
            labels: ['Dự án đang được lên kế hoạch', 'Dự án đang khởi công', 'Dự án đã hoàn thành'],
            datasets: [
                {
                    data: [newCount, inProgressCount, completeCount],
                    backgroundColor: ['#9cc3f3', '#f5e68d', '#9fd09b'],
                    hoverBackgroundColor: ['#7fb0ea', '#e9d86f', '#82c786'],
                    borderWidth: 1,
                    hoverOffset: 10, 
                },
            ],
        };
    }, [count, countNew, countInProgress, countComplete]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const status = 'not_assigned'
                const data = await projectAPI.getByStatus(status);
                const projects = Array.isArray(data) ? data : [];
                if (mounted) setCountNew(projects.length);
            } catch (err) {
                console.error('Lỗi khi lấy thông tin dự án', err);
                if (mounted) setError(err?.message || 'Lỗi khi lấy thông tin dự án');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
            const statuses = ['in_progress', 'ready'];
            // Fetch all in parallel
            const results = await Promise.allSettled(
                statuses.map((s) => projectAPI.getByStatus(s))
            );

            if (!mounted) return;

            // Flatten all successful responses into one array
            const allProjects = results
                .filter((r) => r.status === 'fulfilled')
                .flatMap((r) => (Array.isArray(r.value) ? r.value : []));

            setCountInProgress(allProjects.length);
            } catch (err) {
            console.error('Lỗi khi lấy thông tin dự án', err);
            if (mounted) setError(err?.message || 'Lỗi khi lấy thông tin dự án');
            } finally {
            if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

        useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const status = 'completed'
                const data = await projectAPI.getByStatus(status);
                const projects = Array.isArray(data) ? data : [];
                if (mounted) setCountComplete(projects.length);
            } catch (err) {
                console.error('Lỗi khi lấy thông tin dự án', err);
                if (mounted) setError(err?.message || 'Lỗi khi lấy thông tin dự án');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div>
            <div className='border rounded-lg bg-white '>
                    <h3 className='text-lg font-semibold mb-3 mt-3'>Tổng quan dự án</h3>
                    <hr />
                    <br />
                    <div className='flex items-center p-3'>
                        <div className='w-[100%]'>
                            <Pie 
                                data={chartData}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                    legend: {
                                        position: 'left',
                                        align: 'start', // canh trái label
                                        labels: {
                                        color: '#333',
                                        font: { size: 13 },
                                        usePointStyle: true,
                                        padding: 15,
                                        },
                                    },
                                    tooltip: {
                                        callbacks: {
                                        label: (ctx) => ` Số dự án: ${ctx.formattedValue}`
                                        }
                                    }
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
        </div>
    );
}