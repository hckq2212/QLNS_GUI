import React from 'react';
import { useGetOpportunityByStatusQuery, useGetAllOpportunityQuery } from '../../services/opportunity';

function MetricCard({ title, value, tone = 'blue', href }) {
  const toneColors = {
    blue: { bg: 'bg-[#e7f1fd]', text: 'text-blue-600' },
    green: { bg: 'bg-[#eaf9ef]', text: 'text-green-600' },
    yellow: { bg: 'bg-[#fff8e6]', text: 'text-yellow-700' },
    red: { bg: 'bg-[#fff1f1]', text: 'text-red-600' },
  };
  const c = toneColors[tone] || toneColors.blue;

  return (
    <div className={`flex-1 rounded-lg p-4 ${c.bg} shadow-sm`}>
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className={`mt-3 text-2xl font-bold ${c.text}`}>{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function OverallDashboard({ stats = {} }) {
  // stats: { potentialCustomers, newOpportunities, pending, projectedRevenue, successRate }
  const {
    newOpportunities = 0,
    pending = 0,
    projectedRevenue = 0,
  } = stats;

  // fetch opportunities with status waiting_bod_approval for the "Cơ hội mới" card
  const { data: newOpps = [] } = useGetOpportunityByStatusQuery('waiting_bod_approval');
  const newOppCount = Array.isArray(newOpps) ? newOpps.length : 0;

  // fetch all opportunities to compute projected revenue (sum of expected_price)
  const { data: allOpps = [] } = useGetAllOpportunityQuery();
  const sumProjected = Array.isArray(allOpps)
    ? allOpps.reduce((s, o) => {
        const v = Number(o.expected_price ?? o.expectedPrice ?? o.proposed_price ?? o.proposedPrice ?? o.price ?? 0) || 0;
        return s + v;
      }, 0)
    : 0;
  const projectedValue = projectedRevenue || sumProjected;

  // format projectedRevenue to display nicely (e.g., 0B VND in screenshot)
  const fmtRevenue = (n) => {
    if (!n) return '0 VNÐ';
    // simple formatting: show as number with thousand separators + ' VNĐ'
    return new Intl.NumberFormat('vi-VN').format(n) + ' VNĐ';
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <MetricCard title="Cơ hội chờ duyệt" value={String(newOppCount || newOpportunities)} tone="blue" href="#" />
        <MetricCard title="Doanh thu dự kiến" value={fmtRevenue(projectedValue)} tone="green" href="#" />
      </div>
    </div>
  );
}
