import { useState } from 'react';

export default function AddTransactionModal({ isOpen, onClose, onAddTransaction }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTransaction({ description, amount: parseFloat(amount), type });
    onClose(); // Close modal after submission
    // Reset form
    setDescription('');
    setAmount('');
    setType('expense');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 z-50 w-full max-w-md">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Añadir Nueva Transacción</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700">Descripción</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-neutral-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-neutral-700">Monto</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full border border-neutral-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block w-full border border-neutral-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="bg-neutral-200 text-neutral-800 px-4 py-2 rounded-md hover:bg-neutral-300">
              Cancelar
            </button>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-light">
              Añadir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
