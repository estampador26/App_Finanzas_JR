import React, { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Header from '../components/Header';
import EventPopover from '../components/EventPopover';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { toTimestamp } from '../utils/dateUtils';
import { getMonth, getYear, setDate } from 'date-fns';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const eventStyleGetter = (event) => {
    const style = {
        backgroundColor: event.resource.color,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        padding: '2px 5px',
    };
    return {
        style: style
    };
};


export default function CalendarPage({ user, onOpenTransactionModal }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [transactionsSnapshot, loadingTransactions] = useCollection(
    user ? query(collection(db, 'transactions'), where('userId', '==', user.uid)) : null
  );

  const [recurringPaymentsSnapshot, loadingRecurring] = useCollection(
    user ? query(collection(db, 'recurringPayments'), where('userId', '==', user.uid)) : null
  );
  
  const [incomesSnapshot, loadingIncomes] = useCollection(
    user ? query(collection(db, 'incomes'), where('userId', '==', user.uid)) : null
  );

  const events = useMemo(() => {
    if (loadingTransactions || loadingRecurring || loadingIncomes) {
      return [];
    }

    const monthEvents = [];
    const year = getYear(currentDate);
    const month = getMonth(currentDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (recurringPaymentsSnapshot) {
        recurringPaymentsSnapshot.docs.forEach(doc => {
            const payment = { id: doc.id, ...doc.data() };
            const paymentDate = setDate(new Date(year, month), payment.paymentDay);

            const isPaid = transactionsSnapshot?.docs.some(tDoc => {
                const t = tDoc.data();
                const tDate = toTimestamp(t.date)?.toDate();
                return t.recurringPaymentId === payment.id &&
                       tDate &&
                       getYear(tDate) === year &&
                       getMonth(tDate) === month;
            });

            monthEvents.push({
                title: `${isPaid ? '✅ ' : ''}${payment.name}`,
                start: paymentDate,
                end: paymentDate,
                allDay: true,
                resource: { 
                    type: 'recurring',
                    amount: payment.amount, 
                    isPaid: isPaid,
                    color: isPaid ? '#22c55e' : (paymentDate < today && !isPaid ? '#ef4444' : '#3b82f6'),
                    originalDoc: payment
                }
            });
        });
    }

    if (transactionsSnapshot) {
        transactionsSnapshot.docs.forEach(doc => {
            const transaction = { id: doc.id, ...doc.data() };
            const transactionDate = toTimestamp(transaction.date)?.toDate();
            if (transaction.type === 'expense' && !transaction.recurringPaymentId && transactionDate && getYear(transactionDate) === year && getMonth(transactionDate) === month) {
                monthEvents.push({
                    title: transaction.description,
                    start: transactionDate,
                    end: transactionDate,
                    allDay: true,
                    resource: { 
                        type: 'expense', 
                        amount: transaction.amount,
                        color: '#f97316',
                        originalDoc: transaction
                    }
                });
            }
        });
    }

    if (incomesSnapshot) {
        incomesSnapshot.docs.forEach(doc => {
            const income = { id: doc.id, ...doc.data() };
            const incomeDate = toTimestamp(income.date)?.toDate();
            if (incomeDate && getYear(incomeDate) === year && getMonth(incomeDate) === month) {
                monthEvents.push({
                    title: income.description,
                    start: incomeDate,
                    end: incomeDate,
                    allDay: true,
                    resource: { 
                        type: 'income', 
                        amount: income.amount,
                        color: '#84cc16',
                        originalDoc: income
                    }
                });
            }
        });
    }

    return monthEvents;
  }, [transactionsSnapshot, recurringPaymentsSnapshot, incomesSnapshot, currentDate, loadingTransactions, loadingRecurring, loadingIncomes]);

  const handleNavigate = (date) => {
    setCurrentDate(date);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleClosePopover = () => {
    setSelectedEvent(null);
  };

  const handleRegisterPayment = (payment, date) => {
    const transactionData = {
        amount: payment.amount,
        description: `Pago de ${payment.name}`,
        categoryId: payment.categoryId || '',
        date: date,
        type: 'expense',
        recurringPaymentId: payment.id,
    };
    onOpenTransactionModal(null, transactionData);
  };

  return (
    <div>
      <Header 
        title="Calendario Financiero"
        subtitle="Visualiza tus pagos, ingresos y vencimientos."
      />
      <div className="relative bg-white p-4 rounded-lg border border-gray-200 shadow-sm" style={{ height: '70vh' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "No hay eventos en este rango.",
            showMore: total => `+ Ver más (${total})`
          }}
        />
        <EventPopover 
            event={selectedEvent}
            onClose={handleClosePopover}
            onRegisterPayment={handleRegisterPayment}
        />
      </div>
    </div>
  );
}
