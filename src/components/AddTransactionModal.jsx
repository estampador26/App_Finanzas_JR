import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale';
import { toTimestamp } from '../utils/dateUtils';

registerLocale('es', es);

const AddTransactionModal = ({ isOpen, onClose, transactionToEdit, initialData }) => {
    const [user] = useAuthState(auth);
    const isEditing = !!transactionToEdit;

        const getInitialFormData = () => ({
        amount: '',
        categoryId: '',
        description: '',
        date: new Date(),
        recurringPaymentId: null,
    });

    const [formData, setFormData] = useState(getInitialFormData());
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const dataForForm = transactionToEdit || initialData;

        if (dataForForm) {
            let dateToSet = new Date();
            if (dataForForm.date) {
                const parsedDate = (typeof dataForForm.date.toDate === 'function')
                    ? dataForForm.date.toDate()
                    : new Date(dataForForm.date);
                if (!isNaN(parsedDate.getTime())) {
                    dateToSet = parsedDate;
                }
            }
            
            setFormData({
                amount: dataForForm.amount || '',
                categoryId: dataForForm.categoryId || '',
                description: dataForForm.description || '',
                date: dateToSet, // Keep as Date object
                recurringPaymentId: dataForForm.recurringPaymentId || null,
            });
        } else {
            // Reset for new transaction
            setFormData(getInitialFormData());
        }
    }, [isOpen, transactionToEdit, initialData]);

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
            if (fetchedCategories.length > 0 && !isEditing && !initialData) {
                setFormData(prev => ({ ...prev, categoryId: fetchedCategories[0].id }));
            }
        });
        return () => unsubscribe();
    }, [isOpen, user, isEditing, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, date }));
    };

    const handleClose = () => {
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.categoryId || !formData.date) {
            alert('Por favor, completa el monto, la categoría y la fecha.');
            return;
        }
        const parsedAmount = parseFloat(formData.amount);
        if (isNaN(parsedAmount)) {
            alert('El monto ingresado no es un número válido.');
            return;
        }

        setLoading(true);
        try {
            const transactionData = {
                userId: user.uid,
                amount: parsedAmount,
                categoryId: formData.categoryId,
                description: formData.description,
                date: toTimestamp(formData.date),
                type: 'expense',
                ...(formData.recurringPaymentId && { recurringPaymentId: formData.recurringPaymentId }),
            };

            if (isEditing) {
                const transactionRef = doc(db, 'transactions', transactionToEdit.id);
                await updateDoc(transactionRef, transactionData);
            } else {
                transactionData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'transactions'), transactionData);
            }
            onClose();
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert("Hubo un error al guardar el gasto.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-neutral-200">
                        <h2 className="text-xl font-bold text-neutral-800">{isEditing ? 'Editar Gasto' : 'Añadir Gasto'}</h2>
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
                            <label htmlFor="date" className="block text-sm font-medium text-neutral-700 mb-1">Fecha</label>
                            <div className="relative">
                                <DatePicker
                                  selected={formData.date}
                                  onChange={handleDateChange}
                                  dateFormat="dd/MM/yyyy"
                                  locale="es"
                                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary"
                                />
                            </div>
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
                                <option value="" disabled>Selecciona una categoría</option>
                                {expenseCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
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
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors" disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-light transition-colors" disabled={loading}>
                            {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Añadir Gasto')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTransactionModal;