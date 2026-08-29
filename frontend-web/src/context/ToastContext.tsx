import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((msg: string, title?: string) => addToast(msg, 'success', title), [addToast]);
  const error = useCallback((msg: string, title?: string) => addToast(msg, 'error', title), [addToast]);
  const info = useCallback((msg: string, title?: string) => addToast(msg, 'info', title), [addToast]);
  const warning = useCallback((msg: string, title?: string) => addToast(msg, 'warning', title), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      
      {/* Toast Overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const icons = {
              success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
              error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />,
              warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
              info: <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            };

            const styles = {
              success: 'bg-white border-emerald-100 text-slate-800 shadow-emerald-500/10',
              error: 'bg-white border-red-100 text-slate-800 shadow-red-500/10',
              warning: 'bg-white border-amber-100 text-slate-800 shadow-amber-500/10',
              info: 'bg-white border-sky-100 text-slate-800 shadow-sky-500/10'
            };

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start space-x-3 backdrop-blur-md ${styles[t.type]}`}
              >
                {icons[t.type]}
                <div className="flex-1 min-w-0 pr-2">
                  {t.title && <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-0.5">{t.title}</h5>}
                  <p className="text-sm font-medium leading-snug">{t.message}</p>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
