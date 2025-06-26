import React, { useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FaEdit, FaTrash, FaTag, FaPlus } from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as FaIcons from 'react-icons/fa';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(value);
};

const Icon = ({ name }) => {
  const IconComponent = FaIcons[name];
  if (!IconComponent) return <FaTag />; // Fallback Icon
  return <IconComponent />;
};

export default function ExpensesPage({ onOpenTransactionModal }) {
  const [user] = useAuthState(auth);

  const [transactionsSnapshot, loadingTransactions, errorTransactions] = useCollection(
    user ? query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc')) : null
  );

  const [categoriesSnapshot, loadingCategories, errorCategories] = useCollection(
    user ? query(collection(db, 'categories'), where('userId', '==', user.uid)) : null
  );

  const categoriesMap = useMemo(() => {
    if (!categoriesSnapshot) return {};
    return categoriesSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = { ...doc.data(), id: doc.id };
      return acc;
    }, {});
  }, [categoriesSnapshot]);

  const handleDelete = async (transactionId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este egreso? Esta acción no se puede deshacer.')) {
      try {
        await deleteDoc(doc(db, 'transactions', transactionId));
      } catch (error) {
        console.error("Error deleting transaction: ", error);
      }
    }
  };

  const handleEdit = (transaction) => {
    onOpenTransactionModal(transaction);
  };
  
  const handleAddNew = () => {
    onOpenTransactionModal(null);
  }

  const renderTransactionList = () => {
    if (loadingTransactions || loadingCategories) {
      return <p className="text-center text-gray-500 py-8">Cargando egresos...</p>;
    }

    if (errorTransactions || errorCategories) {
      return <p className="text-center text-red-500 py-8">Error al cargar los datos. Por favor, intenta de nuevo más tarde.</p>;
    }

    if (transactionsSnapshot?.empty) {
      return <p className="text-center text-gray-500 py-8">Aún no has registrado ningún egreso.</p>;
    }

    return (
      <div className="space-y-3">
        {transactionsSnapshot?.docs.map(doc => {
          const transaction = { id: doc.id, ...doc.data() };
          const category = categoriesMap[transaction.categoryId];

          return (
            <div key={transaction.id} className="bg-white p-3 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 w-full md:w-auto min-w-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: category?.color || '#E5E7EB' }}>
                  <span className="text-white text-2xl"><Icon name={category?.icon} /></span>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-gray-800 capitalize truncate" title={transaction.description}>
                    {transaction.description || 'Egreso sin descripción'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {category?.name || 'Sin categoría'} &middot; {transaction.date ? format(transaction.date.toDate(), 'dd MMMM, yyyy', { locale: es }) : 'Sin fecha'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                <p className="font-bold text-lg text-red-600 flex-shrink-0">{formatCurrency(transaction.amount)}</p>
                <div className="flex gap-2 border-l pl-4">
                  <button onClick={() => handleEdit(transaction)} className="p-2 text-gray-500 hover:text-primary transition-colors" title="Editar">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(transaction.id)} className="p-2 text-gray-500 hover:text-red-600 transition-colors" title="Eliminar">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Gestión de Egresos</h1>
      <p className="text-gray-600 mb-6">Aquí puedes ver, editar, eliminar y añadir todos tus gastos y transacciones.</p>
      
      <div className="mb-6">
        <button 
          onClick={handleAddNew}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
        >
          <FaPlus /> Añadir Egreso
        </button>
      </div>

      <div>
        {renderTransactionList()}
      </div>
    </div>
  );
}
