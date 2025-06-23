import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import Layout from '../components/Layout';
import TransactionList from '../components/TransactionList';
import FinancialSummary from '../components/FinancialSummary';
import AddTransactionModal from '../components/AddTransactionModal';

export default function DashboardPage({ user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const transactionsCol = collection(db, 'transactions');
    const q = query(transactionsCol, where('uid', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTransactions = [];
      querySnapshot.forEach((doc) => {
        userTransactions.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(userTransactions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddTransaction = async (newTransaction) => {
    try {
      await addDoc(collection(db, 'transactions'), {
        ...newTransaction,
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding transaction: ", error);
    }
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
            {user && (
              <div className="mt-2 text-xs text-neutral-400 bg-neutral-100 p-2 rounded-md">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>UID:</strong> {user.uid}</p>
              </div>
            )}
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
        {loading ? (
          <p>Cargando transacciones...</p>
        ) : (
          <>
            <FinancialSummary transactions={transactions} />
            <TransactionList transactions={transactions} />
          </>
        )}
        <AddTransactionModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onAddTransaction={handleAddTransaction}
        />
      </div>
    </Layout>
  );
}


