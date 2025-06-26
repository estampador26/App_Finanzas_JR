import React, { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/Calendar.css';
import Header from '../components/Header';
import EventPopover from '../components/EventPopover';

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { toTimestamp } from '../utils/dateUtils';
import { getMonth, getYear, setDate } from 'date-fns';
import CalendarLegend from '../components/CalendarLegend';

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

const messages = {
    'allDay': 'Todo el día',
    'previous': 'Anterior',
    'next': 'Siguiente',
    'today': 'Hoy',
    'month': 'Mes',
    'week': 'Semana',
    'day': 'Día',
    'agenda': 'Agenda',
    'date': 'Fecha',
    'time': 'Hora',
    'event': 'Evento',
    'noEventsInRange': 'No hay eventos en este rango.',
    'showMore': total => `+ ${total} más`
};

const eventStyleGetter = (event) => {
    const style = {
        backgroundColor: event.resource.color,
        opacity: 0.9,
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
    
    if (recurringPaymentsSnapshot && transactionsSnapshot) {
      const allTransactions = transactionsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

                                          recurringPaymentsSnapshot.docs.forEach(doc => {
        const payment = { id: doc.id, ...doc.data() };
        // Correctly convert Firestore Timestamp to JS Date.
        // The ?.toDate() handles cases where startDate might be null or missing.
        const initialDate = payment.startDate?.toDate();

        // If a start date exists, create a comparable UTC date. Otherwise, this will be null.
        const compareStartDateUTC = initialDate 
          ? new Date(Date.UTC(initialDate.getUTCFullYear(), initialDate.getUTCMonth(), initialDate.getUTCDate()))
          : null;

        const paymentDateLocal = setDate(new Date(year, month), payment.paymentDay);
        const paymentDateUTC = new Date(Date.UTC(year, month, payment.paymentDay));

        // A payment is shown if:
        // 1. It has no start date (legacy data).
        // 2. Or its start date is before or on the payment date for the current view.
        if (!compareStartDateUTC || paymentDateUTC.getTime() >= compareStartDateUTC.getTime()) {
          const isPaidThisMonth = allTransactions.some(t => {
            const tDate = t.date?.toDate(); // Also fix here for transaction dates
            return t.recurringPaymentId === payment.id && tDate && getYear(tDate) === year && getMonth(tDate) === month;
          });

          if (!isPaidThisMonth) {
            monthEvents.push({
              title: payment.name,
              start: paymentDateLocal,
              end: paymentDateLocal,
              allDay: true,
              resource: {
                type: 'recurring',
                amount: payment.amount,
                isPaid: false,
                color: paymentDateLocal < today ? '#ef4444' : '#3b82f6',
                originalDoc: payment,
              },
            });
          } else {
            monthEvents.push({
              title: `✅ ${payment.name}`,
              start: paymentDateLocal,
              end: paymentDateLocal,
              allDay: true,
              resource: { type: 'recurring', amount: payment.amount, isPaid: true, color: '#22c55e', originalDoc: payment },
            });
          }
        }

        // Overdue payments logic
        for (let m = 0; m < month; m++) {
          const pastMonthDateUTC = new Date(Date.UTC(year, m, payment.paymentDay));
          // Also check here: show overdue if no start date OR if start date check passes.
          if (!compareStartDateUTC || pastMonthDateUTC.getTime() >= compareStartDateUTC.getTime()) {
            const isPaidInPastMonth = allTransactions.some(t => {
              const tDate = t.date?.toDate(); // Fix here as well
              return t.recurringPaymentId === payment.id && tDate && getYear(tDate) === year && getMonth(tDate) === m;
            });
            const pastMonthDateLocal = setDate(new Date(year, m), payment.paymentDay);
            if (!isPaidInPastMonth && pastMonthDateLocal < today) {
              const alreadyExists = monthEvents.some(e => e.resource.originalDoc.id === payment.id && e.resource.isOverdue);
              if (!alreadyExists) {
                monthEvents.push({
                  title: `🔴 VENCIDO - ${payment.name}`,
                  start: setDate(new Date(year, month), 1),
                  end: setDate(new Date(year, month), 1),
                  allDay: true,
                  resource: {
                    type: 'recurring',
                    amount: payment.amount,
                    isPaid: false,
                    isOverdue: true,
                    color: '#ef4444',
                    originalDoc: payment,
                  },
                });
              }
            }
          }
        }
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
                        color: '#22c55e',
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
            <CalendarLegend />
      <div className="calendar-container relative bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            messages={messages}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            onNavigate={handleNavigate}
            date={currentDate}
          />
      </div>
        <EventPopover 
            event={selectedEvent}
            onClose={handleClosePopover}
            onRegisterPayment={handleRegisterPayment}
        />
    </div>
  );
}
