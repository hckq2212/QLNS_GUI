import React, { useEffect, useMemo, useState } from 'react';
import contractAPI from '../../api/contract.js';

// Chart.js + react wrapper
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * ContractChart
 * Props:
 * - statuses: optional array of status keys to order/filter the chart (e.g. ['pending','approved','deployed'])
 */
export default function ContractChart({ statuses = null }) {
  const [countsByStatus, setCountsByStatus] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await contractAPI.getAll();
        const list = Array.isArray(data) ? data : [];
        if (!mounted) return;
        const map = list.reduce((acc, c) => {
          const st = (c.status || c.status_name || 'unknown')?.toString();
          acc[st] = (acc[st] || 0) + 1;
          return acc;
        }, {});
        setCountsByStatus(map);
        setTotal(list.length);
      } catch (err) {
        console.error('Lỗi khi lấy hợp đồng cho chart', err);
        if (mounted) setError(err?.message || 'Lỗi khi lấy hợp đồng');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(() => {
    const keys = statuses && Array.isArray(statuses) && statuses.length > 0
      ? statuses
      : Object.keys(countsByStatus);

    const labels = keys.map((k) => k);
    const data = keys.map((k) => countsByStatus[k] || 0);

    const palette = [
      '#9cc3f3', '#f5e68d', '#9fd09b', '#cfc7d1', '#f7b6c2', '#b4c7e7', '#ffd59e', '#b9f0d1'
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, i) => palette[i % palette.length]),
          hoverOffset: 8,
        },
      ],
    };
  }, [countsByStatus, statuses]);

  return (
    <div className="w-full bg-white rounded-lg border">
      <h3 className="text-lg font-semibold mb-3 mt-3">Tổng quan hợp đồng</h3>
      <hr />
      <br />
      {loading ? (
        <div className="text-sm text-gray-500">Đang tải...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <div className="flex items-center p-3">
          <div className="w-[100%]">
            <Pie data={chartData}
             options={{
                    maintainAspectRatio: false,
                    plugins: {
                    legend: {
                        position: 'left',
                        align: 'start', // canh trái label
                        labels: {
                        color: '#333',
                        font: { size: 13 },
                        usePointStyle: true,
                        padding: 15,
                        },
                    },
                    tooltip: {
                        callbacks: {
                        label: (ctx) => ` Số dự án: ${ctx.formattedValue}`
                        }
                    }
                    },
                }}
             />
          </div>
        </div>
      )}
    </div>
  );
}
