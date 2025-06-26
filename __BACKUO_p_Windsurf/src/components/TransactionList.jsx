import React from 'react';
import { FaCar, FaShoppingCart, FaHome, FaFileInvoiceDollar, FaGift, FaGraduationCap, FaHeartbeat, FaQuestionCircle } from 'react-icons/fa';

export default function TransactionList({ transactions, categoriesMap = {} }) {
  const icons = {
    FaCar, FaShoppingCart, FaHome, FaFileInvoiceDollar, FaGift, FaGraduationCap, FaHeartbeat, FaQuestionCircle
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-neutral-900">Historial de Transacciones</h3>
      </div>
      <ul role="list" className="divide-y divide-neutral-200">
        {transactions.map((transaction) => (
          <li key={transaction.id}>
            <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${(categoriesMap[transaction.categoryId] || {}).color || 'bg-neutral-500'}`}>
                    {React.createElement(icons[(categoriesMap[transaction.categoryId] || {}).icon] || FaQuestionCircle, { className: 'w-5 h-5 text-white' })}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-primary truncate">{transaction.description}</p>
                    <p className="text-sm text-neutral-500">
                        <span className="font-medium">{(categoriesMap[transaction.categoryId] || {}).name || 'Sin Categoría'}</span>
                        <span className="mx-1">·</span>
                        <span>{transaction.createdAt ? new Date(transaction.createdAt.seconds * 1000).toLocaleDateString() : 'Fecha no disponible'}</span>
                    </p>
                </div>
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
