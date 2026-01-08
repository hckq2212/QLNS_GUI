import React, { useState, useMemo } from 'react';
import { useGetAllDebtsQuery } from '../../services/debt';
import { useGetAllContractsQuery } from '../../services/contract';
import { useGetAllCustomerQuery } from '../../services/customer';
import { formatPrice } from '../../utils/FormatValue';

export default function DebtCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: debts = [], isLoading: debtsLoading, isError: debtsError } = useGetAllDebtsQuery();
  const { data: contracts = [], isLoading: contractsLoading } = useGetAllContractsQuery();
  const { data: customers = [], isLoading: customersLoading } = useGetAllCustomerQuery();

  const isLoading = debtsLoading || contractsLoading || customersLoading;
  const isError = debtsError;

  // Enrich debts with customer information
  const enrichedDebts = useMemo(() => {
    if (!Array.isArray(debts) || !Array.isArray(contracts) || !Array.isArray(customers)) {
      return [];
    }

    return debts.map(debt => {
      const contract = contracts.find(c => c.id === debt.contract_id);
      const customer = contract ? customers.find(cust => cust.id === contract.customer_id) : null;
      
      return {
        ...debt,
        customerName: customer?.name || 'N/A'
      };
    });
  }, [debts, contracts, customers]);

  // Get year and month from currentDate
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate days in month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Create calendar grid
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, date: null });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ day, date });
    }
    
    return days;
  }, [year, month, daysInMonth, startingDayOfWeek]);

  // Group debts by due_date
  const debtsByDate = useMemo(() => {
    const grouped = {};
    
    if (Array.isArray(enrichedDebts)) {
      enrichedDebts.forEach(debt => {
        if (debt.due_date) {
          const dateKey = new Date(debt.due_date).toDateString();
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(debt);
        }
      });
    }
    
    return grouped;
  }, [enrichedDebts]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format month/year for display
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (isLoading) {
    return <div className="p-6">Đang tải lịch...</div>;
  }

  if (isError) {
    return <div className="p-6 text-red-600">Lỗi khi tải dữ liệu công nợ</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-800">
            {monthNames[month]} {year}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={goToPreviousMonth}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
            >
              ← Tháng trước
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Hôm nay
            </button>
            <button
              onClick={goToNextMonth}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Tháng sau →
            </button>
          </div>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((item, index) => {
            const { day, date } = item;
            const dateKey = date ? date.toDateString() : null;
            const debtsOnThisDay = dateKey ? (debtsByDate[dateKey] || []) : [];
            const hasDebts = debtsOnThisDay.length > 0;
            const isTodayDate = isToday(date);

            return (
              <div
                key={index}
                className={`min-h-[120px] border rounded-lg p-2 ${
                  day ? 'bg-white' : 'bg-gray-50'
                } ${isTodayDate ? 'ring-2 ring-blue-500' : ''} ${
                  hasDebts ? 'bg-red-50' : ''
                }`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-semibold mb-2 ${
                      isTodayDate ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {day}
                    </div>
                    
                    {/* Display debts for this day */}
                    {hasDebts && (
                      <div className="space-y-1">
                        {debtsOnThisDay.map(debt => (
                          <div
                            key={debt.id}
                            className={`text-xs p-2 rounded ${
                              debt.status === 'paid' ? 'bg-green-100 text-green-800' :
                              debt.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <div className="font-semibold truncate" title={debt.title || 'Thanh toán'}>
                              {debt.title || 'Thanh toán'}
                            </div>
                            <div className="truncate" title={debt.customerName}>
                              {debt.customerName}
                            </div>
                            <div className="font-bold">
                              {formatPrice(debt.amount)} VNĐ
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border rounded"></div>
            <span>Chưa thanh toán</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border rounded"></div>
            <span>Đã thanh toán</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border rounded"></div>
            <span>Quá hạn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 ring-2 ring-blue-500 rounded"></div>
            <span>Hôm nay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
