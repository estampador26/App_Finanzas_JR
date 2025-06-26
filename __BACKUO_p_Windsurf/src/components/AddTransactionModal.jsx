import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const AddTransactionModal = ({ isOpen, onClose, user }) => {
    const initialFormState = { amount: '', categoryId: '', description: '' };
    const [formData, setFormData] = useState(initialFormState);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !user) {
            setExpenseCategories([]);
            return;
        }

        const q = query(
            collection(db, 'categories'),
            where('userId', '==', user.uid),
            where('type', '==', 'expense'),
            orderBy('name', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExpenseCategories(fetchedCategories);
            // Set default category if not already set
            if (fetchedCategories.length > 0 && !formData.categoryId) {
                setFormData(prev => ({ ...prev, categoryId: fetchedCategories[0].id }));
            }
        });

        return () => unsubscribe();
    }, [isOpen, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.categoryId) {
            alert('Por favor, completa el monto y la categoría.');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'transactions'), {
                userId: user.uid,
                amount: parseFloat(formData.amount),
                categoryId: formData.categoryId,
                description: formData.description,
                date: serverTimestamp(),
                type: 'expense' // Explicitly mark as an expense
            });
            setFormData(initialFormState);
            onClose();
        } catch (error) {
            console.error("Error al añadir la transacción: ", error);
            alert("Hubo un error al guardar el gasto.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setFormData(initialFormState);
        }
    }, [isOpen]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-neutral-200">
                        <h2 className="text-xl font-bold text-neutral-800">Añadir Gasto</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-neutral-700 mb-1">Monto</label>
                            <input
                                type="number"
                                name="amount"
                                id="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="categoryId" className="block text-sm font-medium text-neutral-700 mb-1">Categoría</label>
                            <select
                                name="categoryId"
                                id="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary"
                                required
                            >
                                {expenseCategories.length > 0 ? (
                                    expenseCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))
                                ) : (
                                    <option value="" disabled>No hay categorías de gastos</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">Descripción (Opcional)</label>
                            <input
                                type="text"
                                name="description"
                                id="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary"
                                placeholder="Ej: Almuerzo de hoy"
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors" disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-light transition-colors" disabled={loading}>
                            {loading ? 'Guardando...' : 'Añadir Gasto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTransactionModal;
