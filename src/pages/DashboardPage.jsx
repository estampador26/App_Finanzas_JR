import { useState, useMemo, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { FaEye, FaEyeSlash, FaPlusCircle } from 'react-icons/fa';
import { auth, db } from '../firebase';
import { toTimestamp } from '../utils/dateUtils';

import TransactionList from '../components/TransactionList';
import MonthlySummaryDashboard from '../components/MonthlySummaryDashboard';
import PaymentModules from '../components/PaymentModules';
import Header from '../components/Header';
import MonthNavigator from '../components/MonthNavigator';
import CategoryChart from '../components/CategoryChart';
import MonthlyChart from '../components/MonthlyChart';
import TrendChart from '../components/TrendChart';

export default function DashboardPage({ onOpenTransactionModal }) {
  const [user, loadingAuth] = useAuthState(auth);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const [viewedDate, setViewedDate] = useState(new Date());

    const monthName = useMemo(() => viewedDate.toLocaleString('es-CL', { month: 'long' }), [viewedDate]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [incomesSnapshot, loadingIncomes] = useCollection(
    user ? query(collection(db, 'incomes'), where('userId', '==', user.uid)) : null
  );
  const [transactionsSnapshot, loadingTransactions] = useCollection(
    user ? query(collection(db, 'transactions'), where('userId', '==', user.uid)) : null
  );
  const [recurringPaymentsSnapshot, loadingRecurring] = useCollection(
    user ? query(collection(db, 'recurringPayments'), where('userId', '==', user.uid)) : null
  );
  const [categoriesSnapshot, loadingCategories] = useCollection(
    user ? query(collection(db, 'categories'), where('userId', '==', user.uid)) : null
  );

  const incomes = useMemo(() => incomesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [], [incomesSnapshot]);
  const transactions = useMemo(() => transactionsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [], [transactionsSnapshot]);
  const recurringPayments = useMemo(() => recurringPaymentsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [], [recurringPaymentsSnapshot]);
  const categoriesMap = useMemo(() => {
    if (!categoriesSnapshot) return {};
    return categoriesSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = doc.data();
      return acc;
    }, {});
  }, [categoriesSnapshot]);

  const dashboardData = useMemo(() => {
    const sanitizeAmount = (value) => parseFloat(value) || 0;

    const sanitizedRecurring = recurringPayments.map(p => ({
      ...p,
      amount: sanitizeAmount(p.amount || p.installmentAmount || p.minimumPayment),
      initialAmount: sanitizeAmount(p.initialAmount),
      remainingAmount: sanitizeAmount(p.remainingAmount),
    }));

    const startOfMonth = new Date(viewedDate.getFullYear(), viewedDate.getMonth(), 1);
    const endOfMonth = new Date(viewedDate.getFullYear(), viewedDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const transactionsForMonth = transactions.filter(t => {
      const tDate = toTimestamp(t.date)?.toDate() || toTimestamp(t.createdAt)?.toDate();
      return tDate && tDate >= startOfMonth && tDate <= endOfMonth;
    });

    const totalMonthlyPayments = transactionsForMonth
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + sanitizeAmount(t.amount), 0);

    const paidRecurringIdsThisMonth = new Set(
      transactions
        .filter(t => {
          if (!t.recurringPaymentId) return false;
          const paymentDate = toTimestamp(t.date)?.toDate();
          if (!paymentDate) return false;
          // Check if the transaction date is within the currently viewed month
          return paymentDate.getFullYear() === viewedDate.getFullYear() &&
                 paymentDate.getMonth() === viewedDate.getMonth();
        })
        .map(t => t.recurringPaymentId)
    );

    const pendingPaymentsForMonth = sanitizedRecurring.filter(p => {
      // 1. Check if paid this month using the Set
      if (paidRecurringIdsThisMonth.has(p.id)) {
        return false;
      }

      // 2. Check if the payment has started yet
      const startDate = toTimestamp(p.startDate || p.firstPaymentDate)?.toDate();
      if (!startDate) return false;

      if (viewedDate.getFullYear() < startDate.getFullYear() || (viewedDate.getFullYear() === startDate.getFullYear() && viewedDate.getMonth() < startDate.getMonth())) {
        return false;
      }

      // 3. For debts, check if installments are finished
      if (p.type === 'debt' && p.totalInstallments > 0) {
        const installments = Number(p.totalInstallments);
        const firstPaymentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const firstInactiveMonth = new Date(firstPaymentMonth);
        firstInactiveMonth.setMonth(firstInactiveMonth.getMonth() + installments);
        const viewedMonthDate = new Date(viewedDate.getFullYear(), viewedDate.getMonth(), 1);

        if (viewedMonthDate >= firstInactiveMonth) {
          return false;
        }
      }
      
      // 4. If it passed all checks, it's a pending payment
      return true;
    });

    const totalPendingPaymentsAmount = pendingPaymentsForMonth.reduce((acc, p) => acc + p.amount, 0);
    
    const categorizedPayments = pendingPaymentsForMonth.reduce((acc, p) => {
      const type = p.type ? p.type.toLowerCase() : '';
      const classification = p.classification ? p.classification.trim().toLowerCase() : '';

      if (type === 'fixed' || type === 'expense') {
        acc.servicios.push(p);
      } else if (type === 'debt') {
        if (classification === 'tarjeta de crédito' || classification === 'crédito de consumo' || classification === 'principal') {
          acc.bancos.push(p);
        } else {
          acc.compras.push(p);
        }
      }
      return acc;
    }, { bancos: [], compras: [], servicios: [] });

    const globalDebt = sanitizedRecurring
      .filter(p => p.type === 'debt')
      .reduce((acc, p) => acc + (p.remainingAmount > 0 ? p.remainingAmount : p.initialAmount), 0);
      
    const monthlyIncomes = incomes
      .filter(i => {
        const incomeDate = toTimestamp(i.date)?.toDate();
        return incomeDate && incomeDate >= startOfMonth && incomeDate <= endOfMonth;
      })
      .reduce((acc, i) => acc + sanitizeAmount(i.amount), 0);

    return {
      monthlyIncomes,
      totalMonthlyPayments,
      totalPendingPaymentsAmount,
      monthlyBalance: monthlyIncomes - totalMonthlyPayments,
      globalDebt,
      categorizedPayments,
      transactionsForMonth,
    };
  }, [viewedDate, incomes, transactions, recurringPayments]);

  const trendData = useMemo(() => {
    const data = [];
    const sanitizeAmount = (value) => parseFloat(value) || 0;

    for (let i = 5; i >= 0; i--) {
      const date = new Date(viewedDate);
      date.setMonth(viewedDate.getMonth() - i);
      const monthName = date.toLocaleString('es-CL', { month: 'short' });
      
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const monthlyIncomes = incomes
        .filter(inc => {
          const incDate = toTimestamp(inc.date)?.toDate();
          return incDate && incDate >= startOfMonth && incDate <= endOfMonth;
        })
        .reduce((acc, inc) => acc + sanitizeAmount(inc.amount), 0);

      const monthlyExpenses = transactions
        .filter(t => {
          const tDate = toTimestamp(t.date)?.toDate();
          return t.type === 'expense' && tDate && tDate >= startOfMonth && tDate <= endOfMonth;
        })
        .reduce((acc, t) => acc + sanitizeAmount(t.amount), 0);

      data.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        ingresos: monthlyIncomes,
        gastos: monthlyExpenses,
        balance: monthlyIncomes - monthlyExpenses,
      });
    }
    return data;
    }, [viewedDate, incomes, transactions]);

  const handleCategorySelect = (categoryId) => {
    // If the same category is clicked again, clear the filter
    setSelectedCategoryId(prevId => (prevId === categoryId ? null : categoryId));
  };

  const filteredTransactionsForList = useMemo(() => {
    if (!selectedCategoryId) return dashboardData.transactionsForMonth;
    return dashboardData.transactionsForMonth.filter(t => t.categoryId === selectedCategoryId);
  }, [selectedCategoryId, dashboardData.transactionsForMonth]);





  const handleRegisterPayment = (payment) => {
    if (!user) return;

    // Al registrar un pago recurrente, CREAMOS una nueva transacción.
    // No pasamos una transacción para editar (primer argumento null),
    // sino datos iniciales para pre-rellenar el formulario (segundo argumento).
    const initialData = {
      amount: payment.amount,
      categoryId: payment.categoryId,
      description: `Pago de ${payment.name}`,
      date: new Date(), // La fecha de la transacción es hoy por defecto
      recurringPaymentId: payment.id,
    };

    onOpenTransactionModal(null, initialData);
  };

  if (loadingAuth || loadingIncomes || loadingTransactions || loadingRecurring || loadingCategories) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8 space-y-6">
      <Header 
        title="Dashboard Mensual" 
        subtitle="Navega por tus finanzas mes a mes."
      >
        <MonthNavigator currentDate={viewedDate} setCurrentDate={setViewedDate} />
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsPrivacyMode(p => !p)} 
            className="btn btn-ghost btn-circle text-gray-500 hover:bg-gray-100"
            aria-label="Toggle privacy mode"
          >
            {isPrivacyMode ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />} 
          </button>
          <button 
            onClick={() => onOpenTransactionModal()} 
            className="flex items-center gap-2 text-gray-600 hover:text-primary font-semibold"
          >
            <FaPlusCircle />
            <span>Añadir Transacción</span>
          </button>
        </div>
      </Header>


      


      <MonthlySummaryDashboard data={dashboardData} isPrivacyMode={isPrivacyMode} />
      
      <PaymentModules 
        categorizedPayments={dashboardData.categorizedPayments} 
        onRegisterPayment={handleRegisterPayment} 
        isPrivacyMode={isPrivacyMode}
      />

            <CategoryChart 
        transactions={dashboardData.transactionsForMonth} 
        categoriesMap={categoriesMap} 
        onCategorySelect={handleCategorySelect} 
        isPrivacyMode={isPrivacyMode}
      />

      <MonthlyChart 
        incomes={dashboardData.monthlyIncomes}
        expenses={dashboardData.totalMonthlyPayments}
        monthName={monthName}
      />

            <TrendChart data={trendData} />

      {selectedCategoryId && (
        <div className="flex justify-between items-center mt-6 mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Gastos de: <span className="font-bold text-primary">{categoriesMap[selectedCategoryId]?.name || 'Categoría'}</span>
          </h3>
          <button 
            onClick={() => setSelectedCategoryId(null)}
            className="btn btn-ghost btn-sm text-primary hover:bg-primary-focus hover:text-white"
          >
            Limpiar Filtro
          </button>
        </div>
      )}

      <TransactionList 
        transactions={filteredTransactionsForList} 
        categoriesMap={categoriesMap} 
        isPrivacyMode={isPrivacyMode} 
      />
    </div>
  );
}
