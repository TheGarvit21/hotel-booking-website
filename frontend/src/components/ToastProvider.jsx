import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from './ToastContext';

let idSeq = 1;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());

    const remove = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        const tm = timers.current.get(id);
        if (tm) {
            clearTimeout(tm);
            timers.current.delete(id);
        }
    }, []);

    const show = useCallback((message, type = 'info', opts = {}) => {
        const id = idSeq++;
        const duration = typeof opts.duration === 'number' ? opts.duration : 3000;
        setToasts((prev) => [...prev, { id, message, type }]);
        const tm = setTimeout(() => remove(id), duration);
        timers.current.set(id, tm);
        return id;
    }, [remove]);

    const api = useMemo(() => ({
        show,
        success: (msg, opts) => show(msg, 'success', opts),
        warn: (msg, opts) => show(msg, 'warn', opts),
        error: (msg, opts) => show(msg, 'error', opts),
    }), [show]);

    useEffect(() => () => {
        timers.current.forEach((tm) => clearTimeout(tm));
        timers.current.clear();
    }, []);

    return (
        <ToastContext.Provider value={api}>
            {children}
            {/* Viewport */}
            <div className="toast-viewport" role="status" aria-live="polite" aria-atomic="true">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast ${t.type}`} onClick={() => remove(t.id)}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
