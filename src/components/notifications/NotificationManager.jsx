import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show browser notification
export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }
};

// Hook to manage notifications
export const useNotifications = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsEnabled(Notification.permission === 'granted');
  }, []);

  const enable = async () => {
    const granted = await requestNotificationPermission();
    setIsEnabled(granted);
    if (granted) {
      toast.success('Notifications enabled!');
    } else {
      toast.error('Notification permission denied');
    }
    return granted;
  };

  const disable = () => {
    setIsEnabled(false);
    toast.info('Notifications disabled');
  };

  return { isEnabled, enable, disable };
};

// Notification toggle component
export default function NotificationToggle() {
  const { isEnabled, enable, disable } = useNotifications();

  return (
    <Button
      onClick={isEnabled ? disable : enable}
      variant="outline"
      className="funky-button flex items-center gap-2"
    >
      {isEnabled ? (
        <>
          <Bell className="w-4 h-4" />
          Notifications On
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4" />
          Enable Notifications
        </>
      )}
    </Button>
  );
}