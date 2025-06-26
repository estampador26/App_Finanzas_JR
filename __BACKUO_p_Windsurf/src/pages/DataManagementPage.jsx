import React, { useState } from 'react';
import { getFirestore, collection, query, where, getDocs, writeBatch, Timestamp, doc, orderBy, limit } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { toTimestamp } from '../utils/dateUtils';

const schemas = {
  transactions: {
    id: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    amount: { type: 'number', required: true },
    date: { required: true },
    categoryId: { type: 'string', required: true },
  },
  incomes: {
    id: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    amount: { type: 'number', required: true },
    date: { required: true },
    name: { type: 'string', required: true },
  },
  categories: {
    id: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    name: { type: 'string', required: true },
    icon: { type: 'string', required: true },
    color: { type: 'string', required: true },
  },
  recurringPayments: {
    id: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    name: { type: 'string', required: true },
    type: { type: 'string', required: true }, // debt or expense
  },
};

const validateBackupData = (data, currentUserId) => {
  // 1. Check schema and user ID
  for (const collectionName in schemas) {
    if (data[collectionName]) {
      for (const doc of data[collectionName]) {
        const schema = schemas[collectionName];
        for (const key in schema) {
          if (schema[key].required && !(key in doc)) {
            throw new Error(`Fichero corrupto: El documento con ID ${doc.id || 'desconocido'} en '${collectionName}' no tiene el campo requerido: '${key}'.`);
          }
          if (key in doc && schema[key].type && typeof doc[key] !== schema[key].type) {
            throw new Error(`Fichero corrupto: El documento con ID ${doc.id || 'desconocido'} en '${collectionName}' tiene un tipo de dato incorrecto para '${key}'.`);
          }
        }
        if (doc.userId !== currentUserId) {
          throw new Error(`Conflicto de datos: El documento con ID ${doc.id} pertenece a otro usuario y no puede ser importado.`);
        }

        // Conditional validation for recurringPayments
        if (collectionName === 'recurringPayments') {
          if (doc.type === 'expense') {
            if (!('amount' in doc) || typeof doc.amount !== 'number') {
              throw new Error(`Fichero corrupto: El gasto recurrente (ID: ${doc.id}) no tiene un campo 'amount' numérico y requerido.`);
            }
          } else if (doc.type === 'debt') {
            if (!('initialAmount' in doc) || typeof doc.initialAmount !== 'number') {
              throw new Error(`Fichero corrupto: La deuda (ID: ${doc.id}) no tiene un campo 'initialAmount' numérico y requerido.`);
            }
          }
        }
      }
    }
  }

  // 2. Check for referential integrity (categories)
  const categoryIds = new Set((data.categories || []).map(c => c.id));
  const checkCategoryRef = (doc, collectionName) => {
    if (doc.categoryId && !categoryIds.has(doc.categoryId)) {
      throw new Error(`Datos inconsistentes: El documento con ID ${doc.id} en '${collectionName}' hace referencia a una categoría ('${doc.categoryId}') que no existe en el fichero de respaldo.`);
    }
  };

  (data.transactions || []).forEach(doc => checkCategoryRef(doc, 'transactions'));
  (data.recurringPayments || []).forEach(doc => {
    if (doc.type === 'expense') checkCategoryRef(doc, 'recurringPayments');
  });

  return true;
};



