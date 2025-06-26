import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import IncomeModal from '../components/IncomeModal';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { FaCar, FaShoppingCart, FaHome, FaFileInvoiceDollar, FaGift, FaGraduationCap, FaHeartbeat, FaQuestionCircle } from 'react-icons/fa';
import { formatCurrency } from '../utils/currencyUtils';

const IncomesPage = ({ user }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [incomeToEdit, setIncomeToEdit] = useState(null);
    const [incomes, setIncomes] = useState([]);
    const [categoriesMap, setCategoriesMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const q = query(
            collection(db, 'incomes'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc')
        );

        const unsubscribes = [
            onSnapshot(q, (querySnapshot) => {
                const incomesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setIncomes(incomesData);
                setLoading(false);
            }, (error) => {
                console.error("Error al cargar los ingresos: ", error);
                setLoading(false);
            }),
            onSnapshot(query(collection(db, 'categories'), where('userId', '==', user.uid)), (snapshot) => {
                const catMap = {};
                snapshot.docs.forEach(doc => {
                    catMap[doc.id] = doc.data();
                });
                setCategoriesMap(catMap);
            })
        ];

        return () => unsubscribes.forEach(unsub => unsub());
    }, [user]);

    const handleDelete = async (incomeId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este ingreso?')) {
            try {
                await deleteDoc(doc(db, 'incomes', incomeId));
            } catch (error) {
                console.error('Error al eliminar el ingreso: ', error);
            }
        }
    };

    const handleEdit = (income) => {
        setIncomeToEdit(income);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setIncomeToEdit(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIncomeToEdit(null);
    };

    const icons = {
        FaCar, FaShoppingCart, FaHome, FaFileInvoiceDollar, FaGift, FaGraduationCap, FaHeartbeat, FaQuestionCircle
    };

    return (
        <>
            <div className="p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Header 
                        title="Ingresos"
                        subtitle="Gestiona tus fuentes de ingresos recurrentes y únicos."
                    >
                        <button onClick={handleAddNew} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-light transition-colors duration-300 shadow-sm">
                            Añadir Ingreso
                        </button>
                    </Header>

                    <div className="bg-white rounded-lg shadow-sm">
                        {loading ? (
                            <p className="p-6 text-neutral-500">Cargando ingresos...</p>
                        ) : incomes.length > 0 ? (
                            <ul className="divide-y divide-neutral-200">
                                {incomes.map(income => (
                                    <li key={income.id} className="grid grid-cols-[1fr_auto] items-center gap-4 p-4 hover:bg-neutral-50">
                                        {/* -- Main content area (takes up all available space) -- */}
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${(categoriesMap[income.categoryId] || {}).color || 'bg-neutral-500'}`}>
                                                {React.createElement(icons[(categoriesMap[income.categoryId] || {}).icon] || FaQuestionCircle, { className: 'w-5 h-5 text-white' })}
                                            </div>
                                            <div className="truncate">
                                                <p className="font-semibold text-neutral-800 truncate">{income.name}</p>
                                                <p className="text-sm text-neutral-600">
                                                    Monto: <span className="font-medium text-accent-success">{formatCurrency(income.amount)}</span>
                                                    <span className="text-neutral-400 mx-2">|</span>
                                                    Categoría: <span className="font-medium">{(categoriesMap[income.categoryId] || {}).name || 'Sin Categoría'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        {/* -- Action buttons area (fixed width) -- */}
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleEdit(income)} className="text-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold py-1 px-3 rounded-lg transition-colors flex-shrink-0">
                                                Editar
                                            </button>
                                            <button onClick={() => handleDelete(income.id)} className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg transition-colors flex-shrink-0">
                                                Eliminar
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="p-6 text-neutral-500">Aún no has añadido ningún ingreso. ¡Empieza ahora!</p>
                        )}
                    </div>
                </div>
            </div>
            <IncomeModal isOpen={isModalOpen} onClose={handleCloseModal} user={user} incomeToEdit={incomeToEdit} />
        </>
    );
};

export default IncomesPage;
