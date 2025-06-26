import { getToken } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { messaging, db, auth } from '../firebase';

// TODO: Replace with your VAPID key from Firebase project settings
const VAPID_KEY = 'BI6-9nTmw9tkc9FClVjkOcTgK9_ZY17R07Q89h70PYBFeSZekbgYbYN6zSIU3PpF6nhxTS8bPmJkJ8Gwg7oVArI';

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return null;
  }

  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    console.log('Notification permission granted.');
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // Save the token to Firestore for the current user
        const user = auth.currentUser;
        if (user) {
          const tokenRef = doc(db, 'fcmTokens', currentToken);
          await setDoc(tokenRef, { 
            userId: user.uid, 
            createdAt: serverTimestamp(),
            lastUsed: serverTimestamp()
          });
          console.log('FCM token saved to Firestore.');
        }
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
      return null;
    }
  } else {
    console.log('Unable to get permission to notify.');
    return null;
  }
};
