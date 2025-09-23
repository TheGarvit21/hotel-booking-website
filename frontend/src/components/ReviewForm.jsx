import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getCurrentUserSync } from '../utils/auth.js';
import CustomCalendar from './CustomCalendar.jsx';

const ReviewForm = ({ hotelId, hotelName, onReviewSubmit, onClose, isOpen }) => {
    const [formData, setFormData] = useState({
        rating: 0,
        comment: '',
        stayDate: ''
    });
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [showStayDateCalendar, setShowStayDateCalendar] = useState(false);

    useEffect(() => {
        const user = getCurrentUserSync();
        setCurrentUser(user);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleRatingClick = (rating) => {
        setFormData(prev => ({
            ...prev,
            rating
        }));
        if (errors.rating) {
            setErrors(prev => ({
                ...prev,
                rating: ''
            }));
        }
    };

    const handleStayDateSelect = (date) => {
        setFormData(prev => ({
            ...prev,
            stayDate: date
        }));
        if (errors.stayDate) {
            setErrors(prev => ({
                ...prev,
                stayDate: ''
            }));
        }
        setShowStayDateCalendar(false);
    };

    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'Select stay date';
        try {
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return 'Select stay date';
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!currentUser) {
            newErrors.auth = 'You must be logged in to post a review';
        }

        if (formData.rating === 0) {
            newErrors.rating = 'Please select a rating';
        }

        if (!formData.comment.trim()) {
            newErrors.comment = 'Review comment is required';
        } else if (formData.comment.trim().length < 10) {
            newErrors.comment = 'Review must be at least 10 characters long';
        } else if (formData.comment.trim().length > 500) {
            newErrors.comment = 'Review must be less than 500 characters';
        }

        if (!formData.stayDate) {
            newErrors.stayDate = 'Stay date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const reviewData = {
                ...formData,
                hotelId,
                hotelName,
                userName: currentUser?.name || currentUser?.email?.split('@')[0] || 'Anonymous User'
            };

            await onReviewSubmit(reviewData);

            // Reset form
            setFormData({
                rating: 0,
                comment: '',
                stayDate: ''
            });
            setHoverRating(0);
            setErrors({});

            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
            setErrors({ submit: 'Failed to submit review. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.9,
            y: 50
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 300
            }
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            y: 50
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <Motion.div
                className="review-form-overlay"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}
            >
                <Motion.div
                    className="review-form-modal card"
                    variants={modalVariants}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--border-radius)',
                        padding: '40px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-heavy)',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}
                >
                    <div className="flex-between mb-6">
                        <h2 style={{
                            fontFamily: 'Playfair Display, serif',
                            fontSize: '28px',
                            color: 'var(--text-light)',
                            margin: 0
                        }}>
                            Write a Review
                        </h2>
                        <button
                            onClick={onClose}
                            className="btn-close"
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                color: 'var(--text-gray)',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '50%',
                                transition: 'var(--transition)'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = 'var(--primary-color)';
                                e.target.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'none';
                                e.target.style.color = 'var(--text-gray)';
                            }}
                        >
                            ×
                        </button>
                    </div>

                    <p style={{
                        color: 'var(--text-gray)',
                        marginBottom: '32px',
                        fontSize: '16px'
                    }}>
                        Share your experience at <strong style={{ color: 'var(--primary-color)' }}>{hotelName}</strong>
                        {currentUser && (
                            <span style={{ display: 'block', marginTop: '8px', fontSize: '14px' }}>
                                Posting as: <strong>{currentUser.name || currentUser.email}</strong>
                            </span>
                        )}
                    </p>

                    {errors.auth && (
                        <div style={{
                            background: 'rgba(245, 101, 101, 0.1)',
                            border: '1px solid var(--error-color)',
                            borderRadius: 'var(--border-radius)',
                            padding: '12px',
                            marginBottom: '24px',
                            color: 'var(--error-color)',
                            fontSize: '14px'
                        }}>
                            {errors.auth}
                        </div>
                    )}

                    {errors.submit && (
                        <div style={{
                            background: 'rgba(245, 101, 101, 0.1)',
                            border: '1px solid var(--error-color)',
                            borderRadius: 'var(--border-radius)',
                            padding: '12px',
                            marginBottom: '24px',
                            color: 'var(--error-color)',
                            fontSize: '14px'
                        }}>
                            {errors.submit}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Stay Date</label>
                            <div style={{ position: 'relative' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowStayDateCalendar(true)}
                                    className={`form-input ${errors.stayDate ? 'error' : ''}`}
                                    style={{
                                        borderColor: errors.stayDate ? 'var(--error-color)' : 'var(--border-color)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        backgroundColor: 'var(--bg-card)',
                                        color: formData.stayDate ? 'var(--text-light)' : 'var(--text-gray)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px'
                                    }}
                                >
                                    <span>{formatDisplayDate(formData.stayDate)}</span>
                                    <span style={{
                                        color: 'var(--text-gray)',
                                        fontSize: '18px',
                                        lineHeight: 1
                                    }}>📅</span>
                                </button>

                                <CustomCalendar
                                    isOpen={showStayDateCalendar}
                                    onClose={() => setShowStayDateCalendar(false)}
                                    onDateSelect={handleStayDateSelect}
                                    selectedDate={formData.stayDate}
                                    maxDate={new Date().toISOString().split('T')[0]} // Can't select future dates for past stays
                                />
                            </div>
                            {errors.stayDate && (
                                <span style={{
                                    color: 'var(--error-color)',
                                    fontSize: '14px',
                                    marginTop: '4px',
                                    display: 'block'
                                }}>
                                    {errors.stayDate}
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Rating</label>
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                marginBottom: '8px',
                                alignItems: 'center'
                            }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Motion.button
                                        key={star}
                                        type="button"
                                        onClick={() => handleRatingClick(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '32px',
                                            cursor: 'pointer',
                                            color: star <= (hoverRating || formData.rating)
                                                ? 'var(--secondary-color)'
                                                : 'var(--border-color)',
                                            textShadow: star <= (hoverRating || formData.rating)
                                                ? '0 2px 4px rgba(0,0,0,0.3)'
                                                : 'none',
                                            transition: 'var(--transition)',
                                            padding: '4px'
                                        }}
                                    >
                                        ★
                                    </Motion.button>
                                ))}
                                <span style={{
                                    marginLeft: '12px',
                                    color: 'var(--text-gray)',
                                    fontSize: '14px'
                                }}>
                                    {formData.rating > 0 && (
                                        formData.rating === 5 ? 'Excellent' :
                                            formData.rating === 4 ? 'Very Good' :
                                                formData.rating === 3 ? 'Good' :
                                                    formData.rating === 2 ? 'Fair' : 'Poor'
                                    )}
                                </span>
                            </div>
                            {errors.rating && (
                                <span style={{
                                    color: 'var(--error-color)',
                                    fontSize: '14px'
                                }}>
                                    {errors.rating}
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Your Review</label>
                            <textarea
                                name="comment"
                                value={formData.comment}
                                onChange={handleInputChange}
                                className={`form-input ${errors.comment ? 'error' : ''}`}
                                placeholder="Share your experience with this hotel..."
                                rows="5"
                                style={{
                                    borderColor: errors.comment ? 'var(--error-color)' : 'var(--border-color)',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '4px'
                            }}>
                                {errors.comment && (
                                    <span style={{
                                        color: 'var(--error-color)',
                                        fontSize: '14px'
                                    }}>
                                        {errors.comment}
                                    </span>
                                )}
                                <span style={{
                                    color: 'var(--text-gray)',
                                    fontSize: '12px',
                                    marginLeft: 'auto'
                                }}>
                                    {formData.comment.length}/500
                                </span>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            justifyContent: 'flex-end',
                            marginTop: '32px'
                        }}>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn"
                                style={{
                                    background: 'transparent',
                                    border: '2px solid var(--border-color)',
                                    color: 'var(--text-light)'
                                }}
                            >
                                Cancel
                            </button>
                            <Motion.button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    opacity: isSubmitting ? 0.7 : 1,
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            </Motion.button>
                        </div>
                    </form>
                </Motion.div>
            </Motion.div>
        </AnimatePresence>
    );
};

export default ReviewForm;
