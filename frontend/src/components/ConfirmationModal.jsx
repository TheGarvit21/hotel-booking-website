import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel" }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="confirmation-overlay"
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(5px)'
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="confirmation-modal"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--border-radius)',
                        padding: '32px',
                        maxWidth: '450px',
                        width: '90%',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)'
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '16px',
                            color: '#ef4444'
                        }}>
                            ⚠️
                        </div>
                        <h3 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            color: 'var(--text-light)',
                            marginBottom: '8px',
                            fontFamily: 'Playfair Display, serif'
                        }}>
                            {title}
                        </h3>
                        <p style={{
                            color: 'var(--text-gray)',
                            fontSize: '16px',
                            lineHeight: '1.5'
                        }}>
                            {message}
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'center'
                    }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            style={{
                                padding: '12px 24px',
                                border: '2px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'transparent',
                                color: 'var(--text-light)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: '500',
                                transition: 'var(--transition)',
                                minWidth: '100px'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = 'var(--text-gray)';
                                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = 'var(--border-color)';
                                e.target.style.background = 'transparent';
                            }}
                        >
                            {cancelText}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onConfirm}
                            style={{
                                padding: '12px 24px',
                                border: 'none',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: '600',
                                transition: 'var(--transition)',
                                minWidth: '100px',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                            }}
                        >
                            {confirmText}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ConfirmationModal;