const DataManagementPage = () => {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  const handleExport = async () => {
    if (!user) {
      setFeedback({ message: 'Debes iniciar sesión para exportar datos.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setFeedback({ message: 'Iniciando exportación... Esto puede tardar unos segundos.', type: 'info' });

    try {
      const db = getFirestore();
      const collectionsToExport = ['transactions', 'incomes', 'recurringPayments', 'categories'];
      const backupData = {};

      for (const collectionName of collectionsToExport) {
        const q = query(collection(db, collectionName), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        // We need to handle Firestore Timestamps serialization for JSON
        backupData[collectionName] = JSON.parse(JSON.stringify(docs));
      }

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
      a.download = `backup_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedback({ message: '¡Exportación completada! Se ha descargado el fichero backup.json.', type: 'success' });

    } catch (error) {
      console.error('Error exporting data:', error);
      setFeedback({ message: `Error al exportar los datos: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target.result);

        if (typeof backupData !== 'object' || backupData === null) {
          throw new Error('El fichero de backup está vacío o no es un JSON válido.');
        }

        // Validate data integrity before proceeding
        validateBackupData(backupData, user.uid);

        const db = getFirestore();

        // Find latest date in backup by checking all relevant collections
        let latestBackupDate = null;
        const allDateEntries = [
          ...(backupData.transactions || []),
          ...(backupData.incomes || [])
        ];

        if (allDateEntries.length > 0) {
          const validTimestamps = allDateEntries
            .map(entry => toTimestamp(entry.date))
            .filter(Boolean); // Filter out nulls from failed parsing

          if (validTimestamps.length > 0) {
            const latestTimestampMillis = Math.max(...validTimestamps.map(ts => ts.toMillis()));
            latestBackupDate = new Date(latestTimestampMillis);
          }
        }

        // Find latest date in DB by checking all relevant collections
        let latestDbDate = null;
        const collectionsToSearch = ['transactions', 'incomes'];
        const datePromises = collectionsToSearch.map(col => {
          const q = query(collection(db, col), where('userId', '==', user.uid), orderBy('date', 'desc'), limit(1));
          return getDocs(q);
        });

        const snapshots = await Promise.all(datePromises);
        const latestDates = snapshots.flatMap(snapshot => {
          if (snapshot.empty) return [];
          const dateValue = snapshot.docs[0].data().date;
          const timestamp = toTimestamp(dateValue);
          return timestamp ? [timestamp.toDate()] : [];
        });

        if (latestDates.length > 0) {
          latestDbDate = new Date(Math.max(...latestDates));
        }

        const formatDate = (date) => date ? date.toLocaleString('es-ES') : 'N/A';

        const confirmationMessage = `Estás a punto de borrar TODOS tus datos actuales y reemplazarlos con los del archivo de respaldo. Esta acción es irreversible.\n\n` +
          `El respaldo contiene datos hasta el: ${formatDate(latestBackupDate)}\n` +
          `Tus datos actuales tienen movimientos hasta el: ${formatDate(latestDbDate)}\n\n` +
          `¿Estás seguro?`;

        const confirmation = window.confirm(confirmationMessage);

        if (!confirmation) {
          setFeedback({ message: 'Importación cancelada por el usuario.', type: 'info' });
          return;
        }

        setIsLoading(true);
        setFeedback({ message: 'Iniciando importación. No cierres esta ventana.', type: 'info' });

        const batch = writeBatch(db);
        const collectionsInApp = ['transactions', 'incomes', 'recurringPayments', 'categories'];

        // 1. Delete all existing data for the user from all app collections
        for (const collectionName of collectionsInApp) {
          const qDelete = query(collection(db, collectionName), where('userId', '==', user.uid));
          const snapshot = await getDocs(qDelete);
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
        }

        // 2. Add new data from backup
        for (const collectionName in backupData) {
          if (collectionsInApp.includes(collectionName)) {
            const collectionData = backupData[collectionName];
            for (const docData of collectionData) {
              const dataToSet = { ...docData };
              const docRef = doc(db, collectionName, dataToSet.id);
              
              if (dataToSet.date) {
                dataToSet.date = toTimestamp(dataToSet.date);
              }
              if (dataToSet.nextPaymentDate) {
                dataToSet.nextPaymentDate = toTimestamp(dataToSet.nextPaymentDate);
              }

              batch.set(docRef, dataToSet);
            }
          }
        }

        await batch.commit();

        setFeedback({ message: '¡Importación completada con éxito! Los datos han sido restaurados.', type: 'success' });

      } catch (error) {
        console.error('Error importing data:', error);
        setFeedback({ message: `Error al importar los datos: ${error.message}`, type: 'error' });
      } finally {
        setIsLoading(false);
        event.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-800 mb-4">Gestión de Datos</h1>
        <p className="text-neutral-600 mb-8">Exporta tus datos a un fichero de respaldo o importa desde un fichero para restaurar tu información.</p>

        {feedback.message && (
          <div className={`p-4 mb-6 rounded-md text-sm ${
            feedback.type === 'error' ? 'bg-red-100 text-red-800' :
            feedback.type === 'success' ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {feedback.message}
          </div>
        )}

        <div className="space-y-6">
          {/* Export Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-neutral-700 mb-3">Exportar Datos</h2>
            <p className="text-neutral-500 mb-4">Crea un fichero de respaldo (`backup.json`) con todas tus transacciones, ingresos, pagos recurrentes y categorías.</p>
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary-light transition-colors disabled:bg-neutral-300"
            >
              {isLoading ? 'Exportando...' : 'Exportar mi información'}
            </button>
          </div>

          {/* Import Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-neutral-700 mb-3">Importar Datos</h2>
            <p className="text-neutral-500 mb-4">Selecciona un fichero `backup.json` para restaurar tus datos. <strong className="text-red-500">Atención:</strong> Esto reemplazará todos los datos existentes.</p>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isLoading}
              className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagementPage;
