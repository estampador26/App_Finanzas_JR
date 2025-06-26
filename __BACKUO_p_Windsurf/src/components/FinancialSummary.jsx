import React from 'react';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

export default function FinancialSummary({ totalIncome = 0, totalExpense = 0 }) {
  const balance = totalIncome - totalExpense;

  const summaryData = [
    { title: 'Ingresos Totales', value: totalIncome, color: 'text-green-600' },
    { title: 'Gastos Totales', value: totalExpense, color: 'text-red-600' },
    { title: 'Balance Actual', value: balance, color: balance >= 0 ? 'text-primary' : 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {summaryData.map((item) => (
        <div key={item.title} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-neutral-500 truncate">{item.title}</dt>
            <dd className={`mt-1 text-3xl font-semibold ${item.color}`}>
              {formatCurrency(item.value)}
            </dd>
          </div>
        </div>
      ))}
    </div>
  );
}
