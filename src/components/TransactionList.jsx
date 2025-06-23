export default function TransactionList({ transactions }) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-neutral-900">Historial de Transacciones</h3>
      </div>
      <ul role="list" className="divide-y divide-neutral-200">
        {transactions.map((transaction) => (
          <li key={transaction.id}>
            <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary truncate">{transaction.description}</p>
                <p className="text-sm text-neutral-500">
                  {transaction.createdAt ? new Date(transaction.createdAt.seconds * 1000).toLocaleDateString() : transaction.date}
                </p>
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
