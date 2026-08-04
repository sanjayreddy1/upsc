import { useEffect } from 'react';

export function useNotification() {
  useEffect(() => {
    // Request permission on mount if not already granted or denied
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = (title, options = {}) => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/vite.svg', // Assuming standard vite icon is available, or use a custom one
        ...options,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, {
            icon: '/vite.svg',
            ...options,
          });
        }
      });
    }
  };

  return { sendNotification };
}
