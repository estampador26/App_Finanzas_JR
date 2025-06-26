import React from 'react';
import Header from '../components/Header';
import { requestNotificationPermission } from '../utils/firebaseMessaging';

const SettingsPage = () => {

  const handleEnableNotifications = async () => {
    console.log('Requesting notification permission...');
    const token = await requestNotificationPermission();
    if (token) {
      alert('¡Notificaciones activadas! Recibirás recordatorios de tus pagos.');
    } else {
      alert('No se pudo activar las notificaciones. Asegúrate de conceder los permisos en el navegador.');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <Header title="Ajustes" subtitle="Gestiona tus preferencias y notificaciones." />
      
      <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800">Notificaciones Push</h3>
        <p className="text-gray-500 mt-2 text-sm">
          Activa las notificaciones para recibir recordatorios automáticos de tus pagos recurrentes un día antes de su vencimiento. 
          Necesitarás aceptar el permiso que te solicitará el navegador.
        </p>
        <div className="mt-4">
          <button 
            onClick={handleEnableNotifications}
            className="btn btn-primary"
          >
            Activar Notificaciones
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
