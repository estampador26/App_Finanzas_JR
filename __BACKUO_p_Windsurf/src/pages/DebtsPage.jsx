import React, { useState, useEffect } from 'react';
import DebtModal from '../components/AddDebtModal';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';

const DebtsPage = ({ user }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState(null);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(
      collection(db, 'debts'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const debtsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDebts(debtsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar las deudas: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

    const handleDelete = async (debtId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta deuda? Esta acción no se puede deshacer.')) {
      try {
        await deleteDoc(doc(db, 'debts', debtId));
        console.log('Deuda eliminada con éxito');
      } catch (error) {
        console.error('Error al eliminar la deuda: ', error);
      }
    }
  };

  const handleEdit = (debt) => {
    setDebtToEdit(debt);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setDebtToEdit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDebtToEdit(null);
  };

  return (
    <>
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-800">Control de Deudas</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Aquí puedes gestionar todos tus préstamos, créditos y otras deudas.
              </p>
            </div>
            <div>
              <button 
                onClick={handleAddNew}
                className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-light transition-colors duration-300 shadow-sm"
              >
                Añadir Deuda
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm">
            {loading ? (
              <p className="p-6 text-neutral-500">Cargando deudas...</p>
            ) : debts.length > 0 ? (
              <ul className="divide-y divide-neutral-200">
                {debts.map(debt => (
                  <li key={debt.id} className="p-4 hover:bg-neutral-50 flex justify-between items-center">
                    <div className="flex-grow">
                      <p className="font-semibold text-neutral-800">{debt.name}</p>
                      <p className="text-sm text-neutral-600">
                        Saldo Actual: <span className="font-medium text-primary">${(debt.balance || 0).toFixed(2)}</span>
                        <span className="text-neutral-400 ml-2">(Inicial: ${(debt.initialAmount || 0).toFixed(2)})</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEdit(debt)}
                        className="text-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold py-1 px-3 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(debt.id)}
                        className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-6 text-neutral-500">Aún no has añadido ninguna deuda.</p>
            )}
          </div>

        </div>
      </div>
      <DebtModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        user={user} 
        debtToEdit={debtToEdit}
      />
    </>
  );
};

export default DebtsPage;
