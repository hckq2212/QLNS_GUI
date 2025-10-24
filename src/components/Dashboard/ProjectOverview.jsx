import React, { useEffect, useState } from 'react';
import projectAPI from '../../api/project.js';
import AllIcon from '../../assets/menu.png'
import AddIcon from '../../assets/add.png'
import InProgressIcon from '../../assets/management.png'
import CompleteIcon from '../../assets/checklist.png'

export default function ProjectOverview() {
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
            <h2 className='text-left mt-10 font-bold text-xl mb-10'>Bảng điều khiển</h2>
            <div className='flex flex-row gap-[3rem] justify-between mb-10'>
                <div className='flex gap-[2rem] flex-row justify-between items-center p-6  border-[#2B6AD0] border rounded-lg w-[20%] '>
                    <img className='w-[4rem] h-[4rem]' src={AllIcon}></img>
                    <div className='flex flex-col justify-center items-center gap-[1rem] w-[70%]'>
                        <p className="font-semibold text-2xl text-[#184172]">Tất cả</p>
                        <p className="font-semibold text-2xl text-[#184172]">{count ?? 0}</p>
                    </div>
                </div>
                <div className='flex gap-[2rem] flex-row justify-between items-center p-6  border-[#2B6AD0] border rounded-lg w-[20%]'>
                    <img className='w-[4rem] h-[4rem]' src={AddIcon}></img>
                    <div className='flex flex-col justify-center items-center gap-[1rem] w-[70%]'>
                        <p className="font-semibold text-2xl text-[#184172]">Đã lên kế hoạch</p>
                        <p className="font-semibold text-2xl text-[#184172]">{countNew ?? 0}</p>
                    </div>
                </div>
                <div className='flex gap-[2rem] flex-row justify-between items-center p-6  border-[#2B6AD0] border rounded-lg w-[20%]'>
                    <img className='w-[4rem] h-[4rem]' src={InProgressIcon}></img>
                    <div className='flex flex-col justify-center items-center gap-[1rem] w-[70%]'>
                        <p className="font-semibold text-2xl text-[#184172]">Đang thực hiện</p>
                        <p className="font-semibold text-2xl text-[#184172]">{countInProgress ?? 0}</p>
                    </div>
                </div>
                <div className='flex gap-[2rem] flex-row justify-between items-center p-6  border-[#2B6AD0] border rounded-lg w-[20%]'>
                    <img className='w-[4rem] h-[4rem]' src={CompleteIcon}></img>
                    <div className='flex flex-col justify-center items-center gap-[1rem] w-[70%]'>
                        <p className="font-semibold text-2xl text-[#184172]">Đã hoàn thành</p>
                        <p className="font-semibold text-2xl text-[#184172]">{countComplete ?? 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}