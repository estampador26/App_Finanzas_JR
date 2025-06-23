const mockTransactions = [
  { id: 1, description: 'Salario Mensual', amount: 3000, type: 'income', date: '2025-06-23' },
  { id: 2, description: 'Alquiler', amount: 1200, type: 'expense', date: '2025-06-22' },
  { id: 3, description: 'Compra en supermercado', amount: 150, type: 'expense', date: '2025-06-21' },
  { id: 4, description: 'Venta de item online', amount: 75, type: 'income', date: '2025-06-20' },
];

export default function TransactionList() {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-neutral-900">Historial de Transacciones</h3>
      </div>
      <ul role="list" className="divide-y divide-neutral-200">
        {mockTransactions.map((transaction) => (
          <li key={transaction.id}>
            <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary truncate">{transaction.description}</p>
                <p className="text-sm text-neutral-500">{transaction.date}</p>
              </div>
              <div>
                <p className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-accent-success' : 'text-accent-error'}`}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
