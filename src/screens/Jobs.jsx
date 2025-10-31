import SideMenu from '../components/ui/SideMenu.jsx';
import Header from '../components/ui/Header.jsx';
import MyJob from '../components/Job/MyJob.jsx';

export default function Jobs() {
  return (
    <div>
      <Header />
      <SideMenu />
      <div className="ml-[20%] pr-10 mt-[100px] w-[80%]">
        <MyJob />
      </div>
    </div>
  );
}
