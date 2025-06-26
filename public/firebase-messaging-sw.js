// Importa los scripts de Firebase (necesarios para el service worker)
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// --- CONFIGURACIÓN DE FIREBASE ---
// REEMPLAZA ESTOS VALORES con los de tu archivo .env.local
const firebaseConfig = {
    apiKey: "AIzaSyB8EKfQT58c7-RRwZ9hspmgFy4DdMjZg1A",
    authDomain: "finanzasjrweb.firebaseapp.com",
    projectId: "finanzasjrweb",
    storageBucket: "finanzasjrweb.firebasestorage.app",
    messagingSenderId: "389738692507",
    appId: "1:389738692507:web:5aa21ccdf9112750f6eb3e"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Obtiene una instancia del servicio de mensajería
const messaging = firebase.messaging();

// Este manejador se activa cuando la app está en segundo plano o cerrada
messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Mensaje recibido en segundo plano: ',
    payload
  );

  // Muestra la notificación al usuario
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png', // Puedes cambiar este ícono
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});