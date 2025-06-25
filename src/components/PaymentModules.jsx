import React, { useState, useMemo } from 'react';
import { FaLandmark, FaShoppingCart, FaConciergeBell } from 'react-icons/fa';

const formatCurrency = (value) => {
  const amount = Number(value);
  if (isNaN(amount)) return '$0';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

const PaymentItem = ({ item, onRegisterPayment, isPrivacyMode }) => (
  <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
    <div>
      <p className="font-semibold text-gray-700 text-sm">{item.name}</p>
      <p className="text-xs text-gray-500">
        Vence: Día {item.paymentDay}
      </p>
    </div>
    <div className="text-right">
        <p className="font-semibold text-gray-800 text-sm">
            {isPrivacyMode ? '*****' : formatCurrency(item.amount)}
        </p>
        <button 
            onClick={() => onRegisterPayment(item)}
            className="text-xs text-primary hover:underline"
        >
            Registrar Pago
        </button>
    </div>
  </div>
);

const ModuleCard = ({ title, icon, items, onRegisterPayment, isPrivacyMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const visibleItems = isExpanded ? filteredItems : filteredItems.slice(0, 3);

  const total = filteredItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="text-base font-bold text-gray-700 ml-2">{title}</h3>
      </div>
      
      <div className="mb-3">
        <input
          type="text"
          placeholder="Filtrar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
        />
      </div>

      <div className="space-y-1 flex-grow min-h-[150px] overflow-y-auto pr-2">
        {visibleItems.length > 0 ? (
          visibleItems.map(item => <PaymentItem key={item.id} item={item} onRegisterPayment={onRegisterPayment} isPrivacyMode={isPrivacyMode} />)
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400 text-center py-4">
              {searchTerm ? 'No hay coincidencias.' : 'No hay pagos para este mes.'}
            </p>
          </div>
        )}
      </div>

      {filteredItems.length > 3 && (
        <div className="text-center mt-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm text-blue-600 hover:underline">
            {isExpanded ? 'Ver menos' : `Ver más (${filteredItems.length - 3})`}
          </button>
        </div>
      )}
      <div className="text-right font-bold text-gray-800 border-t border-gray-200 pt-3 mt-auto">
        Total: {isPrivacyMode ? '••••' : formatCurrency(total)}
      </div>
    </div>
  );
};

const PaymentModules = ({ categorizedPayments, onRegisterPayment, isPrivacyMode }) => {
  const { bancos = [], compras = [], servicios = [] } = categorizedPayments || {};

  const modules = [
    { title: "Bancos y Tarjetas", icon: <FaLandmark className="text-blue-500" />, items: bancos },
    { title: "Compras Financiadas", icon: <FaShoppingCart className="text-purple-500" />, items: compras },
    { title: "Servicios y Suscripciones", icon: <FaConciergeBell className="text-orange-500" />, items: servicios }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {modules.map(module => (
        <ModuleCard 
          key={module.title}
          title={module.title} 
          icon={module.icon} 
          items={module.items} 
          onRegisterPayment={onRegisterPayment}
          isPrivacyMode={isPrivacyMode}
        />
      ))}
    </div>
  );
};

export default PaymentModules;
