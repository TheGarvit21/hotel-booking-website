import { motion as Motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../services/googleAuth';
import { registerUser, loginUser, getCurrentUser, setCurrentUser } from '../utils/auth';
import { normalizeEmail, validateConfirmPassword, validateEmail, validateName, validatePassword } from '../utils/validation';

/**
 * Authentication page component for user login and registration
 * Optimized for performance, SEO, and user experience
 * 
 * @returns {JSX.Element} The Authentication component
 */
const Auth = () => {
  // Form state management with custom hooks pattern
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Refs and navigation
  const formRef = useRef(null);
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Derived values
  const pageTitle = isLogin ? 'Sign In | LuxStay' : 'Create Account | LuxStay';
  const pageDescription = isLogin
    ? "Sign in to your LuxStay account to manage your hotel bookings, view special offers, and enjoy personalized recommendations."
    : "Create your LuxStay account to book luxury hotels, receive exclusive deals, and manage your travel preferences.";

  // Redirection and animation on component mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const u = await getCurrentUser();
      if (!mounted) return;
      setUser(u);
      if (u) {
        navigate('/');
        return;
      }
    })();

    // Animate form entrance with GSAP
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 30, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out" }
      );
    }

    // Prefetch user profile for better performance after authentication
    const prefetchUserProfile = () => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/profile';
      link.as = 'document';
      document.head.appendChild(link);
    };

    // Delay prefetch to prioritize current page loading
    const prefetchTimeout = setTimeout(prefetchUserProfile, 2000);

    return () => clearTimeout(prefetchTimeout);
  }, [navigate]);

  // SEO: set title and description without Helmet to avoid legacy lifecycles
  useEffect(() => {
    document.title = pageTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', pageDescription);
  }, [pageTitle, pageDescription]);

  /**
   * Handle input changes and clear errors for the changed field
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   */
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: '',
        // Also clear related errors
        ...(name === 'password' && { passwordWeak: '', confirmPassword: '' }),
      }));
    }
  }, [errors]);

  /**
   * Toggle password visibility
   * 
   * @param {string} field - The password field name (password or confirmPassword)
   */
  const togglePasswordVisibility = useCallback((field) => {
    if (field === 'password') {
      setShowPassword(prev => !prev);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(prev => !prev);
    }
  }, []);

  /**
   * Validate form inputs with comprehensive checks
   * 
   * @returns {boolean} True if form is valid
   */
  const validateForm = useCallback(() => {
    const newErrors = {};

    const emailErr = validateEmail(formData.email || '');
    if (emailErr) newErrors.email = emailErr;

    const { error: passErr, weak } = validatePassword(formData.password || '');
    if (passErr) newErrors.password = passErr;
    if (weak) newErrors.passwordWeak = weak;

    if (!isLogin) {
      const nameErr = validateName(formData.name || '');
      if (nameErr) newErrors.name = nameErr;

      const confirmErr = validateConfirmPassword(formData.password || '', formData.confirmPassword || '');
      if (confirmErr) newErrors.confirmPassword = confirmErr;
    }

    setErrors(newErrors);

    const blockingErrors = { ...newErrors };
    delete blockingErrors.passwordWeak;
    return Object.keys(blockingErrors).length === 0;
  }, [formData, isLogin]);

  /**
   * Handle form submission for both login and signup
   * 
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Focus first field with error for better UX
      const errorFields = Object.keys(errors).filter(key => key !== 'passwordWeak');
      if (errorFields.length > 0) {
        const firstErrorField = errorFields[0];
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        errorElement?.focus();
      }
      return;
    }

    setIsLoading(true);

    // Sanitize input data
    const sanitizedFormData = {
      ...formData,
      email: normalizeEmail(formData.email || ''),
      name: formData.name?.trim(),
    };

    try {
      if (isLogin) {
        // Handle login flow
                try {
          const result = await loginUser(sanitizedFormData.email, formData.password);

          if (result.success) {
            // Authentication succeeded - user is already set by loginUser
            // Success animation before redirect
            const pendingBooking = sessionStorage.getItem('pendingBooking');
            if (pendingBooking) {
              const bookingData = JSON.parse(pendingBooking);
              sessionStorage.removeItem('pendingBooking');
              gsap.to(formRef.current, {
                scale: 1.03,
                duration: 0.15,
                yoyo: true,
                repeat: 1,
                onComplete: () => navigate(`/hotel/${bookingData.hotelId}`, {
                  state: {
                    checkIn: bookingData.checkIn,
                    checkOut: bookingData.checkOut,
                    guests: bookingData.guests
                  }
                })
              });
            } else {
              gsap.to(formRef.current, {
                scale: 1.03,
                duration: 0.15,
                yoyo: true,
                repeat: 1,
                onComplete: () => navigate('/')
              });
            }
          } else {
            // Authentication failed
            setErrors({ general: result.error || 'Invalid email or password. Please try again.' });

            // Error feedback animation
            gsap.fromTo(
              formRef.current.querySelector('.form-group:nth-child(1)'),
              { x: -5 },
              { x: 0, duration: 0.3, ease: 'power2.out' }
            );
          }
        } catch (authError) {
          // Handle specific authentication errors (like banned user)
          setErrors({ general: authError.message });

          // Error feedback animation
          gsap.fromTo(
            formRef.current.querySelector('.form-group:nth-child(1)'),
              { x: -5 },
              { x: 0, duration: 0.3, ease: 'power2.out' }
            );
          }
      } else {
        // Handle registration flow
        try {
          // Create new user
          const result = await registerUser({
            name: sanitizedFormData.name,
            email: sanitizedFormData.email,
            password: formData.password
          });

          if (result.success) {
            // User is already set by registerUser
            // Success animation before redirect
            gsap.to(formRef.current, {
              scale: 1.03,
              duration: 0.15,
              yoyo: true,
              repeat: 1,
              onComplete: () => navigate('/')
            });
          } else {
            // Registration failed
            if (result.error && result.error.includes('already exists')) {
              setErrors({ email: 'This email is already registered' });
            } else {
              setErrors({ general: result.error || 'Registration failed. Please try again.' });
            }
          }
        } catch (error) {
          if (error.message === 'Email already exists') {
            setErrors({ email: 'This email is already registered' });
          } else {
            setErrors({ general: 'Registration failed. Please try again.' });
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrors({
        general: error.message || 'Something went wrong. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLogin, navigate, rememberMe, validateForm, errors]);

  /**
   * Toggle between login and registration forms with animation
   */
  const toggleMode = useCallback(() => {
    gsap.to(formRef.current, {
      opacity: 0,
      y: -15,
      duration: 0.25,
      onComplete: () => {
        // Reset form state
        setIsLogin(!isLogin);
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);

        // Animate form back in
        gsap.to(formRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.25
        });
      }
    });
  }, [isLogin]);

  // Early return if already authenticated
  if (user) return null;

  // Check password strength for UI feedback
  const hasMinLength = formData.password?.length >= 6;
  const hasNumber = /[0-9]/.test(formData.password || '');

  return (
    <div className="auth-container">
      {/* SEO is handled via useEffect (document.title, meta description) */}

      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="auth-card"
      >
        <div ref={formRef}>
          {/* Header with gradient text */}
          <h1 style={{
            textAlign: 'center',
            marginBottom: '24px',
            fontSize: '28px',
            fontFamily: 'Playfair Display, serif',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {isLogin ? 'Welcome Back' : 'Join LuxStay'}
          </h1>

          {/* Subtitle */}
          <p style={{
            textAlign: 'center',
            marginBottom: '20px',
            color: 'var(--text-gray)',
            fontSize: '15px',
            lineHeight: '1.5'
          }}>
            {isLogin
              ? 'Sign in to access your bookings, saved hotels, and personalized recommendations.'
              : 'Create an account to start booking luxury hotels and get access to exclusive deals.'}
          </p>

          {/* General error message */}
          {errors.general && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                textAlign: 'center',
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: 'rgba(245, 101, 101, 0.12)',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--error-color)',
                color: 'var(--error-color)',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {errors.general}
            </div>
          )}

          {/* Email login separator */}
          <div style={{
            textAlign: 'center',
            margin: '16px 0',
            color: 'var(--text-gray)',
            position: 'relative'
          }}>
            <span style={{
              background: 'var(--bg-card)',
              padding: '0 12px',
              position: 'relative',
              zIndex: 1,
              fontSize: '14px'
            }}>
              continue with email
            </span>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              background: 'var(--border-color)'
            }}></div>
          </div>

          {/* Social Login - Google (no UI layout change; uses existing spacing) */}
          <div className="social-login" style={{ marginTop: '12px', marginBottom: '12px' }}>
            <button
              type="button"
              className="google-btn"
              disabled={!googleClientId || isLoading}
              onClick={async () => {
                try {
                  const serverUser = await signInWithGoogle(googleClientId);
                  // Persist client-side copy for SPA until /current is fetched
                  setCurrentUser(serverUser);
                  navigate('/');
                } catch (e) {
                  console.warn('Google sign-in failed:', e);
                  setErrors({ general: 'Google sign-in failed. Please try again.' });
                }
              }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20" />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Auth form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Name field - only shown for registration */}
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors.name ? 'error-input' : ''}`}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <div role="alert" style={{ color: 'var(--error-color)', fontSize: '13px', marginTop: '4px' }}>
                    {errors.name}
                  </div>
                )}
              </div>
            )}

            {/* Email field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${errors.email ? 'error-input' : ''}`}
                placeholder="Enter your email address"
                autoComplete={isLogin ? "username" : "email"}
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <div id="email-error" role="alert" style={{ color: 'var(--error-color)', fontSize: '13px', marginTop: '4px' }}>
                  {errors.email}
                </div>
              )}
            </div>

            {/* Password field */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="password" className="form-label" style={{ margin: 0 }}>Password</label>
                {isLogin && (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      // Non-blocking placeholder: dispatch a global toast event (UI listens elsewhere)
                      typeof window !== 'undefined' && window?.dispatchEvent?.(
                        new CustomEvent('toast', { detail: { type: 'info', message: 'Password reset will be available soon.' } })
                      );
                    }}
                    style={{
                      fontSize: '12px',
                      color: 'var(--primary-color)',
                      textDecoration: 'none',
                      fontWeight: 600
                    }}
                  >
                    Forgot Password?
                  </a>
                )}
              </div>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input ${errors.password ? 'error-input' : ''}`}
                  placeholder={isLogin ? "Enter your password" : "Create a password (min. 6 characters)"}
                  style={{ paddingRight: '50px' }}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  aria-required="true"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => togglePasswordVisibility('password')}
                >
                  {showPassword ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M1 12S5 4 12 4C19 4 23 12 23 12S19 20 12 20C5 20 1 12 1 12Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="#FF6B35" strokeWidth="2" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 4.231 7.81663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.88" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M1 1L23 23" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <div role="alert" style={{ color: 'var(--error-color)', fontSize: '13px', marginTop: '4px' }}>
                  {errors.password}
                </div>
              )}
              {errors.passwordWeak && (
                <div style={{ color: '#FFB344', fontSize: '12px', marginTop: '4px' }}>
                  {errors.passwordWeak}
                </div>
              )}
            </div>

            {/* Confirm Password - only for registration */}
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`form-input ${errors.confirmPassword ? 'error-input' : ''}`}
                    placeholder="Confirm your password"
                    style={{ paddingRight: '50px' }}
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                  >
                    {showConfirmPassword ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M1 12S5 4 12 4C19 4 23 12 23 12S19 20 12 20C5 20 1 12 1 12Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke="#FF6B35" strokeWidth="2" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 4.231 7.81663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.88" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M1 1L23 23" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div role="alert" style={{ color: 'var(--error-color)', fontSize: '13px', marginTop: '4px' }}>
                    {errors.confirmPassword}
                  </div>
                )}
              </div>
            )}

            {/* Password requirements hint - only show during signup with non-empty password */}
            {!isLogin && formData.password && (
              <div style={{
                fontSize: '12px',
                color: 'var(--text-gray)',
                marginBottom: '16px',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px'
              }}>
                <p style={{ margin: 0, marginBottom: '4px' }}>Password requirements:</p>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ color: hasMinLength ? 'var(--success-color)' : 'inherit' }}>
                    At least 6 characters
                  </li>
                  <li style={{ color: hasNumber ? 'var(--success-color)' : 'inherit' }}>
                    Including a number is recommended
                  </li>
                </ul>
              </div>
            )}

            {/* Remember Me checkbox for login */}
            {isLogin && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                padding: '8px 12px',
                marginBottom: '12px',
                boxShadow: '0 2px 8px rgba(255,107,53,0.08)'
              }}>
                <label htmlFor="rememberMe" style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  userSelect: 'none',
                  color: 'var(--primary-color)',
                  gap: '8px'
                }}>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      display: 'none'
                    }}
                  />
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '22px',
                    height: '22px',
                    border: '2px solid var(--primary-color)',
                    borderRadius: '6px',
                    background: '#181c2e',
                    marginRight: '8px',
                    transition: 'background 0.2s, border-color 0.2s'
                  }}>
                    {rememberMe && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M7 13L10 16L17 9" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  Remember me
                </label>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px 24px',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Toggle between login and signup */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: 'var(--text-gray)', fontSize: '14px', marginBottom: '8px' }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              type="button"
              onClick={toggleMode}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                padding: '4px 8px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.target.style.textDecoration = 'none'}
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </div>
      </Motion.div>

      <style>{`
        .error-input {
          border-color: var(--error-color) !important;
          box-shadow: 0 0 0 1px var(--error-color) !important;
        }
        
        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: var(--transition);
          background: rgba(255, 107, 53, 0.08);
        }
        
        .password-toggle:hover,
        .password-toggle:focus {
          color: var(--primary-dark);
          background: rgba(255, 107, 53, 0.15);
        }
        
        .password-input-wrapper {
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default Auth;
