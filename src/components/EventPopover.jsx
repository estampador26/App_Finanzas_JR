import React from 'react';
import { formatCurrency } from '../utils/currencyUtils';

export default function EventPopover({ event, onClose, onRegisterPayment }) {
  if (!event) return null;

  const { title, resource } = event;
  const { type, amount, isPaid, originalDoc } = resource;

  const canRegisterPayment = type === 'recurring' && !isPaid;

  const handleRegisterClick = () => {
    onRegisterPayment(originalDoc, event.start);
    onClose(); // Close popover after action
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-auto z-50" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Detalle del Evento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        
        <div className="space-y-3">
            <p><span className="font-semibold">Evento:</span> {title.replace('✅', '').trim()}</p>
            <p><span className="font-semibold">Monto:</span> {formatCurrency(amount)}</p>
            <p><span className="font-semibold">Tipo:</span> <span className="capitalize">{type === 'recurring' ? 'Pago Recurrente' : (type === 'expense' ? 'Gasto Único' : 'Ingreso')}</span></p>
            {type === 'recurring' && (
                <p><span className="font-semibold">Estado:</span> {isPaid ? <span className='text-green-600'>Pagado</span> : <span className='text-red-600'>Pendiente</span>}</p>
            )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cerrar
          </button>
          {canRegisterPayment && (
            <button 
              onClick={handleRegisterClick} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Registrar Pago
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
