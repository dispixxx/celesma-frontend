import { useEffect, useState } from 'react';

interface AlertProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  autoClose?: number;
}

export default function Alert({ message, type, onClose, autoClose = 4000 }: AlertProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, autoClose);
    return () => clearTimeout(timer);
  }, [autoClose, onClose]);

  const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

  return (
    <div className={`global-alert ${type}`}>
      <div className="global-alert-content">
        <span className="material-icons">{icon}</span>
        <span>{message}</span>
      </div>
      <button className="close-alert" onClick={onClose}>×</button>
    </div>
  );
}

export function useAlert() {
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'success') => setAlert({ message, type });
  const hideAlert = () => setAlert(null);
  return { alert, showAlert, hideAlert };
}
