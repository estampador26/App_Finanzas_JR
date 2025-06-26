import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from 'recharts';
import { toTimestamp } from '../utils/dateUtils';

// Custom shape for active segment on hover
const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold">
        {payload.name}
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

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-neutral-200">
        <p className="font-bold text-neutral-700">{`${payload[0].name}`}</p>
        <p className="text-sm text-primary">{`$${payload[0].value.toLocaleString('es-CL')}`}</p>
        <p className="text-xs text-neutral-500">{`(${(payload[0].payload.percent * 100).toFixed(2)}%)`}</p>
      </div>
    );
  }
  return null;
};

const CategoryChart = ({ transactions, categoriesMap }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const chartData = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const expensesThisMonth = transactions.filter(tx => {
      if (tx.type !== 'expense' || !tx.date) return false;
      const txDate = toTimestamp(tx.date)?.toDate();
      return txDate && txDate >= startOfMonth && txDate <= endOfMonth;
    });

    const dataByCategory = expensesThisMonth.reduce((acc, tx) => {
      const categoryId = tx.categoryId;
      if (!acc[categoryId]) {
        acc[categoryId] = { 
          name: categoriesMap[categoryId]?.name || 'Sin Categoría',
          value: 0,
          color: categoriesMap[categoryId]?.color || '#cccccc'
        };
      }
      acc[categoryId].value += tx.amount;
      return acc;
    }, {});
    
    const total = Object.values(dataByCategory).reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return [];

    return Object.values(dataByCategory)
      .filter(item => item.value > 0)
      .map(item => ({ ...item, percent: item.value / total }));

  }, [transactions, categoriesMap]);

  return (
    <div className="h-full w-full">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              onMouseEnter={onPieEnter}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} className="focus:outline-none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              iconType="circle" 
              iconSize={10}
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-neutral-500">No hay gastos para mostrar.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryChart;
