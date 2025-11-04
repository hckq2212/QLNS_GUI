import React, { useState } from 'react';
import AssigningProject from "../components/Project/AssigningProject.jsx";
import PendingProject from "../components/Project/PendingProject.jsx";
import AssigningJob from "../components/Project/AssigningJobForProject.jsx";
import Header from "../components/ui/Header.jsx";
import SideMenu from "../components/ui/SideMenu.jsx";
import NotAssignedProject from '../components/Project/NotAssignedProject.jsx';

export default function Project () {
    const [view, setView] = useState('notAssignedProject');

    return(
        <div>
            <Header />
            <SideMenu />
            <div className="p-6 ml-[17%] mt-[80px]">
                <div className="flex gap-3 mb-4">
                    <button onClick={() => setView('notAssignedProject')} className={`px-3 py-2 rounded ${view === 'notAssignedProject' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Dự án chưa được phân công</button>
                    <button onClick={() => setView('assigningProject')} className={`px-3 py-2 rounded ${view === 'assigningProject' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Nhận thông tin dự án</button>
                    <button onClick={() => setView('pendingProject')} className={`px-3 py-2 rounded ${view === 'pendingProject' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Dự án chưa khởi công</button>
                    <button onClick={() => setView('assigningJob')} className={`px-3 py-2 rounded ${view === 'assigningJob' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Phân công</button>
                </div>

                {view === 'notAssignedProject' && <NotAssignedProject />}
                {view === 'assigningProject' && <AssigningProject />}
                {view === 'pendingProject' && <PendingProject />}
                {view === 'assigningJob' && <AssigningJob />}
            </div>
        </div>
    )
}