import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MonthlyChart = ({ incomes, expenses, monthName }) => {
  // Move data generation inside the component to access props
  const data = [
    {
      name: monthName || 'Mes Actual',
      ingresos: incomes || 0,
      gastos: expenses || 0,
    },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen Mensual (Ingresos vs. Gastos)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value)}
          />
          <Legend />
          <Bar dataKey="ingresos" fill="#4CAF50" name="Ingresos" />
          <Bar dataKey="gastos" fill="#F44336" name="Gastos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyChart;
