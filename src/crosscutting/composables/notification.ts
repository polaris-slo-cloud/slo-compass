import { Notify } from 'quasar';

export function useNotifications() {
  function notifyInformation(message: string) {
    Notify.create({ message, type: 'info', position: 'top-right' });
  }
  function notifySuccess(message: string) {
    Notify.create({ message, type: 'positive', position: 'top-right' });
  }
  function notifyWarning(message: string) {
    Notify.create({ message, type: 'warning', position: 'top-right' });
  }
  function notifyError(message: string) {
    Notify.create({ message, type: 'negative', position: 'top-right' });
  }

  return {
    notifyInformation,
    notifySuccess,
    notifyWarning,
    notifyError,
  };
}
