import React, { useState, useEffect } from 'react';
import CategoryModal from '../components/CategoryModal';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { FaCar, FaShoppingCart, FaHome, FaFileInvoiceDollar, FaGift, FaGraduationCap, FaHeartbeat, FaQuestionCircle } from 'react-icons/fa';

const CategoriesPage = ({ user }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const q = query(
            collection(db, 'categories'),
            where('userId', '==', user.uid),
            orderBy('name', 'asc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(categoriesData);
            setLoading(false);
        }, (error) => {
            console.error("Error al cargar las categorías: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (categoryId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
            try {
                await deleteDoc(doc(db, 'categories', categoryId));
            } catch (error) {
                console.error('Error al eliminar la categoría: ', error);
            }
        }
    };

    const handleEdit = (category) => {
        setCategoryToEdit(category);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setCategoryToEdit(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCategoryToEdit(null);
    };

    const icons = {
        FaCar, FaShoppingCart, FaHome, FaFileInvoiceDollar, FaGift, FaGraduationCap, FaHeartbeat, FaQuestionCircle
    };

    return (
        <>
            <div className="p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800">Gestionar Categorías</h1>
                            <p className="mt-1 text-sm text-neutral-600">
                                Crea y administra tus categorías para ingresos y gastos.
                            </p>
                        </div>
                        <div>
                            <button onClick={handleAddNew} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-light transition-colors duration-300 shadow-sm">
                                Añadir Categoría
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm">
                        {loading ? (
                            <p className="p-6 text-neutral-500">Cargando categorías...</p>
                        ) : categories.length > 0 ? (
                            <ul className="divide-y divide-neutral-200">
                                {categories.map(category => (
                                    <li key={category.id} className="p-4 hover:bg-neutral-50 flex justify-between items-center">
                                        <div className="flex items-center gap-4 flex-grow">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${category.color || 'bg-neutral-500'}`}>
                                                {React.createElement(icons[category.icon] || FaQuestionCircle, { className: 'w-5 h-5 text-white' })}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutral-800">{category.name}</p>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${category.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {category.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleEdit(category)} className="text-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold py-1 px-3 rounded-lg transition-colors">
                                                Editar
                                            </button>
                                            <button onClick={() => handleDelete(category.id)} className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg transition-colors">
                                                Eliminar
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="p-6 text-neutral-500">Aún no has creado ninguna categoría. ¡Empieza ahora!</p>
                        )}
                    </div>
                </div>
            </div>
            <CategoryModal isOpen={isModalOpen} onClose={handleCloseModal} user={user} categoryToEdit={categoryToEdit} />
        </>
    );
};

export default CategoriesPage;
