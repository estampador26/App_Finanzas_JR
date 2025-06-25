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

export default function DashboardPage({ onOpenTransactionModal }) {
  const [user, loadingAuth] = useAuthState(auth);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [viewedDate, setViewedDate] = useState(new Date());

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

    const pendingPaymentsForMonth = sanitizedRecurring.filter(p => {
      const isPaidThisMonth = transactions.some(t => {
        if (t.recurringPaymentId !== p.id) return false;
        const paymentTargetDate = toTimestamp(t.targetDate)?.toDate();
        if (!paymentTargetDate) return false;
        return paymentTargetDate.getFullYear() === viewedDate.getFullYear() &&
               paymentTargetDate.getMonth() === viewedDate.getMonth();
      });

      if (isPaidThisMonth) return false;

      const startDate = toTimestamp(p.startDate || p.firstPaymentDate)?.toDate();
      if (!startDate) return false;

      if (viewedDate.getFullYear() < startDate.getFullYear() || (viewedDate.getFullYear() === startDate.getFullYear() && viewedDate.getMonth() < startDate.getMonth())) {
        return false;
      }

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
  }, [viewedDate, incomes, transactions, recurringPayments, categoriesMap]);





  const handleRegisterPayment = (payment) => {
    if (!user) return;
    const targetDate = new Date(viewedDate.getFullYear(), viewedDate.getMonth(), payment.paymentDay);
    
    onOpenTransactionModal({
      amount: payment.amount,
      categoryId: payment.categoryId,
      description: `Pago de ${payment.name}`,
      isCreatingFromRecurring: true,
      recurringPaymentId: payment.id,
      date: new Date(),
      targetDateForRecurring: targetDate,
    });
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

      <CategoryChart transactions={dashboardData.transactionsForMonth} categoriesMap={categoriesMap} />

      <TransactionList 
        transactions={dashboardData.transactionsForMonth} 
        categoriesMap={categoriesMap} 
        isPrivacyMode={isPrivacyMode} 
      />
    </div>
  );
}
