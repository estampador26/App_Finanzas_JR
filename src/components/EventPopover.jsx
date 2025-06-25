import React from 'react';
import { formatCurrency } from '../utils/currencyUtils';
import { FaTimes, FaCalendarAlt, FaTag, FaDollarSign, FaInfoCircle } from 'react-icons/fa';

const StatusBadge = ({ resource }) => {
  const { isPaid, isOverdue } = resource;
  if (isPaid) {
    return <span className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Pagado</span>;
  }
  if (isOverdue) {
    return <span className="px-3 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Vencido</span>;
  }
  return <span className="px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">Pendiente</span>;
};

export default function EventPopover({ event, onClose, onRegisterPayment }) {
  if (!event) return null;

  const { title, resource, start } = event;
  const { type, amount, isPaid, isOverdue, originalDoc } = resource;

  const canRegisterPayment = type === 'recurring' && !isPaid;

  const handleRegisterClick = () => {
    onRegisterPayment(originalDoc, new Date()); // Register payment on the current date
    onClose();
  }

  const eventTypeLabel = {
    recurring: 'Pago Recurrente',
    expense: 'Gasto Único',
    income: 'Ingreso'
  }[type];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto z-50 transform transition-all" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800">{title.replace(/✅|🔴/g, '').trim()}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-2">
            <FaTimes size={20} />
          </button>
        </div>
        
        <div className="space-y-4 text-gray-600">
          <div className="flex items-center">
            <FaDollarSign className="mr-3 text-gray-400" />
            <span className="font-semibold text-lg text-gray-800">{formatCurrency(amount)}</span>
          </div>
          <div className="flex items-center">
            <FaInfoCircle className="mr-3 text-gray-400" />
            <span>{eventTypeLabel}</span>
          </div>
          <div className="flex items-center">
            <FaCalendarAlt className="mr-3 text-gray-400" />
            <span>{new Date(start).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          {type === 'recurring' && (
            <div className="flex items-center">
                <FaTag className="mr-3 text-gray-400" />
                <StatusBadge resource={resource} />
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
          {canRegisterPayment && (
            <button 
              onClick={handleRegisterClick} 
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
            >
              Registrar Pago
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
