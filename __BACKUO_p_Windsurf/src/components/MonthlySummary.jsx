import React from 'react';

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const MonthlySummary = ({ data }) => {
  const {
    monthlyIncome = 0,
    monthlyExpenses = 0,
    pendingDebts = 0,
    totalMonthlyPayments = 0,
  } = data || {};

  const balance = monthlyIncome - monthlyExpenses;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Resumen del Mes</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-neutral-600">Ingresos:</span>
          <span className="font-medium text-green-600">{formatCurrency(monthlyIncome)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neutral-600">Gastos:</span>
          <span className="font-medium text-red-600">{formatCurrency(monthlyExpenses)}</span>
        </div>
        <div className="flex justify-between items-center border-t pt-3 mt-2">
          <span className="font-semibold text-neutral-700">Saldo:</span>
          <span className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-neutral-600">Deudas Pendientes:</span>
          <span className="font-medium text-neutral-800">{formatCurrency(pendingDebts)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neutral-600">Total Pagos del Mes:</span>
          <span className="font-medium text-neutral-800">{formatCurrency(totalMonthlyPayments)}</span>
        </div>
        {/* Placeholder for overdue payments message */}
        <p className="text-xs text-red-500 mt-2">*Incluye pagos vencidos</p>
      </div>
    </div>
  );
};

export default MonthlySummary;
