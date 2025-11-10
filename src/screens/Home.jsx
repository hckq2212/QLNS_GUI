import { useNavigate } from 'react-router-dom';

import Header from '../components/ui/Header.jsx';
import SideMenu from '../components/ui/SideMenu.jsx';
import ProjectChart from '../components/Dashboard/ProjectChart.jsx';
import { useState } from 'react';
import ProjectList from '../components/Dashboard/ProjectList.jsx'

export default function Home() {
  const navigate = useNavigate()
  const [view, setView] = useState('Project');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SideMenu />
      <div className='mt-[100px] ml-[17%] mr-[4%]'>
        <div className='grid grid-cols-2 gap-10'>
          <ProjectChart />
        </div>
      <div>
            <div className="max-w-4xl">
              <div className="flex gap-3 mb-4 mt-[80px]">
                <button onClick={() => setView('Project')} className={`px-3 py-2 rounded ${view === 'Project' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Danh sách dự án</button>
                <button onClick={() => setView('Contract')} className={`px-3 py-2 rounded ${view === 'Contract' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Danh sách hợp đồng</button>
              </div>
            </div>
          {view === 'Project' && <ProjectList />}
          {view === 'Contract' && <ContractList />}
        </div>
      </div>
    </div>
  );
}
