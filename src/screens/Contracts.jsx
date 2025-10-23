import React, { useEffect, useState } from 'react';
import contractAPI from '../api/contract.js';
import ContractWithoutDebt from '../components/Contract/ContractWithoutDebt.jsx';
import customerAPI from '../api/customer.js';
import ContractWaitingBODApproval from '../components/Contract/ContractWaitingBodApproval.jsx';
import HRConfirmContract from '../components/Contract/HRConfirmContract.jsx';
import NotAssignedContract from '../components/Contract/NotAssignedContract.jsx';
import AssignedContract from '../components/Contract/AssignedContract.jsx';
import SideMenu from '../components/ui/SideMenu.jsx';
import Header from '../components/ui/Header.jsx';

export default function ContractsPending() {
  const [view, setView] = useState('withoutDebt');

  return (
    <div>
      <Header />
      <SideMenu />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex gap-3 mb-4 mt-[80px]">
          <button onClick={() => setView('withoutDebt')} className={`px-3 py-2 rounded ${view === 'withoutDebt' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Without Debt</button>
          <button onClick={() => setView('hrConfirm')} className={`px-3 py-2 rounded ${view === 'hrConfirm' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>HR Confirm</button>
          <button onClick={() => setView('bodApproval')} className={`px-3 py-2 rounded ${view === 'bodApproval' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>BOD Approval</button>
          <button onClick={() => setView('notAssigned')} className={`px-3 py-2 rounded ${view === 'notAssigned' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Not Assigned</button>
          <button onClick={() => setView('assigned')} className={`px-3 py-2 rounded ${view === 'assigned' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Assigned</button>
        </div>

        {view === 'withoutDebt' && <ContractWithoutDebt />}
        {view === 'hrConfirm' && <HRConfirmContract />}
        {view === 'bodApproval' && <ContractWaitingBODApproval />}
        {view === 'notAssigned' && <NotAssignedContract />}
        {view === 'assigned' && <AssignedContract />}
      </div>
    </div>
  );
}
