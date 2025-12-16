
import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 animate-bounce-in ${
      type === 'success' ? 'bg-white border-green-500 text-green-800' : 'bg-white border-red-500 text-red-800'
    }`}>
      {type === 'success' ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
      <span className="font-bold text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
