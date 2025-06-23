import { useMemo } from 'react';

export default function FinancialSummary({ transactions }) {
  const { income, expense, balance } = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const balance = income - expense;

    return { income, expense, balance };
  }, [transactions]);

  const summaryData = [
    { title: 'Ingresos Totales', value: income, color: 'text-accent-success' },
    { title: 'Gastos Totales', value: expense, color: 'text-accent-error' },
    { title: 'Balance Actual', value: balance, color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {summaryData.map((item) => (
        <div key={item.title} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-neutral-500 truncate">{item.title}</dt>
            <dd className={`mt-1 text-3xl font-semibold ${item.color}`}>
              ${item.value.toFixed(2)}
            </dd>
          </div>
        </div>
      ))}
    </div>
  );
}
