import React from 'react';
import { FaArrowUp, FaArrowDown, FaExclamationTriangle, FaPiggyBank, FaBalanceScale } from 'react-icons/fa';
import { formatCurrency } from '../utils/currencyUtils';

const SummaryCard = ({ icon, title, value, colorClass, loading }) => {
  if (loading) {
    return (
      <div className="bg-gray-200 animate-pulse p-4 rounded-lg flex-1">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex-1 btn-hover-scale">
      <div className="flex items-center">
        <div className={`p-2 rounded-full ${colorClass}`}>
          {icon}
        </div>
        <div className="ml-3">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(value)}</p>
        </div>
      </div>
    </div>
  );
};

const MonthlySummaryDashboard = ({ summaryData, loading }) => {
  const { 
    monthlyIncomes = 0,
    totalMonthlyPayments = 0,
    totalPendingPaymentsAmount = 0,
    monthlyBalance = 0,
    globalDebt = 0
  } = summaryData || {};

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <SummaryCard title="Ingresos del Mes" value={monthlyIncomes} icon={<FaArrowUp />} colorClass="bg-green-100 text-green-600" loading={loading} />
      <SummaryCard title="Total Pagos del Mes" value={totalMonthlyPayments} icon={<FaArrowDown />} colorClass="bg-red-100 text-red-600" loading={loading} />
      <SummaryCard title="Pagos Pendientes" value={totalPendingPaymentsAmount} icon={<FaExclamationTriangle />} colorClass="bg-yellow-100 text-yellow-600" loading={loading} />
      <SummaryCard title="Saldo del Mes" value={monthlyBalance} icon={<FaBalanceScale />} colorClass="bg-blue-100 text-blue-600" loading={loading} />
      <SummaryCard title="Deuda Global" value={globalDebt} icon={<FaPiggyBank />} colorClass="bg-purple-100 text-purple-600" loading={loading} />
    </div>
  );
};

export default MonthlySummaryDashboard;
