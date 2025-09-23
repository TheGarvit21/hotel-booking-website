import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, getCurrentUserSync, logout } from '../utils/auth';
import { getCurrencyPref, prefetchLatestRates, setCurrencyPref } from '../utils/currency';
import CustomDropdown from './CustomDropdown';
import NotificationBell from './NotificationBell';
import { useToast } from './useToast';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currency, setCurrency] = useState(getCurrencyPref());
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    // Immediate sync read for first paint
    setUser(getCurrentUserSync());
    // Hydrate from async source
    (async () => {
      const u = await getCurrentUser();
      if (!mounted) return;
      setUser(u);
    })();

    // Listen for global auth changes
    const onAuthChange = (e) => {
      setUser(e?.detail?.user || null);
    };
    window.addEventListener('auth:change', onAuthChange);
    return () => {
      mounted = false;
      window.removeEventListener('auth:change', onAuthChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    toast.success('Logged out');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand" onClick={() => setIsMenuOpen(false)}>
            LuxStay
          </Link>

          <div
            className={`hamburger ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          <ul className={`navbar-nav ${isMenuOpen ? 'active' : ''}`}>
            <li>
              <Link
                to="/"
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/hotels"
                className={`nav-link ${location.pathname === '/hotels' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Hotels
              </Link>
            </li>
            {user && (
              <>
                <li>
                  <Link
                    to="/profile"
                    className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    to="/bookings"
                    className={`nav-link ${location.pathname === '/bookings' ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Bookings
                  </Link>
                </li>
                <li>
                  <Link
                    to="/notifications"
                    className={`nav-link ${location.pathname === '/notifications' ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Notifications
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link
                to="/support"
                className={`nav-link ${location.pathname === '/support' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Support
              </Link>
            </li>
            <li>
              <div className={`nav-currency-select ${isCurrencyOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="trigger"
                  aria-label="Select currency"
                  aria-haspopup="listbox"
                  aria-expanded={isCurrencyOpen}
                  onClick={() => setIsCurrencyOpen((o) => !o)}
                >
                  {currency.code} {currency.symbol}
                  <span className="chevron" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                <CustomDropdown
                  isOpen={isCurrencyOpen}
                  onClose={() => setIsCurrencyOpen(false)}
                  value={currency.code}
                  onChange={async (code) => {
                    const pref = setCurrencyPref(code);
                    setCurrency(pref);
                    setIsCurrencyOpen(false);
                    // Notify immediately so UI responds fast
                    window.dispatchEvent(new CustomEvent('currency:change', { detail: pref }));
                    // Then fetch freshest rates and notify again for exact values
                    await prefetchLatestRates();
                    window.dispatchEvent(new CustomEvent('currency:change', { detail: pref }));
                  }}
                  options={[
                    { value: 'INR', label: 'INR ₹' },
                    { value: 'USD', label: 'USD $' },
                    { value: 'EUR', label: 'EUR €' },
                    { value: 'GBP', label: 'GBP £' },
                  ]}
                />
              </div>
            </li>
            <li>
              {user ? (
                <div className="nav-user">
                  <NotificationBell />
                  <button
                    onClick={handleLogout}
                    className="btn btn-logout"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className={`nav-link ${location.pathname === '/auth' ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login/SignUp
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;