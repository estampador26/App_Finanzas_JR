import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';

const IncomeModal = ({ isOpen, onClose, user, incomeToEdit }) => {
  const isEditMode = Boolean(incomeToEdit);
  const initialFormState = {
    name: '',
    amount: '',
    type: 'recurrent', // 'recurrent' or 'unique'
    date: new Date().toISOString().split('T')[0], // Defaults to today
    categoryId: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData({
          ...incomeToEdit,
          amount: parseFloat(incomeToEdit.amount) || 0 || '',
          date: incomeToEdit.date || new Date().toISOString().split('T')[0],
          categoryId: incomeToEdit.categoryId || '',
        });
      } else {
        setFormData(initialFormState);
      }
    } else {
        setFormData(initialFormState); // Reset form when modal is closed
    }
  }, [isOpen, incomeToEdit, isEditMode]);

  useEffect(() => {
    if (!isOpen || !user) {
      setCategories([]);
      return;
    }

    const q = query(collection(db, 'categories'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(fetchedCategories);
    });

    return () => unsubscribe();
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.date) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    const dataToSave = {
      userId: user.uid,
      name: formData.name,
      amount: parseFloat(formData.amount) || 0,
      type: formData.type,
      date: formData.date,
      categoryId: formData.categoryId || null,
    };

    try {
      if (isEditMode) {
        const incomeRef = doc(db, 'incomes', incomeToEdit.id);
        await updateDoc(incomeRef, { ...dataToSave, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'incomes'), { ...dataToSave, createdAt: serverTimestamp() });
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar el ingreso: ', error);
      alert('Hubo un error al guardar el ingreso.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800">
            {isEditMode ? 'Editar Ingreso' : 'Añadir Nuevo Ingreso'}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">Nombre del Ingreso</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary" required />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-neutral-700 mb-1">Monto</label>
            <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary" placeholder="0.00" required />
          </div>
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-neutral-700 mb-1">Categoría (Opcional)</label>
            <select name="categoryId" id="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary">
              <option value="">Sin categoría</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-neutral-700 mb-1">Tipo de Ingreso</label>
            <select name="type" id="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary">
              <option value="recurrent">Recurrente</option>
              <option value="unique">Único</option>
            </select>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-neutral-700 mb-1">Fecha</label>
            <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary" required />
          </div>
        </div>
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors" disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-light transition-colors flex items-center" disabled={loading}>
            {loading ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Añadir Ingreso')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IncomeModal;
