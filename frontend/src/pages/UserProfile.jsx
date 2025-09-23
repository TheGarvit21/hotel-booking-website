import { motion as Motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUsers, setCurrentUser } from '../utils/auth';

// Constants
const PASSWORD_MIN_LENGTH = 6;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const SUCCESS_MESSAGE_TIMEOUT = 3000;

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 80 },
    },
};

const UserProfile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Load user data
    useEffect(() => {
        document.title = 'My Profile | LuxStay';
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', 'Manage your profile settings.');

        const loadUserData = async () => {
            setLoading(true);
            try {
                const currentUser = await getCurrentUser();
                if (!currentUser) {
                    navigate('/auth');
                    return;
                }
                setUser(currentUser);
                setForm({
                    name: currentUser.name || '',
                    email: currentUser.email || '',
                    password: '',
                });
            } catch (err) {
                console.error('Failed to load profile:', err);
                setError('Could not load your profile. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [navigate]);

    // Validate form inputs
    const validateForm = ({ name, email, password }) => {
        if (!name.trim()) return 'Name is required.';
        if (!email.trim()) return 'Email is required.';
        if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address.';
        if (password && password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
        return null;
    };

    // Calculate password strength
    const calculatePasswordStrength = (password) => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    // Get password strength info
    const getPasswordStrengthInfo = () => {
        if (!form.password) return { label: '', color: '' };
        switch (passwordStrength) {
            case 0: return { label: 'Weak', color: 'var(--error-color)' };
            case 1: return { label: 'Fair', color: '#FFB344' };
            case 2: return { label: 'Good', color: '#FFB344' };
            case 3: return { label: 'Strong', color: '#06D6A0' };
            case 4: return { label: 'Very Strong', color: '#06D6A0' };
            default: return { label: '', color: '' };
        }
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (name === 'password') {
            setPasswordStrength(calculatePasswordStrength(value));
        }
        setError('');
        setSuccess('');
    };

    // Handle save profile
    const handleSave = async (e) => {
        e.preventDefault();
        if (!editMode) return;

        const validationError = validateForm(form);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const email = form.email.trim().toLowerCase();
            const users = getUsers();
            const emailTaken = users.some((u) => u.email.toLowerCase() === email && u.id !== user.id);
            if (emailTaken) {
                setError('This email is already used by another account.');
                return;
            }

            const updatedUser = {
                ...user,
                name: form.name.trim(),
                email,
                ...(form.password ? { password: form.password } : {}),
            };

            const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            // TODO: Update via API when backend is ready
            // await fetch(`/api/users/${user.id}`, {
            //   method: 'PUT',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(updatedUser),
            // });

            setCurrentUser(updatedUser, true);
            setUser(updatedUser);
            setForm((prev) => ({ ...prev, password: '' }));
            setPasswordStrength(0);
            setEditMode(false);
            setSuccess('Profile updated!');
            setTimeout(() => setSuccess(''), SUCCESS_MESSAGE_TIMEOUT);
        } catch (err) {
            console.error('Profile update failed:', err);
            setError('Could not update profile. Please try again.');
        }
    };

    // Toggle edit mode
    const handleEdit = () => {
        setEditMode(true);
        setError('');
        setSuccess('');
    };

    // Cancel edit mode
    const handleCancel = () => {
        setEditMode(false);
        setForm({
            name: user?.name || '',
            email: user?.email || '',
            password: '',
        });
        setPasswordStrength(0);
        setError('');
        setSuccess('');
    };

    if (loading) {
        return (
            <div className="container flex-center" style={{ minHeight: '70vh' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <>
            <Motion.div
                className="container"
                style={{ maxWidth: 700, margin: '0 auto', padding: '60px 0' }}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <Motion.div
                    className="card"
                    style={{ marginBottom: '32px' }}
                    variants={itemVariants}
                >
                    <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '16px', fontFamily: 'Playfair Display, serif' }}>
                        My Profile
                    </h1>
                    {success && (
                        <div
                            role="alert"
                            style={{
                                background: 'rgba(6,214,160,0.12)',
                                color: 'var(--success-color)',
                                borderRadius: '12px',
                                padding: '12px',
                                marginBottom: '16px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            {success}
                        </div>
                    )}
                    {error && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            style={{
                                background: 'rgba(245,101,101,0.12)',
                                color: 'var(--error-color)',
                                borderRadius: '12px',
                                padding: '12px',
                                marginBottom: '16px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                value={form.name}
                                onChange={handleChange}
                                disabled={!editMode}
                                style={editMode ? { borderColor: 'var(--primary-color)' } : {}}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={form.email}
                                onChange={handleChange}
                                disabled={!editMode}
                                style={editMode ? { borderColor: 'var(--primary-color)' } : {}}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                value={form.password}
                                onChange={handleChange}
                                disabled={!editMode}
                                placeholder={editMode ? `Enter new password (min ${PASSWORD_MIN_LENGTH} chars)` : '••••••••'}
                                style={editMode ? { borderColor: 'var(--primary-color)' } : {}}
                            />
                        </div>
                        {editMode && (
                            <div className="flex-between mt-4">
                                <button type="submit" className="btn btn-primary">Save</button>
                                <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
                            </div>
                        )}
                    </form>
                    {!editMode && (
                        <div className="flex-between mt-4" style={{ gap: 12 }}>
                            <button
                                type="button"
                                className="btn btn-accent"
                                onClick={handleEdit}
                                aria-label="Edit your profile information"
                            >
                                Edit Profile
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/bookings')}
                                aria-label="View your bookings"
                            >
                                My Bookings
                            </button>
                        </div>
                    )}
                    {editMode && form.password && (
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Password strength:</span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: getPasswordStrengthInfo().color }}>
                                    {getPasswordStrengthInfo().label}
                                </span>
                            </div>
                            <div style={{
                                height: '6px',
                                width: '100%',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '3px',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${passwordStrength * 25}%`,
                                    backgroundColor: getPasswordStrengthInfo().color,
                                    transition: 'width 0.3s ease',
                                }} />
                            </div>
                        </div>
                    )}
                    <div className="mt-8" style={{ color: 'var(--text-gray)', fontSize: '15px' }}>
                        <strong>Member since:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                </Motion.div>
            </Motion.div>
        </>
    );
};

export default UserProfile;