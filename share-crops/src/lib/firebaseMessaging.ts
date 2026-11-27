// The production app registers an FCM token here. The static demo has no push
// server, so this asks for notification permission and shows a local
// notification to confirm it works.

export class PushTokenError extends Error {}

export async function requestPushToken(): Promise<string> {
  if (!('Notification' in window)) {
    throw new PushTokenError('This browser does not support notifications.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new PushTokenError('Notifications are blocked for this site. Allow them in your browser settings.');
  }
  try {
    new Notification('Share Crops', { body: 'Notifications are on for this demo.', icon: `${import.meta.env.BASE_URL}icon-192.png` });
  } catch {
    /* some mobile browsers only allow notifications from a service worker */
  }
  return 'local-demo-device';
}
