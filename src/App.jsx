import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RecurringPaymentsPage from './pages/RecurringPaymentsPage';
import IncomesPage from './pages/IncomesPage';
import ExpensesPage from './pages/ExpensesPage';
import CategoriesPage from './pages/CategoriesPage';
import CalendarPage from './pages/CalendarPage';
import DataManagementPage from './pages/DataManagementPage';
import AddTransactionModal from './components/AddTransactionModal';
import RecurringPaymentModal from './components/RecurringPaymentModal';

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [transactionInitialData, setTransactionInitialData] = useState(null); // Para pre-rellenar datos

  const [isRecurringPaymentModalOpen, setRecurringPaymentModalOpen] = useState(false);
  const [recurringPaymentToEdit, setRecurringPaymentToEdit] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenTransactionModal = (transaction = null, initialData = null) => {
    setTransactionToEdit(transaction);
    setTransactionInitialData(initialData);
    setTransactionModalOpen(true);
  };

  const handleOpenRecurringPaymentModal = (payment = null) => {
    setRecurringPaymentToEdit(payment);
    setRecurringPaymentModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
    setTransactionModalOpen(false);
    setTransactionToEdit(null);
    setTransactionInitialData(null);
  };

  const handleCloseRecurringPaymentModal = () => {
    setRecurringPaymentModalOpen(false);
    setRecurringPaymentToEdit(null);
  };


  if (loading) {
    return <div className="w-full h-screen flex justify-center items-center">Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute user={user}>
              <Layout user={user}>
                <Routes>
                  <Route path="/" element={<DashboardPage user={user} onOpenTransactionModal={handleOpenTransactionModal} />} />
                  <Route path="/pagos-recurrentes" element={<RecurringPaymentsPage user={user} />} />
                  <Route path="/ingresos" element={<IncomesPage user={user} />} />
                  <Route path="/egresos" element={<ExpensesPage onOpenTransactionModal={handleOpenTransactionModal} />} />
                  <Route path="/categorias" element={<CategoriesPage user={user} />} />
                  <Route 
                    path="/calendario" 
                    element={<CalendarPage 
                      user={user} 
                      onOpenTransactionModal={handleOpenTransactionModal} 
                      onOpenRecurringPaymentModal={handleOpenRecurringPaymentModal} 
                    />}
                  />
                  <Route path="/gestion-de-datos" element={<DataManagementPage user={user} />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      {isTransactionModalOpen && (
        <AddTransactionModal 
          isOpen={isTransactionModalOpen} 
          onClose={handleCloseTransactionModal} 
          transactionToEdit={transactionToEdit}
          initialData={transactionInitialData} 
        />
      )}
      {isRecurringPaymentModalOpen && (
        <RecurringPaymentModal
          isOpen={isRecurringPaymentModalOpen}
          onClose={handleCloseRecurringPaymentModal}
          paymentToEdit={recurringPaymentToEdit}
        />
      )}
    </BrowserRouter>
  );
}

export default App;