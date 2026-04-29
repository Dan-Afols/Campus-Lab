import api from "@/services/api";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCMsLlBQZ5PWbmxYaWsVyXiVK9h_A_GJUE",
  authDomain: "campuslab-913a6.firebaseapp.com",
  projectId: "campuslab-913a6",
  storageBucket: "campuslab-913a6.appspot.com",
  messagingSenderId: "1095754046491",
  appId: "1:1095754046491:web:e1234567890abcdef1234567"
};

declare global {
  var firebase: any;
}

// Initialize Firebase and get messaging
export async function initializeFirebaseMessaging() {
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if Firebase is already initialized
  if (globalThis.firebase?.app) {
    try {
      return globalThis.firebase.messaging();
    } catch (e) {
      console.log('Firebase messaging not available');
      return null;
    }
  }

  return null;
}

// Get FCM token and register with backend
export async function registerFCMToken() {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    // Load Firebase scripts if not already loaded
    if (!globalThis.firebase) {
      // Firebase will be loaded by the service worker script
      // Wait for it to be available
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (globalThis.firebase?.messaging) {
          break;
        }
      }
    }

    if (!globalThis.firebase?.messaging) {
      console.log('Firebase messaging not available');
      return null;
    }

    const messaging = globalThis.firebase.messaging();
    
    // Request notification permission if needed
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }
    }

    // Get the FCM token
    const token = await messaging.getToken({
      vapidKey: 'BOq3gPDhWx1IW8GDR0c0ZC3vD8M8F4kL0J5tR9nM2sQ3pQ8rS5tU7vW9xY1zB2cD3eF4gH5iJ6kL7mN8oP9qR'
    });

    if (!token) {
      console.log('No FCM token available');
      return null;
    }

    console.log('FCM Token:', token);

    // Register token with backend
    try {
      await api.post('/notifications/devices/register', {
        token,
        platform: 'web'
      });
      console.log('FCM token registered with backend');
    } catch (error) {
      console.error('Failed to register FCM token:', error);
    }

    // Set up foreground message handler
    messaging.onMessage((payload: any) => {
      console.log('Foreground message received:', payload);
      if (payload.notification) {
        // Show notification
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/logo.png',
          tag: payload.data?.entityId || 'notification',
          data: payload.data
        });
      }
    });

    return token;
  } catch (error) {
    console.error('FCM registration error:', error);
    return null;
  }
}

