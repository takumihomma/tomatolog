export class NotificationService {
  public static isSupported(): boolean {
    return 'Notification' in window;
  }

  public static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }

  public static async sendNotification(title: string, body: string): Promise<void> {
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted.');
      return;
    }

    // Prefer Service Worker notification if registered
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) {
        reg.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
          tag: 'tomato-timer-' + Date.now()
        });
        return;
      }
    }

    // Fallback to standard Notification API
    new Notification(title, {
      body,
      icon: '/favicon.svg'
    });
  }
}
