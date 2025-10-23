import React, { useEffect, useState } from 'react';
import contractAPI from '../api/contract.js';
import ContractWithoutDebt from '../components/Contract/ContractWithoutDebt.jsx';
import customerAPI from '../api/customer.js';
import ContractWaitingBODApproval from '../components/Contract/ContractWaitingBodApproval.jsx';
import HRConfirmContract from '../components/Contract/HRConfirmContract.jsx';
import NotAssignedContract from '../components/Contract/NotAssignedContract.jsx';
import AssignedContract from '../components/Contract/AssignedContract.jsx';

export default function ContractsPending() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});



  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ContractWithoutDebt />
      <HRConfirmContract />
      <ContractWaitingBODApproval />
      <NotAssignedContract />
      <AssignedContract />
    </div>
  );
}
