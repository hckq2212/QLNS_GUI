import { useNavigate } from 'react-router-dom';

import { useState } from 'react';
import OverallDashboard from '../components/Dashboard/OverallDashboard';
import DetailDashboard from '../components/Dashboard/DetailDashboard';


export default function Home() {
  const navigate = useNavigate()
  const [view, setView] = useState('Project');

  return (
    <div className="min-h-screen flex flex-col">
      <OverallDashboard />
      <DetailDashboard />

    </div>
  );
}
