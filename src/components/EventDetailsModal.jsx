import { FiX } from 'react-icons/fi';

// Helper function to format currency, assuming it might not be available elsewhere initially.
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(value);
};

export default function EventDetailsModal({ eventInfo, onClose, onRegisterPayment }) {
  if (!eventInfo) return null;

  const { title, extendedProps } = eventInfo.event;
  const { status } = extendedProps;

  // Determine the correct amount based on payment type
  const amount = extendedProps.amount || extendedProps.installmentAmount || extendedProps.minimumPayment || 0;

  const statusClasses = {
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    pending: 'bg-blue-100 text-blue-800',
  };

  const statusText = {
    paid: 'Pagado',
    overdue: 'Vencido',
    pending: 'Pendiente',
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 p-4 modal-overlay">
      <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-sm md:max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
            <FiX className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Monto</p>
            <p className="text-base md:text-lg font-semibold text-gray-800">{formatCurrency(amount || 0)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Estado</p>
            <p>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>
                {statusText[status]}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 btn-hover-scale"
          >
            Cerrar
          </button>
          {status !== 'paid' && (
            <button
              onClick={() => onRegisterPayment({ ...extendedProps, amount })}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark btn-hover-scale"
            >
              Registrar Pago
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
