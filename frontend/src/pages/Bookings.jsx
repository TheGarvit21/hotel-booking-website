import { motion as Motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import { getCurrentUser } from '../utils/auth';
import { canCancelBooking, getCancellationDeadline, migrateBookingsStorage } from '../utils/bookings';
import { formatPriceINR } from '../utils/currency';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all | confirmed | cancelled | completed
  const [query, setQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  // Removed slider functionality - only grid view supported
  const navigate = useNavigate();
  const user = getCurrentUser();
  const bookingsRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setLoading(true);
    import('../services/bookings').then(({ getUserBookings }) => {
      getUserBookings().then(response => {
        if (response && response.success && Array.isArray(response.data)) {
          setBookings(response.data);
        } else {
          setBookings([]);
        }
      }).catch(() => setBookings([])).finally(() => setLoading(false));
    });
  }, [user?.id, navigate]);

  useEffect(() => {
    if (bookingsRef.current && !loading) {
      gsap.fromTo(bookingsRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, [loading]);

  const handleCancelClick = (booking) => {
    const cancellationCheck = canCancelBooking(booking);

    if (!cancellationCheck.canCancel) {
      // Show toast message with reason
      if (typeof window !== 'undefined' && window?.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: {
            type: 'error',
            message: cancellationCheck.reason
          }
        }));
      }
      return;
    }

    setSelectedBooking(booking);
    setShowConfirmModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;

    try {
      // Cancel booking via API
      const { cancelBooking, getUserBookings } = await import('../services/bookings');
      await cancelBooking(selectedBooking.id);

      // Refresh state from backend
      const response = await getUserBookings();
      if (response && response.success && Array.isArray(response.data)) {
        setBookings(response.data);
      }

      // Animate the change
      gsap.fromTo(bookingsRef.current,
        { scale: 0.98 },
        { scale: 1, duration: 0.3, ease: "power2.out" }
      );

      setShowConfirmModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      // Non-blocking feedback
      // Optionally integrate a shared toast utility; for now use console and simple fallback
      // eslint-disable-next-line no-alert
      typeof window !== 'undefined' && window?.dispatchEvent?.(new CustomEvent('toast', { detail: { type: 'error', message: 'Error cancelling booking. Please try again.' } }));
    }
  };
  const [priceMap, setPriceMap] = useState({});
  useEffect(() => {
    let mounted = true;
    const update = async () => {
      const map = {};
      for (const b of bookings) {
        const nights = getNights(b);
        map[b.id] = {
          total: await formatPriceINR(b.totalPrice || 0),
          base: await formatPriceINR(b.basePrice || 0),
          service: await formatPriceINR(b.serviceFee || 0),
          taxes: await formatPriceINR(b.taxes || 0),
          avg: await formatPriceINR((b.totalPrice || 0) / Math.max(1, nights)),
        };
      }
      if (mounted) setPriceMap(map);
    };
    update();
    const listener = () => update();
    window.addEventListener('currency:change', listener);
    return () => { mounted = false; window.removeEventListener('currency:change', listener); };
  }, [bookings]);

  const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return 'Invalid Date';
    // Accept YYYY-MM-DD or ISO format
    let date;
    try {
      date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getNights = (b) => {
    if (b?.nights && Number.isFinite(b.nights)) return b.nights;
    try {
      const ci = new Date(typeof b.checkIn === 'string' ? b.checkIn + 'T00:00:00' : b.checkIn);
      const co = new Date(typeof b.checkOut === 'string' ? b.checkOut + 'T00:00:00' : b.checkOut);
      if (isNaN(ci.getTime()) || isNaN(co.getTime())) return 1;
      const diff = Math.max(0, (co - ci) / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.round(diff));
    } catch {
      return 1;
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div style={{ padding: '40px 0', minHeight: '100vh' }}>
        <div className="container">
          <div className="flex-center" style={{ minHeight: '50vh' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid var(--border-color)',
                borderTop: '4px solid var(--primary-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p style={{ color: 'var(--text-gray)' }}>Loading your bookings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filtered = bookings.filter(b => {
    const byStatus = statusFilter === 'all' ? true : (b.status || 'confirmed') === statusFilter;
    const q = query.trim().toLowerCase();
    const byQuery = !q || `${b.hotelName} ${b.hotelLocation}`.toLowerCase().includes(q);
    return byStatus && byQuery;
  });

  // Always use grid view - slider removed

  return (
    <div style={{ padding: '12px 0', minHeight: '100vh' }}>
      <div className="container">
        <Motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5"
        >
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap', marginBottom: '50px', padding: '0 10px' }}>
            <div style={{
              flex: '1',
              textAlign: 'left',
              minWidth: '300px',
              marginBottom: '20px',
              paddingLeft: '60px' // Increased spacing from the left
            }}>
              <h1 style={{
                fontSize: '36px',
                fontFamily: 'Playfair Display, serif',
                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: '0'
              }}>
                My Bookings
              </h1>
              <p style={{ color: 'var(--text-gray)', fontSize: '15px', margin: '4px 0 0' }}>
                Manage your reservations and plans
              </p>
            </div>

            <div className="filters-container" style={{
              display: 'flex',
              gap: '15px',
              alignItems: 'center', // Center alignment for better look
              justifyContent: 'space-between', // Space between filters
              flexWrap: 'wrap',
              maxWidth: '600px',
              width: '100',
              padding: '15px', // Increased padding for better spacing
              background: 'rgba(26, 31, 58, 0.8)',
              borderRadius: '16px',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
              marginBottom: '10px'
            }}>
              {/* Status Filter */}
              <div className="filter-group" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minWidth: '160px'
              }}>
                <label className="form-label" style={{
                  marginBottom: '0',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-light)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  STATUS
                </label>
                <select
                  className="form-input"
                  style={{
                    height: '44px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    background: 'var(--bg-card)',
                    border: '2px solid var(--border-color)',
                    borderRadius: '12px',
                    color: 'var(--text-light)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Search Filter */}
              <div className="filter-group" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: '280px',
                flex: '1',
                maxWidth: '400px'
              }}>
                <label className="form-label" style={{
                  marginBottom: '0',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-light)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  SEARCH
                </label>
                <input
                  className="form-input"
                  style={{
                    height: '44px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    background: 'var(--bg-card)',
                    border: '2px solid var(--border-color)',
                    borderRadius: '12px',
                    color: 'var(--text-light)',
                    transition: 'all 0.3s ease',
                    marginBottom: '10px'
                  }}
                  placeholder="Hotel or location"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </Motion.div>

        <div ref={bookingsRef}>
          {filtered.length === 0 ? (
            <Motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center card"
              style={{
                padding: '60px 40px',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div style={{
                fontSize: '64px',
                marginBottom: '24px',
                opacity: 0.8
              }}>
                🏨
              </div>

              <h3 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: 'var(--text-light)',
                marginBottom: '12px',
                fontFamily: 'Playfair Display, serif'
              }}>
                No bookings found
              </h3>

              <p style={{
                fontSize: '16px',
                color: 'var(--text-gray)',
                marginBottom: '32px',
                lineHeight: '1.5',
                maxWidth: '400px',
                margin: '0 auto 32px'
              }}>
                {statusFilter !== 'all' ?
                  `No ${statusFilter} bookings found. Try adjusting your filters or explore our hotels.` :
                  'Ready to start your journey? Discover amazing hotels and create memorable experiences.'
                }
              </p>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => navigate('/hotels')}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Browse Hotels
                </button>

                {statusFilter !== 'all' && (
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="btn"
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      fontWeight: '500',
                      background: 'transparent',
                      border: '2px solid var(--border-color)',
                      color: 'var(--text-light)'
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>

            </Motion.div>
          ) : (
            <div
              className="bookings-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: filtered.length === 1
                  ? '1fr'
                  : 'repeat(2, 1fr)', // Always max 2 columns, even for 3+ bookings
                gap: '32px',
                maxWidth: filtered.length === 1 ? '600px' : '1200px', // Smaller max width for single booking
                margin: '0 auto',
                width: '100%'
              }}
            >
              {filtered.map((booking, index) => (
                <BookingCard key={booking.id} booking={booking} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedBooking(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Cancel Booking"
        message={`Are you sure you want to cancel your booking for ${selectedBooking?.hotelName}? This action cannot be undone.`}
        confirmText="Yes, Cancel"
        cancelText="Keep Booking"
      />
    </div>
  );

  // Helper component for booking card to avoid repetition
  function BookingCard({ booking, index }) {
    const cancellationInfo = canCancelBooking(booking);

    // Fallback to hotel image from hotel data if missing
    let imageSrc = booking.hotelImage;
    if (!imageSrc && booking.hotelId) {
      try {
        const hotels = JSON.parse(localStorage.getItem('hotels') || '[]');
        const hotel = hotels.find(h => h.id === booking.hotelId || h._id === booking.hotelId);
        if (hotel && hotel.images && hotel.images.length > 0) imageSrc = hotel.images[0];
      } catch { }
    }
    if (!imageSrc && booking.hotelName) {
      try {
        const hotels = JSON.parse(localStorage.getItem('hotels') || '[]');
        const hotel = hotels.find(h => h.name === booking.hotelName);
        if (hotel && hotel.images && hotel.images.length > 0) imageSrc = hotel.images[0];
      } catch { }
    }
    if (!imageSrc) imageSrc = "/placeholder.svg?height=160&width=280";
    return (
      <Motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className={`card booking-card status-${booking.status}`}
      >
        {/* Media (col 1) */}
        <div className="booking-media" style={{ position: 'relative' }}>
          <img
            src={imageSrc}
            alt={booking.hotelName}
            className="booking-image"
            onError={(e) => { e.target.src = "/placeholder.svg?height=160&width=280"; }}
          />
          <span className={`status-badge status-${booking.status}`} style={{ position: 'absolute', top: 8, left: 8 }}>
            {booking.status.toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="booking-content" style={{ display: 'grid', gap: 8 }}>
          <h3 className="booking-title">
            {booking.hotelName}
          </h3>
          <p className="booking-location">📍 {booking.hotelLocation}</p>
          <div className="booking-chips">
            <span className="chip">{getNights(booking)} night{getNights(booking) === 1 ? '' : 's'}</span>
            <span className="chip chip-accent">Avg: {priceMap[booking.id]?.avg && priceMap[booking.id]?.avg !== 'NaN' ? priceMap[booking.id]?.avg : '₹0'}/night</span>
            <span className="chip chip-primary">Total: {priceMap[booking.id]?.total && priceMap[booking.id]?.total !== 'NaN' ? priceMap[booking.id]?.total : '₹0'}</span>
          </div>

          {/* Cancellation Policy Info */}
          {booking.status === 'confirmed' && (
            <div style={{
              background: cancellationInfo.canCancel ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 101, 101, 0.1)',
              border: `1px solid ${cancellationInfo.canCancel ? '#22c55e' : '#f56565'}`,
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              color: cancellationInfo.canCancel ? '#15803d' : '#c53030',
              marginBottom: '8px'
            }}>
              {cancellationInfo.canCancel ? (
                <>
                  ✅ Can cancel until {getCancellationDeadline(booking)}
                  <br />
                  <small>({Math.floor(cancellationInfo.hoursRemaining)} hours remaining)</small>
                </>
              ) : (
                <>
                  ❌ {cancellationInfo.reason}
                  {cancellationInfo.hoursRemaining !== undefined && (
                    <><br /><small>({Math.floor(cancellationInfo.hoursRemaining)} hours to check-in)</small></>
                  )}
                </>
              )}
            </div>
          )}

          <div className="booking-details">
            <div className="booking-detail metric">
              <strong>Check-in</strong>
              <div>{formatDate(booking.checkIn)}</div>
            </div>
            <div className="booking-detail metric">
              <strong>Check-out</strong>
              <div>{formatDate(booking.checkOut)}</div>
            </div>
            <div className="booking-detail metric">
              <strong>Guests</strong>
              <div>{
                typeof booking.guests === 'object' || booking.guests == null
                  ? '1 guest'
                  : booking.guests === '6+'
                    ? '6+ guests'
                    : `${booking.guests} guest${Number(booking.guests) > 1 ? 's' : ''}`
              }</div>
            </div>
            <div className="booking-detail metric">
              <strong>Breakdown</strong>
              <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '4px' }}>
                <div>Base: {priceMap[booking.id]?.base && priceMap[booking.id]?.base !== 'NaN' ? priceMap[booking.id]?.base : '₹0'}</div>
                <div>Service: {priceMap[booking.id]?.service && priceMap[booking.id]?.service !== 'NaN' ? priceMap[booking.id]?.service : '₹0'}</div>
                <div>Taxes: {priceMap[booking.id]?.taxes && priceMap[booking.id]?.taxes !== 'NaN' ? priceMap[booking.id]?.taxes : '₹0'}</div>
              </div>
            </div>
          </div>
          <div className="booking-actions">
            <button
              onClick={() => navigate(`/hotel/${encodeURIComponent(booking.hotelName)}`)}
              className="btn btn-secondary"
            >
              View Hotel
            </button>
            {booking.status === 'confirmed' && (
              <button
                onClick={() => handleCancelClick(booking)}
                className={`btn ${cancellationInfo.canCancel ? 'btn-danger' : 'btn-disabled'}`}
                disabled={!cancellationInfo.canCancel}
                style={{
                  opacity: cancellationInfo.canCancel ? 1 : 0.5,
                  cursor: cancellationInfo.canCancel ? 'pointer' : 'not-allowed'
                }}
                title={cancellationInfo.canCancel ? 'Cancel booking' : cancellationInfo.reason}
              >
                {cancellationInfo.canCancel ? 'Cancel' : 'Cannot Cancel'}
              </button>
            )}
          </div>
        </div>
      </Motion.div>
    );
  }
};

export default Bookings;