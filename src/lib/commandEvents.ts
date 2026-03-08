import { useEffect } from 'react';

export const dispatchCommand = (action: string) => {
  window.dispatchEvent(new CustomEvent(`command:${action}`));
};

export const useCommandListener = (action: string, callback: () => void) => {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(`command:${action}`, handler);
    return () => window.removeEventListener(`command:${action}`, handler);
  }, [action, callback]);
};
