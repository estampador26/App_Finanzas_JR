import { useState } from 'react';
import Layout from '../components/Layout';
import TransactionList from '../components/TransactionList';
import FinancialSummary from '../components/FinancialSummary';
import AddTransactionModal from '../components/AddTransactionModal';

const initialTransactions = [
  { id: 1, description: 'Salario Mensual', amount: 3000, type: 'income', date: '2025-06-23' },
  { id: 2, description: 'Alquiler', amount: 1200, type: 'expense', date: '2025-06-22' },
  { id: 3, description: 'Compra en supermercado', amount: 150, type: 'expense', date: '2025-06-21' },
  { id: 4, description: 'Venta de item online', amount: 75, type: 'income', date: '2025-06-20' },
];

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState(initialTransactions);

  const handleAddTransaction = (newTransaction) => {
    setTransactions(prev => [
      { ...newTransaction, id: Date.now(), date: new Date().toISOString().slice(0, 10) }, 
      ...prev
    ]);
  };
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Aquí tienes un resumen de tu actividad financiera.
            </p>
          </div>
          <div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-white px-4 py-2 rounded-md shadow-sm hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Añadir Transacción
            </button>
          </div>
        </div>
        <FinancialSummary transactions={transactions} />
        <TransactionList transactions={transactions} />
        <AddTransactionModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onAddTransaction={handleAddTransaction}
        />
      </div>
    </Layout>
  );
}


