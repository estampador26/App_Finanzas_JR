import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Datos de ejemplo para la tendencia
const sampleData = [
  { month: 'Ene', ingresos: 4000, gastos: 2400, balance: 1600 },
  { month: 'Feb', ingresos: 3000, gastos: 1398, balance: 1602 },
  { month: 'Mar', ingresos: 2000, gastos: 9800, balance: -7800 },
  { month: 'Abr', ingresos: 2780, gastos: 3908, balance: -1128 },
  { month: 'May', ingresos: 1890, gastos: 4800, balance: -2910 },
  { month: 'Jun', ingresos: 2390, gastos: 3800, balance: -1410 },
];

const TrendChart = ({ data = sampleData }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendencia de los Últimos 6 Meses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip 
            formatter={(value) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value)}
          />
          <Legend />
          <Line type="monotone" dataKey="ingresos" stroke="#4CAF50" name="Ingresos" strokeWidth={2} />
          <Line type="monotone" dataKey="gastos" stroke="#F44336" name="Gastos" strokeWidth={2} />
          <Line type="monotone" dataKey="balance" stroke="#2196F3" name="Balance" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
