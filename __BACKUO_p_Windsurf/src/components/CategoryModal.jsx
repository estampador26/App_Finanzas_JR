import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import * as FaIcons from 'react-icons/fa';

const iconList = Object.keys(FaIcons).filter(name => name.startsWith('Fa'));

const iconMap = {
  'FaPizzaSlice': 'Comida',
  'FaCar': 'Transporte',
  'FaHome': 'Hogar',
  'FaFileInvoiceDollar': 'Cuentas',
  'FaShoppingCart': 'Compras',
  'FaHeartbeat': 'Salud',
  'FaFilm': 'Ocio',
  'FaGraduationCap': 'Educación',
  'FaGift': 'Regalos',
  'FaPiggyBank': 'Ahorro',
  'FaPlane': 'Viajes',
  'FaTshirt': 'Ropa',
  'FaDumbbell': 'Gimnasio',
  'FaPaw': 'Mascotas',
  'FaQuestion': 'Otros',
};

const CategoryModal = ({ isOpen, onClose, user, categoryToEdit }) => {
  const isEditMode = Boolean(categoryToEdit);
  const initialFormState = {
    name: '',
    type: 'expense',
    color: 'bg-neutral-500',
    icon: 'FaQuestionCircle',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [iconSearch, setIconSearch] = useState('');
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && categoryToEdit) {
        const editData = { ...initialFormState, ...categoryToEdit };
        setFormData(editData);
        setIconSearch(editData.icon || '');
      } else {
        setFormData(initialFormState);
        setIconSearch('');
      }
    } else {
      setFormData(initialFormState);
      setIconSearch('');
    }
  }, [isOpen, categoryToEdit, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const handleIconSelect = (iconName) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
    setIconSearch(iconName);
    setIsIconDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.icon) {
      alert('Por favor, completa el nombre y selecciona un icono.');
      return;
    }

    setLoading(true);
    const dataToSave = { ...formData, userId: user.uid };

    try {
      if (isEditMode) {
        const categoryRef = doc(db, 'categories', categoryToEdit.id);
        await updateDoc(categoryRef, { ...dataToSave, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'categories'), { ...dataToSave, createdAt: serverTimestamp() });
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar la categoría: ', error);
      alert('Hubo un error al guardar la categoría.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Helper to render the preview icon
  const renderIcon = (iconName, colorClass) => {
    if (!iconName || !FaIcons[iconName]) return null;
    const textClass = colorClass ? colorClass.replace('bg-', 'text-') : 'text-neutral-500';
    return React.createElement(FaIcons[iconName], { 
      className: `w-8 h-8 mt-2 transition-colors ${textClass}` 
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800">
            {isEditMode ? 'Editar Categoría' : 'Añadir Nueva Categoría'}
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">Nombre</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary" required />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
            <select name="type" id="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary">
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </div>

          <div>
            <label htmlFor="icon" className="block text-sm font-medium text-neutral-700">Icono</label>
            <div className="relative">
              <input
                type="text"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                onFocus={() => setIsIconDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsIconDropdownOpen(false), 200)} // Delay to allow click
                placeholder="Busca un icono (ej: FaCar, FaHome)..."
                className="mt-1 block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
              {isIconDropdownOpen && (
                <div className="absolute z-20 w-full bg-white border border-neutral-200 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {iconList
                    .filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()))
                    .map(name => {
                      const IconComponent = FaIcons[name];
                      return (
                        <div
                          key={name}
                          onMouseDown={() => handleIconSelect(name)} // Use onMouseDown to fire before onBlur
                          className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                        >
                          <IconComponent className="mr-3" /> {name}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            {renderIcon(formData.icon, formData.color)}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(color => (
                <button key={color} type="button" onClick={() => handleColorSelect(color)} className={`w-8 h-8 rounded-full ${color} transition-transform transform hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}></button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors" disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-light transition-colors flex items-center" disabled={loading}>
            {loading ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Añadir Categoría')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryModal;
