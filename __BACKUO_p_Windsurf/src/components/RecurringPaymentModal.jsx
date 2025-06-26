import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, onSnapshot, orderBy } from 'firebase/firestore';

// Helper components
const FormInput = ({ id, label, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
    <input id={id} {...props} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary" />
  </div>
);

const FormSelect = ({ id, label, children, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
    <select id={id} {...props} className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary">
      {children}
    </select>
  </div>
);

const RecurringPaymentModal = ({ isOpen, onClose, user, paymentToEdit }) => {
  const isEditMode = Boolean(paymentToEdit);
  const [paymentType, setPaymentType] = useState('debt'); // 'debt' or 'expense'

  const initialFormState = {
    // Common fields
    name: '',
    paymentDay: '',
    firstPaymentDate: '',
    endDate: '', // Optional
    // Debt specific
    initialAmount: '',
    classification: 'principal',
    liabilityType: 'simple',
    minimumPayment: '',
    installmentAmount: '',
    totalInstallments: '',
    // Expense specific
    amount: '',
    categoryId: '', // Changed from category
    paymentMethod: 'fijo', // 'fijo' or 'cuotas'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        // When editing, populate form with existing data
        const type = paymentToEdit.type || 'debt';
        setPaymentType(type);
        setFormData({
          ...initialFormState, // Start with a clean slate
          ...paymentToEdit,   // Overlay existing data
        });
      } else {
        // When adding, reset to initial state but keep the selected type
        setFormData({ ...initialFormState, name: '', initialAmount: '', amount: '' });
      }
    }
  }, [isOpen, paymentToEdit, isEditMode]);

  useEffect(() => {
    // Fetch categories only when the modal is open for an expense type
    if (!isOpen || !user || paymentType !== 'expense') {
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
        if (fetchedCategories.length > 0 && !formData.categoryId) {
            setFormData(prev => ({ ...prev, categoryId: fetchedCategories[0].id }));
        }
    });

    return () => unsubscribe();
  }, [isOpen, user, paymentType]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return console.error("Error: Usuario no autenticado.");

    const basePayload = {
      userId: user.uid,
      name: formData.name,
      type: paymentType,
      paymentDay: formData.paymentDay ? parseInt(formData.paymentDay, 10) : null,
      firstPaymentDate: formData.firstPaymentDate || null,
      endDate: formData.endDate || null,
    };

    let dataPayload;

    if (paymentType === 'debt') {
      dataPayload = {
        ...basePayload,
        initialAmount: parseFloat(formData.initialAmount) || 0,
        balance: isEditMode ? paymentToEdit.balance : parseFloat(formData.initialAmount) || 0,
        classification: formData.classification,
        liabilityType: formData.liabilityType,
      };
      if (formData.liabilityType === 'revolving') {
        dataPayload.minimumPayment = parseFloat(formData.minimumPayment) || 0;
      } else if (formData.liabilityType === 'loan') {
        dataPayload.installmentAmount = parseFloat(formData.installmentAmount) || 0;
        dataPayload.totalInstallments = parseInt(formData.totalInstallments, 10) || 0;
      }
    } else { // expense
      dataPayload = {
        ...basePayload,
        amount: parseFloat(formData.amount) || 0,
        categoryId: formData.categoryId, // Changed from category
        paymentMethod: formData.paymentMethod,
      };
      if (formData.paymentMethod === 'cuotas') {
        dataPayload.totalInstallments = parseInt(formData.totalInstallments, 10) || 0;
      }
    }

    try {
      if (isEditMode) {
        const paymentRef = doc(db, 'recurringPayments', paymentToEdit.id);
        await updateDoc(paymentRef, dataPayload);
        console.log('Pago actualizado con éxito');
      } else {
        const dataToSave = {
          ...dataPayload,
          createdAt: serverTimestamp(),
          status: 'active',
        };
        await addDoc(collection(db, 'recurringPayments'), dataToSave);
        console.log('Pago guardado con éxito');
      }
      onClose();
    } catch (error) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'guardar'} el pago: `, error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-neutral-800">{isEditMode ? 'Editar Pago Recurrente' : 'Añadir Pago Recurrente'}</h2>

        {!isEditMode && (
          <div className="flex justify-center space-x-4 mb-6">
            <button type="button" onClick={() => setPaymentType('debt')} className={`px-4 py-2 rounded-lg font-semibold ${paymentType === 'debt' ? 'bg-primary text-white' : 'bg-neutral-200'}`}>Deuda</button>
            <button type="button" onClick={() => setPaymentType('expense')} className={`px-4 py-2 rounded-lg font-semibold ${paymentType === 'expense' ? 'bg-primary text-white' : 'bg-neutral-200'}`}>Gasto Fijo</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput id="name" label="Nombre del Pago" type="text" placeholder="Ej: Alquiler, Netflix, Préstamo Coche" value={formData.name} onChange={handleChange} required />

          {paymentType === 'debt' ? (
            // --- CAMPOS DE DEUDA ---
            <>
              <FormInput id="initialAmount" label="Monto Inicial ($)" type="number" placeholder="15000" value={formData.initialAmount} onChange={handleChange} required />
              <FormSelect id="classification" label="Clasificación de la Deuda" value={formData.classification} onChange={handleChange}>
                <option value="principal">Deuda Principal (Bancaria, Préstamo Mayor)</option>
                <option value="commercial">Financiación Comercial (Compras a Plazos)</option>
              </FormSelect>
              <FormSelect id="liabilityType" label="Tipo de Pasivo" value={formData.liabilityType} onChange={handleChange}>
                <option value="simple">Deuda Simple (Sin pagos fijos)</option>
                <option value="revolving">Crédito Revolving (Tarjeta de Crédito)</option>
                <option value="loan">Préstamo a Plazos (Cuotas Fijas)</option>
              </FormSelect>
              {formData.liabilityType === 'revolving' && <FormInput id="minimumPayment" label="Pago Mínimo Mensual ($)" type="number" value={formData.minimumPayment} onChange={handleChange} required />}
              {(formData.liabilityType === 'revolving' || formData.liabilityType === 'loan') && (
                <>
                  <FormInput id="paymentDay" label="Día de Pago (1-31)" type="number" min="1" max="31" value={formData.paymentDay} onChange={handleChange} required />
                  <FormInput id="firstPaymentDate" label="Fecha de Inicio del Primer Pago" type="date" value={formData.firstPaymentDate} onChange={handleChange} required />
                </>
              )}
              {formData.liabilityType === 'loan' && (
                <>
                  <FormInput id="installmentAmount" label="Monto de la Cuota ($)" type="number" value={formData.installmentAmount} onChange={handleChange} required />
                  <FormInput id="totalInstallments" label="Número Total de Cuotas" type="number" value={formData.totalInstallments} onChange={handleChange} required />
                </>
              )}
            </>
          ) : (
            // --- CAMPOS DE GASTO FIJO ---
            <>
              <FormInput id="amount" label="Monto del Pago (€)" type="number" placeholder="750" value={formData.amount} onChange={handleChange} required />
              <FormSelect id="categoryId" label="Categoría del Gasto" value={formData.categoryId} onChange={handleChange} required>
                {expenseCategories.length > 0 ? (
                    expenseCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                ) : (
                    <option value="" disabled>No hay categorías de gastos</option>
                )}
              </FormSelect>
              <FormInput id="paymentDay" label="Día de Pago (1-31)" type="number" min="1" max="31" value={formData.paymentDay} onChange={handleChange} required />
              <FormInput id="firstPaymentDate" label="Fecha de Inicio del Pago" type="date" value={formData.firstPaymentDate} onChange={handleChange} required />
              <FormInput id="endDate" label="Fecha de Fin (Opcional)" type="date" value={formData.endDate} onChange={handleChange} />
              <FormSelect id="paymentMethod" label="Tipo de Pago" value={formData.paymentMethod} onChange={handleChange}>
                <option value="fijo">Fijo (Se repite indefinidamente)</option>
                <option value="cuotas">Cuotas (Número limitado de pagos)</option>
              </FormSelect>
              {formData.paymentMethod === 'cuotas' && <FormInput id="totalInstallments" label="Número Total de Cuotas" type="number" value={formData.totalInstallments} onChange={handleChange} required />}
            </>
          )}

          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-neutral-200 text-neutral-800 font-bold py-2 px-4 rounded-lg hover:bg-neutral-300 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-light transition-colors shadow-sm">
              {isEditMode ? 'Guardar Cambios' : 'Guardar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringPaymentModal;
