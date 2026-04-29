// Firebase Messaging Service Worker for push notifications
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
const firebaseConfig = {
  apiKey: "AIzaSyCMsLlBQZ5PWbmxYaWsVyXiVK9h_A_GJUE",
  authDomain: "campuslab-913a6.firebaseapp.com",
  projectId: "campuslab-913a6",
  storageBucket: "campuslab-913a6.appspot.com",
  messagingSenderId: "1095754046491",
  appId: "1:1095754046491:web:e1234567890abcdef1234567"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  const { notification, data } = payload;
  
  if (notification) {
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: data?.entityId || 'notification',
      data: data,
      requireInteraction: false,
      actions: [
        {
          action: 'open',
          title: 'Open'
        }
      ]
    });
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  let url = '/dashboard';
  
  if (data?.link) {
    url = data.link;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
