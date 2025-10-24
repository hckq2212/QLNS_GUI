import { useNavigate } from 'react-router-dom';

import Header from '../components/ui/Header.jsx';
import banner from '../assets/banner.png'
import laptop from '../assets/laptop.png'
import monitor from '../assets/monitor.png'
import keyboard from '../assets/keyboard.png'
import mouse from '../assets/mouse.png'
import headset from '../assets/headset.png'
import phone from '../assets/phone.png'
import mail from '../assets/mail.png'
import location from'../assets/location.png'
import SideMenu from '../components/ui/SideMenu.jsx';
import ProjectChart from '../components/Dashboard/ProjectChart.jsx';
import ContractList from '../components/Dashboard/ContractList.jsx';
import { useState } from 'react';
import ProjectList from '../components/Dashboard/ProjectList.jsx'
import ContractChart from '../components/Dashboard/ContractChart.jsx';

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
          <ContractChart />
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
