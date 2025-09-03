import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'error' | 'success';
  onDone: () => void;
}

export default function Toast({ message, type = 'info', onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  const colors = {
    info: 'bg-sky-600',
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
  }[type];

  return (
    <div className={`fixed top-4 right-4 px-4 py-2 text-white rounded shadow-md ${colors}`}> 
      {message}
    </div>
  );
}
