import React, { useState, useEffect } from 'react';
import RecurringPaymentModal from '../components/RecurringPaymentModal';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { FaCar, FaShoppingCart, FaHome, FaFileInvoiceDollar, FaGift, FaGraduationCap, FaHeartbeat, FaQuestionCircle } from 'react-icons/fa';

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

const RecurringPaymentsPage = ({ user }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] = useState(null);
    const [payments, setPayments] = useState([]);
    const [categoriesMap, setCategoriesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'debt', 'expense'

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const q = query(
            collection(db, 'recurringPayments'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribes = [
            onSnapshot(q, (querySnapshot) => {
                const paymentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPayments(paymentsData);
                setLoading(false);
            }, (error) => {
                console.error("Error al cargar los pagos recurrentes: ", error);
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

    const handleDelete = async (paymentId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este pago recurrente? Esta acción no se puede deshacer.')) {
            try {
                await deleteDoc(doc(db, 'recurringPayments', paymentId));
            } catch (error) {
                console.error('Error al eliminar el pago recurrente: ', error);
            }
        }
    };

    const handleEdit = (payment) => {
        setPaymentToEdit(payment);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setPaymentToEdit(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setPaymentToEdit(null);
    };

    const icons = {
        FaCar, FaShoppingCart, FaHome, FaFileInvoiceDollar, FaGift, FaGraduationCap, FaHeartbeat, FaQuestionCircle
    };

    const getFilterButtonClasses = (buttonFilter) => {
        const base = "px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200";
        if (filter === buttonFilter) {
            return `${base} bg-primary text-white shadow-sm`;
        }
        return `${base} bg-neutral-100 text-neutral-700 hover:bg-neutral-200`;
    };

    const filteredPayments = payments.filter(payment => {
        if (filter === 'all') return true;
        return payment.type === filter;
    });

    const PaymentDetails = ({ payment }) => {
        if (payment.type === 'debt') {
            return (
                <p className="text-sm text-neutral-600">
                    Saldo Actual: <span className="font-medium text-red-600">{formatCurrency(payment.balance || 0)}</span>
                    <span className="text-neutral-400 ml-2">(Inicial: {formatCurrency(payment.initialAmount || 0)})</span>
                </p>
            );
        }
        if (payment.type === 'expense') {
            const category = categoriesMap[payment.categoryId] || {};
            return (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${category.color || 'bg-neutral-500'}`}>
                         {React.createElement(icons[category.icon] || FaQuestionCircle, { className: 'w-4 h-4 text-white' })}
                    </div>
                    <div>
                        <p className="text-sm text-neutral-600">
                            Monto: <span className="font-medium text-blue-600">{formatCurrency(payment.amount || 0)}</span>
                        </p>
                        <p className="text-xs text-neutral-500">
                            Categoría: <span className="font-medium">{category.name || 'Sin Categoría'}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };
    
    const PaymentTypeBadge = ({ type }) => {
        const baseClasses = "text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full";
        if (type === 'debt') {
            return <span className={`${baseClasses} bg-red-100 text-red-800`}>Deuda</span>;
        }
        if (type === 'expense') {
            return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Gasto Fijo</span>;
        }
        return null;
    };

    return (
        <>
            <div className="p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800">Pagos Recurrentes</h1>
                            <p className="mt-1 text-sm text-neutral-600">
                                Gestiona tus deudas, gastos fijos y suscripciones en un solo lugar.
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={handleAddNew}
                                className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-light transition-colors duration-300 shadow-sm"
                            >
                                Añadir Pago
                            </button>
                        </div>
                    </div>

                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-neutral-700 mr-2">Filtrar por:</span>
                        <button onClick={() => setFilter('all')} className={getFilterButtonClasses('all')}>Todos</button>
                        <button onClick={() => setFilter('debt')} className={getFilterButtonClasses('debt')}>Deudas</button>
                        <button onClick={() => setFilter('expense')} className={getFilterButtonClasses('expense')}>Gastos Fijos</button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm">
                        {loading ? (
                            <p className="p-6 text-neutral-500">Cargando pagos...</p>
                        ) : filteredPayments.length > 0 ? (
                            <ul className="divide-y divide-neutral-200">
                                {filteredPayments.map(payment => (
                                    <li key={payment.id} className="p-4 hover:bg-neutral-50 flex justify-between items-center">
                                        <div className="flex-grow">
                                            <div className="flex items-center">
                                                <PaymentTypeBadge type={payment.type} />
                                                <p className="font-semibold text-neutral-800">{payment.name}</p>
                                            </div>
                                            <div className="mt-1">
                                                <PaymentDetails payment={payment} />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(payment)}
                                                className="text-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold py-1 px-3 rounded-lg transition-colors"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(payment.id)}
                                                className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg transition-colors"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="p-6 text-neutral-500">No se encontraron pagos con el filtro actual. Intenta con otra opción.</p>
                        )}
                    </div>

                </div>
            </div>
            <RecurringPaymentModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                user={user}
                paymentToEdit={paymentToEdit}
            />
        </>
    );
};

export default RecurringPaymentsPage;
