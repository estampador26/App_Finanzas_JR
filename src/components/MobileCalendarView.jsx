import React from 'react';
import { formatCurrency } from '../utils/currencyUtils';
import { FaRegCalendarAlt } from 'react-icons/fa';

const StatusPill = ({ resource }) => {
  const { isPaid, isOverdue } = resource;
  if (isPaid) {
    return <span className="text-xs font-medium text-green-700">Pagado</span>;
  }
  if (isOverdue) {
    return <span className="text-xs font-medium text-red-700">Vencido</span>;
  }
  return <span className="text-xs font-medium text-blue-700">Pendiente</span>;
};

const EventItem = ({ event, onEventClick }) => {
  const { title, resource } = event;
  const { amount, category } = resource;

  return (
    <li onClick={() => onEventClick(event)} className="flex items-center space-x-4 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors duration-200">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: category?.color || '#E5E7EB' }}>
        <span className="text-xl">{category?.icon || '💸'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{title.replace(/✅|🔴/g, '').trim()}</p>
        <div className="text-sm text-gray-500">
          <StatusPill resource={resource} />
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${resource.type === 'income' ? 'text-green-600' : 'text-gray-800'}`}>
          {resource.type === 'income' ? '+' : '-'}{formatCurrency(amount)}
        </p>
      </div>
    </li>
  );
};

export default function MobileCalendarView({ events, onEventClick }) {
  const sortedEvents = [...events].sort((a, b) => a.start - b.start);

  const groupedEvents = sortedEvents.reduce((acc, event) => {
    const date = event.start.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {});

  if (events.length === 0) {
    return (
        <div className="text-center py-10">
            <FaRegCalendarAlt className="mx-auto text-4xl text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">No hay eventos para este mes.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">{date}</h3>
          <ul className="space-y-2">
            {dateEvents.map(event => (
              <EventItem key={event.id} event={event} onEventClick={onEventClick} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
