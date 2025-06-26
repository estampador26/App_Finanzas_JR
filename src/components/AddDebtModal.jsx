import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const FormInput = ({ id, label, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-neutral-700">{label}</label>
    <input id={id} {...props} className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-focus focus:border-primary-focus sm:text-sm" />
  </div>
);

const FormSelect = ({ id, label, children, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-neutral-700">{label}</label>
    <select id={id} {...props} className="mt-1 block w-full px-3 py-2 border border-neutral-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-focus focus:border-primary-focus sm:text-sm">
      {children}
    </select>
  </div>
);

const DebtModal = ({ isOpen, onClose, user, debtToEdit }) => {
  const isEditMode = Boolean(debtToEdit);

  const initialFormState = {
    name: '',
    initialAmount: '',
    classification: 'principal',
    liabilityType: 'simple',
    minimumPayment: '',
    paymentDay: '',
    firstPaymentDate: '',
    installmentAmount: '',
        totalInstallments: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setFormData({
          name: debtToEdit.name || '',
          initialAmount: debtToEdit.initialAmount || '',
          classification: debtToEdit.classification || 'principal',
          liabilityType: debtToEdit.liabilityType || 'simple',
          minimumPayment: debtToEdit.minimumPayment || '',
          paymentDay: debtToEdit.paymentDay || '',
          firstPaymentDate: debtToEdit.firstPaymentDate || '',
          installmentAmount: debtToEdit.installmentAmount || '',
          totalInstallments: debtToEdit.totalInstallments || '',
        });
      } else {
        setFormData(initialFormState);
      }
    }
  }, [isOpen, debtToEdit, isEditMode]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return console.error("Error: Usuario no autenticado.");

    // Common data structure
    const dataPayload = {
      name: formData.name,
      initialAmount: parseFloat(formData.initialAmount),
      classification: formData.classification,
      liabilityType: formData.liabilityType,
    };

    // Add specific fields based on liability type
    if (formData.liabilityType === 'revolving') {
      dataPayload.minimumPayment = parseFloat(formData.minimumPayment);
      dataPayload.paymentDay = parseInt(formData.paymentDay, 10);
      dataPayload.firstPaymentDate = formData.firstPaymentDate;
    } else if (formData.liabilityType === 'loan') {
      dataPayload.installmentAmount = parseFloat(formData.installmentAmount);
      dataPayload.totalInstallments = parseInt(formData.totalInstallments, 10);
      dataPayload.paymentDay = parseInt(formData.paymentDay, 10);
      dataPayload.firstPaymentDate = formData.firstPaymentDate;
    }

    try {
      if (isEditMode) {
        const debtRef = doc(db, 'debts', debtToEdit.id);
        await updateDoc(debtRef, dataPayload);
        console.log('Deuda actualizada con éxito');
      } else {
        const dataToSave = {
          ...dataPayload,
          userId: user.uid,
          createdAt: serverTimestamp(),
          status: 'active',
          balance: parseFloat(formData.initialAmount), // Balance only on creation
        };
        await addDoc(collection(db, 'debts'), dataToSave);
        console.log('Deuda guardada con éxito');
      }
      onClose();
    } catch (error) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'guardar'} la deuda: `, error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-neutral-800">{isEditMode ? 'Editar Deuda' : 'Añadir Nueva Deuda'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput id="name" label="Nombre de la Deuda" type="text" placeholder="Ej: Tarjeta Visa, Préstamo Coche" value={formData.name} onChange={handleChange} required />
          <FormInput id="initialAmount" label="Monto Inicial o Saldo Actual ($)" type="number" placeholder="15000" value={formData.initialAmount} onChange={handleChange} required />
          
          <FormSelect id="classification" label="Clasificación de la Deuda" value={formData.classification} onChange={handleChange}>
            <option value="principal">Deuda Principal (Bancaria, Préstamo Mayor)</option>
            <option value="commercial">Financiación Comercial (Compras a Plazos)</option>
          </FormSelect>

          <FormSelect id="liabilityType" label="Tipo de Pasivo" value={formData.liabilityType} onChange={handleChange}>
            <option value="simple">Deuda Simple (Sin pagos fijos)</option>
            <option value="revolving">Crédito Revolving (Tarjeta de Crédito)</option>
            <option value="loan">Préstamo a Plazos (Cuotas Fijas)</option>
          </FormSelect>

          {formData.liabilityType === 'revolving' && (
            <>
              <FormInput id="minimumPayment" label="Pago Mínimo Mensual ($)" type="number" value={formData.minimumPayment} onChange={handleChange} required />
              <FormInput id="paymentDay" label="Día de Pago (1-31)" type="number" min="1" max="31" value={formData.paymentDay} onChange={handleChange} required />
              <FormInput id="firstPaymentDate" label="Fecha de Inicio del Primer Pago" type="date" value={formData.firstPaymentDate} onChange={handleChange} required />
            </>
          )}

          {formData.liabilityType === 'loan' && (
            <>
              <FormInput id="installmentAmount" label="Monto de la Cuota ($)" type="number" value={formData.installmentAmount} onChange={handleChange} required />
              <FormInput id="totalInstallments" label="Número Total de Cuotas" type="number" value={formData.totalInstallments} onChange={handleChange} required />
              <FormInput id="paymentDay" label="Día de Pago (1-31)" type="number" min="1" max="31" value={formData.paymentDay} onChange={handleChange} required />
              <FormInput id="firstPaymentDate" label="Fecha de Inicio del Primer Pago" type="date" value={formData.firstPaymentDate} onChange={handleChange} required />
            </>
          )}

          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-neutral-200 text-neutral-800 font-bold py-2 px-4 rounded-lg hover:bg-neutral-300 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-light transition-colors shadow-sm">
              {isEditMode ? 'Guardar Cambios' : 'Guardar Deuda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtModal;
