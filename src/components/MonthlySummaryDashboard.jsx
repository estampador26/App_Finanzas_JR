import React from 'react';
import { FaArrowUp, FaArrowDown, FaExclamationTriangle, FaBalanceScale, FaUniversity } from 'react-icons/fa';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0';
  }
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

const SummaryCard = ({ icon, title, value, color, isPrivacyMode }) => {
  const IconComponent = icon;
  return (
    <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex items-center space-x-4">
      <div className={`rounded-full p-3 ${color}`}>
        <IconComponent className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-base-content/80">{title}</p>
        <p className="text-xl font-bold">
          {isPrivacyMode ? '*****' : formatCurrency(value)}
        </p>
      </div>
    </div>
  );
};

const MonthlySummaryDashboard = ({ data, isPrivacyMode }) => {
  if (!data) return null;

  const summaryCards = [
    {
      icon: FaArrowUp,
      title: 'Ingresos del Mes',
      value: data.monthlyIncomes,
      color: 'bg-green-500',
    },
    {
      icon: FaArrowDown,
      title: 'Pagos Realizados',
      value: data.totalMonthlyPayments,
      color: 'bg-red-500',
    },
    {
      icon: FaExclamationTriangle,
      title: 'Pagos Pendientes',
      value: data.totalPendingPaymentsAmount,
      color: 'bg-yellow-500',
    },
    {
      icon: FaBalanceScale,
      title: 'Saldo del Mes',
      value: data.monthlyBalance,
      color: 'bg-blue-500',
    },
    {
      icon: FaUniversity,
      title: 'Deuda Global',
      value: data.globalDebt,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {summaryCards.map((card, index) => (
        <SummaryCard
          key={index}
          icon={card.icon}
          title={card.title}
          value={card.value}
          color={card.color}
          isPrivacyMode={isPrivacyMode}
        />
      ))}
    </div>
  );
};

export default MonthlySummaryDashboard;
