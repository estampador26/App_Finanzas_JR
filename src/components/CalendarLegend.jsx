import React from 'react';

const LegendItem = ({ color, label }) => (
  <div className="flex items-center">
    <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: color }}></span>
    <span className="text-sm text-gray-600">{label}</span>
  </div>
);

export default function CalendarLegend() {
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 mb-4 p-2 rounded-lg bg-gray-50 border">
      <LegendItem color="#3b82f6" label="Pendiente" />
      <LegendItem color="#22c55e" label="Pagado / Ingreso" />
      <LegendItem color="#ef4444" label="Vencido" />
      <LegendItem color="#f97316" label="Gasto Único" />
    </div>
  );
}
