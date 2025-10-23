
import React from 'react';
import CreateOpportunity from '../components/Opportunity/CreateOpportunity.jsx';
import PendingOpportunities from '../components/Opportunity/PendingOpportunities.jsx';

export default function Opportunity() {
    return(
        <div>
            <CreateOpportunity />
            <PendingOpportunities />
        </div>
    )

}