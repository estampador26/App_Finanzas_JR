import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from 'recharts';
import { FaEyeSlash } from 'react-icons/fa';

// Custom shape for active segment on hover
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-14} textAnchor="middle" fill={fill} className="font-bold text-base">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#374151" className="text-xl font-semibold">
        {`$${value.toLocaleString('es-CL')}`}
      </text>
      <text x={cx} y={cy} dy={28} textAnchor="middle" fill="#6b7280" className="text-sm">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

const ChartLegend = ({ data }) => (
  <div className="w-full md:w-1/3 flex-shrink-0 md:pr-4 mb-4 md:mb-0">
    <ul className="space-y-2 text-sm">
      {data.map((entry, index) => (
        <li key={`legend-${index}`} className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: entry.color }}></span>
            <span>{entry.name}</span>
          </div>
          <span className="font-semibold">{`${(entry.percent * 100).toFixed(1)}%`}</span>
        </li>
      ))}
    </ul>
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-neutral-200">
        <p className="font-bold text-neutral-700 flex items-center">
          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: data.color }}></span>
          {data.name}
        </p>
        <p className="text-sm text-primary font-semibold ml-5">{`$${data.value.toLocaleString('es-CL')}`}</p>
        <p className="text-xs text-neutral-500 ml-5">{`(${(data.percent * 100).toFixed(1)}%)`}</p>
      </div>
    );
  }
  return null;
};

const CategoryChart = ({ transactions, categoriesMap, isPrivacyMode }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const chartData = useMemo(() => {
    // The component now receives pre-filtered transactions for the month.
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const dataByCategory = expenseTransactions.reduce((acc, tx) => {
      const categoryId = tx.categoryId;
      if (!categoryId || !categoriesMap[categoryId]) {
        // Optionally, group into 'Sin Categoría'
        return acc;
      }

      if (!acc[categoryId]) {
        acc[categoryId] = { 
          name: categoriesMap[categoryId].name,
          value: 0,
          color: categoriesMap[categoryId].color || '#cccccc'
        };
      }
      acc[categoryId].value += Number(tx.amount) || 0;
      return acc;
    }, {});
    
    const total = Object.values(dataByCategory).reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return [];

    return Object.values(dataByCategory)
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value) // Sort by value descending
      .map(item => ({ ...item, percent: item.value / total }));

  }, [transactions, categoriesMap]);

  if (isPrivacyMode) {
    return (
      <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col items-center justify-center text-center">
         <h3 className="text-lg font-bold text-neutral-700 mb-4">Gastos por Categoría</h3>
        <FaEyeSlash className="text-4xl text-neutral-400 mb-4" />
        <p className="text-neutral-500">Datos ocultos por el modo privacidad.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <h3 className="text-lg font-bold text-neutral-700 mb-4 text-center">Gastos por Categoría</h3>
      {chartData.length > 0 ? (
        <div className="flex flex-col md:flex-row items-center grow">
          <ChartLegend data={chartData} />
          <div className="w-full md:w-2/3 h-full">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  onMouseEnter={onPieEnter}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="focus:outline-none stroke-white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full grow">
          <p className="text-neutral-500">No hay gastos para mostrar este mes.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryChart;
