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
import ProjectOverview from '../components/Dashboard/ProjectOverview.jsx';
import ProjectList from '../components/Dashboard/ProjectList.jsx';
import ContractList from '../components/Dashboard/ContractList.jsx';


export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SideMenu />
      <div className='mt-[100px] ml-[17%] mr-[4%]'>
        <ProjectOverview />
        <div>
          <ProjectList />
          <ContractList />
        </div>
      </div>
    </div>
  );
}
