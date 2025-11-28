import React, { useMemo, useState, useEffect } from 'react';
import { useGetAllContractsQuery, useGetContractServiceListQuery } from '../../services/contract';
import { useGetAllOpportunityQuery } from '../../services/opportunity';
import { useGetServicesQuery } from '../../services/service';
import { OPPPORTUNITY_STATUS_LABELS } from '../../utils/enums';


function EmptyLineChartPlaceholder() {
  // simple grid + baseline placeholder
  return (
    <div className="h-56 flex items-center justify-center text-gray-300">
      <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor="#e6f0ff" />
            <stop offset="100%" stopColor="#fff" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#g)" />
        {/* horizontal lines */}
        {[0,1,2,3,4,5].map(i => (
          <line key={i} x1="0" x2="600" y1={20 + i*24} y2={20 + i*24} stroke="#f2f5fb" strokeWidth="1" />
        ))}
        {/* x-axis ticks */}
        {[0,1,2,3,4,5].map(i => (
          <text key={i} x={40 + i*100} y={150} fontSize="10" fill="#c3d3f2">Nov 0{i+1}</text>
        ))}
      </svg>
    </div>
  );
}

function Donut({ value = 0, total = 1, color = '#3b82f6', label = 'Cơ hội' }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, total === 0 ? 0 : value / total);
  const dash = `${pct * circumference} ${circumference}`;

  return (
    <div className="flex items-center justify-center flex-col">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <g transform="translate(55,55)">
          <circle r={radius} fill="transparent" stroke="#eef2ff" strokeWidth="14" />
          <circle r={radius} fill="transparent" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={dash} transform="rotate(-90)" />
          <text x="0" y="4" textAnchor="middle" fontSize="18" fill="#333">{value}</text>
        </g>
      </svg>
      <div className="text-sm text-gray-500 mt-2">{label}</div>
    </div>
  );
}

