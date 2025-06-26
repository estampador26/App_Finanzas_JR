import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

import TransactionList from '../components/TransactionList';
import FinancialSummary from '../components/FinancialSummary';
import MonthlySummary from '../components/MonthlySummary';
import CategoryChart from '../components/CategoryChart';
import AddTransactionModal from '../components/AddTransactionModal';

export default function DashboardPage({ user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [recurringPayments, setRecurringPayments] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubscribes = [
      onSnapshot(query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')), (snapshot) => {
        setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false); // Main data loaded
      }),
      onSnapshot(query(collection(db, 'incomes'), where('userId', '==', user.uid)), (snapshot) => {
        setIncomes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      }),
      onSnapshot(query(collection(db, 'recurringPayments'), where('userId', '==', user.uid)), (snapshot) => {
        setRecurringPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      }),
      onSnapshot(query(collection(db, 'categories'), where('userId', '==', user.uid)), (snapshot) => {
        const catMap = {};
        snapshot.docs.forEach(doc => {
            catMap[doc.id] = doc.data();
        });
        setCategoriesMap(catMap);
      })
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Header */}
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
            className="bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-light flex items-center gap-2 btn-hover-scale"
          >
            Añadir Transacción
          </button>
        </div>
      </div>

      {loading ? (
        <p>Cargando resumen financiero...</p>
      ) : (
        <div className="space-y-6">
          {/* Top Row: Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="btn-hover-scale">
              <FinancialSummary transactions={transactions} recurringPayments={recurringPayments} />
            </div>
            <div className="btn-hover-scale">
              <MonthlySummary transactions={transactions} incomes={incomes} />
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border btn-hover-scale">
            <h2 className="text-xl font-semibold text-neutral-700 mb-4">Gastos por Categoría</h2>
            <div style={{ height: '300px' }}>
              <CategoryChart transactions={transactions} categoriesMap={categoriesMap} />
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border btn-hover-scale">
            <h2 className="text-xl font-semibold text-neutral-700 mb-4">Transacciones Recientes</h2>
            <TransactionList transactions={transactions} categoriesMap={categoriesMap} />
          </div>
        </div>
      )}

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        user={user}
      />
    </div>
  );
}
