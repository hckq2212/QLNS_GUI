import React, { useEffect, useState } from 'react';
import ContractWithoutDebt from '../components/Contract/ContractWithoutDebt.jsx';
import ContractWaitingBODApproval from '../components/Contract/ContractWaitingBodApproval.jsx';
import HRConfirmContract from '../components/Contract/HRConfirmContract.jsx';
import AssignedContract from '../components/Contract/AssignedContract.jsx';
import SideMenu from '../components/ui/SideMenu.jsx';
import Header from '../components/ui/Header.jsx';

export default function ContractsPending() {
  const [view, setView] = useState('withoutDebt');

  return (
    <div>
      <Header />
      <SideMenu />
      <div className="p-6 ml-[17%]  w-[80%]">
        <div className="flex gap-3 mb-4 mt-[80px] justify-between">
          <button onClick={() => setView('withoutDebt')} className={`px-3 py-2 rounded ${view === 'withoutDebt' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Hợp đồng chưa có công nợ</button>
          <button onClick={() => setView('hrConfirm')} className={`px-3 py-2 rounded ${view === 'hrConfirm' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Hợp đồng đợi HR xác nhận</button>
          <button onClick={() => setView('bodApproval')} className={`px-3 py-2 rounded ${view === 'bodApproval' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Hợp đồng đợi BOD duyệt</button>
          <button onClick={() => setView('assigned')} className={`px-3 py-2 rounded ${view === 'assigned' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Hợp đồng đang đợi ký</button>
        </div>

        {view === 'withoutDebt' && <ContractWithoutDebt />}
        {view === 'hrConfirm' && <HRConfirmContract />}
        {view === 'bodApproval' && <ContractWaitingBODApproval />}
        {view === 'assigned' && <AssignedContract />}
      </div>
    </div>
  );
}