function MultiDonut({ segments = [], radius = 40, stroke = 14 }) {
  // segments: [{ value, color, label }]
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0) || 1;

  let acc = 0;
  const parts = segments.map((seg) => {
    const len = (seg.value / total) * circumference;
    const off = circumference - acc; // strokeDashoffset positions the segment
    acc += len;
    return { ...seg, len, off };
  });

  return (
    <div className="flex items-center justify-center flex-col">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <g transform="translate(55,55)">
          <circle r={radius} fill="transparent" stroke="#eef2ff" strokeWidth={stroke} />
          {parts.map((p, i) => (
            <circle
              key={i}
              r={radius}
              fill="transparent"
              stroke={p.color || '#3b82f6'}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${p.len} ${circumference - p.len}`}
              strokeDashoffset={p.off}
              transform="rotate(-90)"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                const ev = new CustomEvent('segmentHover', { detail: { id: p.id, label: p.label, value: p.value } });
                // dispatch on svg element to bubble up if needed
                e.currentTarget.dispatchEvent(ev);
              }}
            />
          ))}
          <text x="0" y="4" textAnchor="middle" fontSize="14" fill="#333">{total}</text>
        </g>
      </svg>
      <div className="text-sm text-gray-500 mt-2">Dịch vụ</div>
    </div>
  );
}

function SummaryCard({ title, children }) {
  return (
    <div className="bg-white rounded shadow-sm p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-gray-700">{title}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function DetailDashboard({ data = {} }) {
  // default placeholders


  // fetch opportunities and services
  const { data: opps = [], isLoading: oppLoading } = useGetAllOpportunityQuery();
  const { data: svcMaster = [], isLoading: svcLoading } = useGetServicesQuery();
  const { data: contractServices = [] } = useGetContractServiceListQuery();

  // derive time-series (last 7 days) from opportunity created_at (fallbacks)
  const timeSeries = useMemo(() => {
    if (!Array.isArray(opps)) return [];
    const now = new Date();
    const days = 7;
    const buckets = Array.from({ length: days }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (days - 1 - i));
      return { date: d, label: d.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }), count: 0 };
    });

    const toDayIndex = (dt) => {
      for (let i = 0; i < buckets.length; i++) {
        const b = buckets[i];
        if (
          dt.getFullYear() === b.date.getFullYear() &&
          dt.getMonth() === b.date.getMonth() &&
          dt.getDate() === b.date.getDate()
        ) {
          return i;
        }
      }
      return -1;
    };

    opps.forEach((o) => {
      const raw = o.created_at || o.createdAt || o.created || o.date || o.created_on || o.createdOn;
      const dt = raw ? new Date(raw) : null;
      if (!dt || isNaN(dt.getTime())) return;
      const idx = toDayIndex(dt);
      if (idx >= 0) buckets[idx].count++;
    });

    return buckets.map((b) => ({ label: b.label, count: b.count }));
  }, [opps]);

  // derive popular services by scanning opportunity objects for service references
  const popularServices = useMemo(() => {
    // helper to extract {id, qty} from an opportunity object (best-effort)
    const extractItems = (o) => {
      if (!o) return [];
      if (Array.isArray(o.services) && o.services.length) return o.services.map(s => ({ id: s.service_id ?? s.serviceId ?? s.id, qty: Number(s.quantity ?? s.qty ?? s.amount ?? 1) || 1 }));
      if (Array.isArray(o.items) && o.items.length) return o.items.map(s => ({ id: s.service_id ?? s.serviceId ?? s.id, qty: Number(s.quantity ?? s.qty ?? s.amount ?? 1) || 1 }));
      if (Array.isArray(o.rows) && o.rows.length) return o.rows.map(s => ({ id: s.service_id ?? s.serviceId ?? s.id, qty: Number(s.quantity ?? s.qty ?? s.amount ?? 1) || 1 }));
      // fallback: opportunity may include a `service_id` field directly
      if (o.service_id || o.serviceId) return [{ id: o.service_id ?? o.serviceId, qty: 1 }];
      return [];
    };

    const counts = new Map();
    (Array.isArray(opps) ? opps : []).forEach((o) => {
      const items = extractItems(o) || [];
      items.forEach(({ id, qty }) => {
        if (!id) return;
        const key = String(id);
        counts.set(key, (counts.get(key) || 0) + (Number(qty) || 0));
      });
    });

    // also count service usage from contract_service rows when service_id is present
    (Array.isArray(contractServices) ? contractServices : []).forEach((cs) => {
      const sid = cs.service_id ?? cs.serviceId ?? (cs.service && (cs.service.id ?? cs.serviceId)) ?? null;
      if (!sid) return;
      const qty = Number(cs.quantity ?? cs.qty ?? cs.amount ?? 1) || 1;
      const key = String(sid);
      counts.set(key, (counts.get(key) || 0) + qty);
    });

    // map counts to service master names when available
    const svcById = new Map((Array.isArray(svcMaster) ? svcMaster : []).map(s => [String(s.id), s]));
    const arr = Array.from(counts.entries()).map(([id, count]) => ({ id, count, name: svcById.get(id)?.name || `#${id}` }));
    // if no counts (no embedded data), fall back to service master list with zero counts
    if (arr.length === 0 && Array.isArray(svcMaster)) {
      return svcMaster.map(s => ({ id: String(s.id), name: s.name, count: 0 }));
    }
    return arr.sort((a, b) => b.count - a.count);
  }, [opps, svcMaster, contractServices]);

  const totalServices = popularServices.reduce((s, r) => s + (r.count || 0), 0) || 1;
  const topServices = (Array.isArray(popularServices) ? [...popularServices] : []).slice(0, 3);
  // derive status summary from incoming `data` prop if provided, otherwise from opportunities
  const statusSummary = useMemo(() => {
    if (data && Array.isArray(data.statusSummary) && data.statusSummary.length) return data.statusSummary;
    const counts = new Map();
    (Array.isArray(opps) ? opps : []).forEach((o) => {
      const st = o.status  || 'Khác';
      const key = String(st || 'Khác');
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [data, opps]);

  const totalStatus = statusSummary.reduce((s, r) => s + (r.count || 0), 0) || 1;

  return (
    <div className="p-4 max-w-full">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <SummaryCard title="Cơ hội theo thời gian">
            <div className="flex items-start justify-between mb-4">

              <div className="text-sm text-gray-500">&nbsp;</div>
            </div>
            <div className="rounded border border-transparent bg-white">
              {timeSeries && timeSeries.length > 0 ? (
                <div className="h-56 p-4">
                  <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#eef2ff" />
                        <stop offset="100%" stopColor="#fff" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#g2)" />
                    {/* draw a simple polyline */}
                    {(() => {
                      const max = Math.max(...timeSeries.map(t => t.count), 1);
                      const pts = timeSeries.map((t, i) => {
                        const x = 20 + (i * (560 / Math.max(1, timeSeries.length - 1)));
                        const y = 140 - (t.count / max) * 100;
                        return `${x},${y}`;
                      }).join(' ');
                      return (
                        <>
                          <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={pts} />
                          {timeSeries.map((t, i) => {
                            const x = 20 + (i * (560 / Math.max(1, timeSeries.length - 1)));
                            const max = Math.max(...timeSeries.map(tt => tt.count), 1);
                            const y = 140 - (t.count / max) * 100;
                            return <circle key={i} cx={x} cy={y} r={3} fill="#3b82f6" />;
                          })}
                        </>
                      );
                    })()}
                    {/* x labels */}
                    {timeSeries.map((t, i) => {
                      const x = 20 + (i * (560 / Math.max(1, timeSeries.length - 1)));
                      return <text key={i} x={x} y={155} fontSize="10" fill="#9fb6f2" textAnchor="middle">{t.label}</text>;
                    })}
                  </svg>
                </div>
              ) : (
                <EmptyLineChartPlaceholder />
              )}
            </div>
          </SummaryCard>
        </div>

        <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-4">
          <div className="row-span-1">
            <div className="bg-white rounded shadow-sm p-4 h-full">
              <div className="text-sm font-medium text-gray-700 mb-3">Nhóm dịch vụ phổ biến</div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-4 items-center justify-center">
                  {/* Single donut showing distribution of top services */}
                  <MultiDonut
                    segments={topServices.map((svc, idx) => ({ value: svc.count || 0, color: ["#3b82f6", "#10b981", "#f59e0b"][idx] || '#3b82f6', label: svc.name }))}
                  />
                </div>
                <div className="flex-1">
                  <ul className="mt-3 text-sm">
                    {topServices.map((r, i) => (
                      <li key={r.id} className="flex justify-between py-1">
                        <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full`} style={{background: ["#3b82f6", "#10b981", "#f59e0b"][i]}} /> {r.name}</div>
                        <div className="text-gray-600">{r.count}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="row-span-1">
            <div className="bg-white rounded shadow-sm p-4 h-full">
              <div className="text-sm font-medium text-gray-700 mb-3">Trạng thái cơ hội</div>
              <div className="flex gap-2 items-center">
                <Donut value={statusSummary[0]?.count || 0}  total={totalStatus} color="#3b82f6" label="Cơ hội" />
                <div className="flex-1">
                  <ul className="mt-3 text-sm">
                    {statusSummary.map((r) => (
                      <li key={r.name} className="flex justify-between py-1 gap-1 ">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" /> {OPPPORTUNITY_STATUS_LABELS[r.name]}</div>
                        <div className="text-gray-600">{r.count} <span className="text-gray-400 ml-2">{Math.round(((r.count||0)/totalStatus)*100)}%</span></div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
