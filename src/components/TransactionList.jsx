import React, { useMemo } from 'react';
import { FaCar, FaShoppingCart, FaHome, FaFileInvoiceDollar, FaGift, FaGraduationCap, FaHeartbeat, FaQuestionCircle } from 'react-icons/fa';
import { toTimestamp } from '../utils/dateUtils';

export default function TransactionList({ transactions, categoriesMap = {}, isPrivacyMode }) {
  const icons = {
    FaCar, FaShoppingCart, FaHome, FaFileInvoiceDollar, FaGift, FaGraduationCap, FaHeartbeat, FaQuestionCircle
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions]
      .map(t => ({ ...t, jsDate: toTimestamp(t.createdAt || t.date)?.toDate() }))
      .filter(t => t.jsDate && !isNaN(t.jsDate.getTime()))
      .sort((a, b) => b.jsDate - a.jsDate);
  }, [transactions]);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Historial de Transacciones</h3>
      {sortedTransactions.length > 0 ? (
        <ul role="list" className="divide-y divide-gray-200">
          {sortedTransactions.map((transaction) => {
            const category = categoriesMap[transaction.categoryId] || {};
            const Icon = icons[category.icon] || FaQuestionCircle;
            return (
              <li key={transaction.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${category.color || 'bg-gray-400'}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">{category.name || 'Sin Categoría'}</span>
                      <span className="mx-1">·</span>
                      <span>{transaction.jsDate ? transaction.jsDate.toLocaleDateString('es-CL') : 'Fecha no disponible'}</span>
                    </p>
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {isPrivacyMode ? '*****' : `${transaction.type === 'income' ? '+' : '-'}${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(transaction.amount)}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex items-center justify-center h-24">
            <p className="text-sm text-gray-500">No hay transacciones para mostrar en este mes.</p>
        </div>
      )}
    </div>
  );
}
