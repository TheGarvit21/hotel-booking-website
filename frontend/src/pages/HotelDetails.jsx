import { motion as Motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import CustomCalendar from '../components/CustomCalendar';
import CustomDropdown from '../components/CustomDropdown';
import EditReviewModal from '../components/EditReviewModal';
import ReviewForm from '../components/ReviewForm';
import { WeatherMapButton } from '../components/WeatherMap';
import { getHotelByIdWithFallback } from '../services/hotels';
import { getCurrentUserSync } from '../utils/auth';
import { addBooking, findBookingConflict } from '../utils/bookings'; // Added import
import { createBookingWithFallback } from '../services/bookings';
import { formatPriceINR, getCurrencyPref } from '../utils/currency';
import { createBookingConfirmationNotification } from '../utils/notifications';
import { calcPrice } from '../utils/pricing';
import { addReview, deleteReview, getHotelReviews, getReviewStats, getUserReview, updateReview } from '../utils/reviews';
import './HotelDetails.css';

const HotelDetails = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // <-- Add this
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info'); // success | warn | error | info

  // State for booking form
  const [checkIn, setCheckIn] = useState(location.state?.checkIn || '');
  const [checkOut, setCheckOut] = useState(location.state?.checkOut || '');
  const [guests, setGuests] = useState(location.state?.guests || 1);

  // Calendar states
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [currency, setCurrency] = useState(getCurrencyPref());

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showEditReviewModal, setShowEditReviewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hotelReviews, setHotelReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ count: 0, averageRating: 0 });
  const [userReview, setUserReview] = useState(null);

  // Formatted prices cache (for async currency formatting)
  const [formatted, setFormatted] = useState({
    nightly: '',
    base: '',
    service: '',
    taxes: '',
    catering: '',
    total: ''
  });

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        setLoading(true);
        
        // Try to get hotel by ID or name
        let found = null;
        const decodedName = decodeURIComponent(name);
        
        // First try to get by ID (could be numeric or MongoDB ObjectId)
        try {
          found = await getHotelByIdWithFallback(decodedName);
        } catch (error) {
          console.log('Failed to fetch by ID, trying by name:', error);
        }
        
        // If not found by ID, try to find by name
        if (!found) {
          try {
            // Try to get all hotels and search by name
            const { getHotelsWithFallback } = await import('../services/hotels');
            const hotels = await getHotelsWithFallback();
            found = hotels.find(h => h.name === decodedName);
          } catch (error) {
            console.log('Failed to fetch by name from backend, trying local storage:', error);
            // Final fallback to local storage
            const { getHotelsFromStorage } = await import('../data/hotels');
            const hotels = await getHotelsFromStorage();
            found = hotels.find(h => h.name === decodedName);
          }
        }
        
        // Ensure hotel.image and hotel.images[0] are always in sync for new hotels
        if (found && found.images && found.images.length === 1 && found.image !== found.images[0]) {
          found.images[0] = found.image;
        } else if (found && found.images && found.images.length === 0 && found.image) {
          found.images = [found.image];
        }
        setHotel(found || null);

        // Load reviews for this hotel
        if (found) {
          const reviews = getHotelReviews(found.id);
          const stats = getReviewStats(found.id);
          const currentUserReview = getUserReview(found.id);
          setHotelReviews(reviews);
          setReviewStats(stats);
          setUserReview(currentUserReview);
        }

        setLoading(false);
      } catch (err) {
        setError('Error loading hotel details');
        console.error('Error fetching hotel:', err);
      } finally {
        setLoading(false);
      }
    };

    if (name) {
      fetchHotel();
    } else {
      setError('No hotel ID provided');
      setLoading(false);
    }
  }, [name]);

  // Track recently viewed per user
  useEffect(() => {
    if (!hotel) return;
    const user = getCurrentUserSync();
    const uid = user?.id;
    if (!uid) return; // only track for logged-in users
    try {
      const key = `recentlyViewedHotels:${uid}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      // keep unique by hotel id, move current to front
      const filtered = Array.isArray(existing) ? existing.filter((h) => h.id !== hotel.id) : [];
      const entry = {
        id: hotel.id,
        name: hotel.name,
        location: hotel.location,
        image: hotel.image,
        price: hotel.price,
        rating: hotel.rating,
        available: hotel.available,
      };
      const next = [entry, ...filtered].slice(0, 20);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore quota/parsing issues
    }
  }, [hotel]);

  // Listen for currency changes triggered by Navbar
  useEffect(() => {
    const onCurrencyChange = (e) => setCurrency(e?.detail || getCurrencyPref());
    window.addEventListener('currency:change', onCurrencyChange);
    return () => window.removeEventListener('currency:change', onCurrencyChange);
  }, []);

  const handleBooking = async () => {
    if (!checkIn || !checkOut) {
      showToastMessage('Please select check-in and check-out dates', 'warn');
      return;
    }

    const checkInDate = new Date(checkIn + 'T00:00:00');
    const checkOutDate = new Date(checkOut + 'T00:00:00');
    if (checkOutDate <= checkInDate) {
      showToastMessage('Check-out date must be after check-in date', 'warn');
      return;
    }

    // Check if user is authenticated
    const currentUser = getCurrentUserSync();
    if (!currentUser) {
      showToastMessage('Please sign in to book the room', 'warn');
      return;
    }

    // Check for double booking (any hotel overlap)
    const conflict = findBookingConflict(currentUser.id, checkIn, checkOut);
    if (conflict) {
      showToastMessage(
        <span>
          <span style={{ color: '#FFD23F', fontWeight: 'bold', fontSize: '18px' }}>⚠️ Date Conflict</span><br />
          You already have a booking at <b>{conflict.hotelName}</b> from <b>{conflict.checkIn}</b> to <b>{conflict.checkOut}</b>.<br />
          Please choose different dates or manage it in My Bookings.
        </span>,
        'warn'
      );
      return;
    }

    const breakup = calculateTotalPrice();
    const bookingData = {
      hotelId: hotel.id || hotel._id,
      checkIn: new Date(checkIn).toISOString(),
      checkOut: new Date(checkOut).toISOString(),
      guests: {
        adults: guests === 7 ? 6 : guests,
        children: 0
      },
      rooms: 1,
      roomType: 'standard',
      specialRequests: '',
      contactInfo: {
        name: currentUser.name || currentUser.email.split('@')[0],
        email: currentUser.email,
        phone: currentUser.phone || ''
      },
      paymentMethod: 'credit_card'
    };

    // Save booking to localStorage using addBooking
    try {
      // --- FETCH LOGIC (commented) ---
      // fetch('/api/bookings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(bookingData)
      // })
      //   .then(res => res.json())
      //   .then(() => showToastMessage('Booking confirmed successfully!'))
      //   .catch(error => showToastMessage('Error saving booking. Please try again.'));
      // --- END FETCH LOGIC ---
      const response = await createBookingWithFallback(bookingData);

      if (response && response.success) {
        // Create booking confirmation notification
        createBookingConfirmationNotification(currentUser.id, {
          id: response.data._id || response.data.id,
          hotelName: hotel.name,
          hotelLocation: hotel.location,
          checkIn: checkIn,
          checkOut: checkOut,
          guests: guests === 7 ? '6+' : guests,
          nights: breakup.nights,
          totalPrice: response.data.totalPrice || breakup.grandTotal,
          currency: response.data.currency || currency.code
        });
      } else {
        throw new Error(response?.message || 'Failed to create booking');
      }

      showToastMessage('Booking confirmed successfully!', 'success');
      setCheckIn('');
      setCheckOut('');
      setGuests(1);
    } catch (error) {
      if (error.code === 'BOOKING_CONFLICT') {
        showToastMessage(
          <span>
            <span style={{ color: '#FFD23F', fontWeight: 'bold', fontSize: '18px' }}>⚠️ Already Booked!</span><br />
            You already have a booking for these dates at <b>{hotel.name}</b>.<br />
            Please choose different dates or view your bookings.
          </span>,
          'warn'
        );
      } else {
        console.error('Booking error:', error);
        showToastMessage(error.message || 'Error saving booking. Please try again.', 'error');
      }
    }
  };

  const showToastMessage = (message, type = 'info') => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Handle review submission
  const handleReviewSubmit = async (reviewData) => {
    try {
      const newReview = addReview({
        ...reviewData,
        hotelId: hotel.id
      });

      // Update local state
      const updatedReviews = getHotelReviews(hotel.id);
      const updatedStats = getReviewStats(hotel.id);
      const currentUserReview = getUserReview(hotel.id);
      setHotelReviews(updatedReviews);
      setReviewStats(updatedStats);
      setUserReview(currentUserReview);

      showToastMessage('Thank you for your review! It has been added successfully.', 'success');
      return newReview;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  };

  // Handle review edit
  const handleEditReview = async (updatedData) => {
    try {
      await updateReview(hotel.id, userReview.id, updatedData);

      // Update local state
      const updatedReviews = getHotelReviews(hotel.id);
      const updatedStats = getReviewStats(hotel.id);
      const currentUserReview = getUserReview(hotel.id);
      setHotelReviews(updatedReviews);
      setReviewStats(updatedStats);
      setUserReview(currentUserReview);

      showToastMessage('Your review has been updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating review:', error);
      showToastMessage(error.message || 'Failed to update review', 'error');
      throw error;
    }
  };

  // Handle review delete
  const handleDeleteReview = async () => {
    try {
      await deleteReview(hotel.id, userReview.id);

      // Update local state
      const updatedReviews = getHotelReviews(hotel.id);
      const updatedStats = getReviewStats(hotel.id);
      setHotelReviews(updatedReviews);
      setReviewStats(updatedStats);
      setUserReview(null);

      setShowDeleteConfirm(false);
      showToastMessage('Your review has been deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting review:', error);
      showToastMessage(error.message || 'Failed to delete review', 'error');
    }
  };

  // Calculate pricing in INR (pure). Catering fee auto-applies for 6+ guests (value 7).
  const calculateTotalPrice = () => {
    if (!checkIn || !checkOut || !hotel) return { base: 0, taxes: 0, service: 0, total: 0, cateringFee: 0, grandTotal: 0, nights: 0 };
    const breakdown = calcPrice(hotel.price, checkIn, checkOut);
    const cateringFee = guests === 7 ? breakdown.nights * 1500 : 0; // INR per night for large groups
    const grandTotal = breakdown.total + cateringFee;
    return { ...breakdown, cateringFee, grandTotal };
  };

  // Memoize breakdown to avoid duplicate calculations
  const breakdown = useMemo(() => calculateTotalPrice(), [hotel?.price, checkIn, checkOut, guests]);

  // Local INR fallback formatter
  const formatINRFallback = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  // Async format amounts into selected currency
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const nightly = await formatPriceINR(hotel?.price || 0, currency.code);
        const base = await formatPriceINR(breakdown.base || 0, currency.code);
        const service = await formatPriceINR(breakdown.service || 0, currency.code);
        const taxes = await formatPriceINR(breakdown.taxes || 0, currency.code);
        const catering = await formatPriceINR(breakdown.cateringFee || 0, currency.code);
        const total = await formatPriceINR(breakdown.grandTotal || 0, currency.code);
        if (mounted) setFormatted({ nightly, base, service, taxes, catering, total });
      } catch {
        // ignore, will use INR fallback in render
      }
    })();
    return () => { mounted = false; };
  }, [currency.code, hotel?.price, breakdown.base, breakdown.service, breakdown.taxes, breakdown.cateringFee, breakdown.grandTotal]);

  const fmt = (amt, key) => (formatted[key] || formatINRFallback(amt));

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        when: "beforeChildren",
        staggerChildren: 0.3,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (loading) {
    return (
      <div className="hotel-details-container">
        <div className="container">
          <div className="loading-spinner">Loading hotel details...</div>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="hotel-details-container">
        <div className="container">
          <div className="error-message">
            <h2>Hotel Not Found</h2>
            <p>{error || 'The requested hotel could not be found.'}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              Back to Hotels
            </button>
          </div>
        </div>
      </div>
    );
  }

  const guestOptions = [
    { value: 1, label: '1 Guest', description: 'Single occupancy', icon: '👤' },
    { value: 2, label: '2 Guests', description: 'Double occupancy', icon: '👥' },
    { value: 3, label: '3 Guests', description: 'Triple occupancy', icon: '👨‍👩‍👦' },
    { value: 4, label: '4 Guests', description: 'Family of four', icon: '👨‍👩‍👧‍👦' },
    { value: 5, label: '5 Guests', description: 'Large family', icon: '👨‍👩‍👧‍👧‍👦' },
    { value: 6, label: '6 Guests', description: 'Group booking', icon: '👥👥👥' },
    { value: 7, label: '6+ Guests', description: 'Large group booking', icon: '👥👥' }
  ];

  return (
    <Motion.div
      className="hotel-details-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container">
        {/* Header Section */}
        <Motion.div className="hotel-header" variants={childVariants}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <h1 className="hotel-name text-gradient" style={{ margin: 0 }}>{hotel.name}</h1>
            <div style={{ marginLeft: 'auto' }}>
              <WeatherMapButton city={hotel.location || hotel.city || hotel.name} />
            </div>
          </div>
          <div className="hotel-meta flex-between">
            <div className="hotel-location">
              <span>📍</span> {hotel.location}
            </div>
            <div className={`hotel-category hotel-category--${hotel.category?.toLowerCase() || 'premium'}`}>
              {(hotel.category || 'Premium').toUpperCase()}
            </div>
          </div>
          {/* Weather Map Integration moved inline with hotel name */}
          <div className="hotel-rating flex">
            <div className="rating">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`star ${i < Math.round(hotel.rating) ? 'filled' : ''}`}>
                  ★
                </span>
              ))}
              <span className="rating-text">{hotel.rating} ({hotel.reviews} reviews)</span>
            </div>
          </div>
        </Motion.div>

        {/* Image Gallery with Swiper */}
        <Motion.div className="hotel-gallery" variants={childVariants}>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            className="hotel-swiper"
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {(hotel.images || []).map((image, index) => (
              <SwiperSlide key={index}>
                <div className="gallery-image-wrapper">
                  <img
                    src={image}
                    alt={`${hotel.name} ${index + 1}`}
                    className="gallery-image"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop';
                    }}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </Motion.div>

        {/* Main Content */}
        <Motion.div className="hotel-content grid-2 mt-8" variants={childVariants}>
          {/* Description */}
          <div className="hotel-description card">
            <h2 className="mb-4">About This Hotel</h2>
            <p>{hotel.description}</p>
          </div>

          {/* Amenities */}
          <div className="hotel-amenities card">
            <h2 className="mb-4">Amenities</h2>
            <ul className="amenities-list grid-2">
              {(hotel.amenities || []).map((amenity, index) => (
                <Motion.li
                  key={index}
                  className="amenity-item flex"
                  variants={childVariants}
                >
                  <span className="amenity-icon">✓</span>
                  <span>{amenity}</span>
                </Motion.li>
              ))}
            </ul>
          </div>
        </Motion.div>

        {/* Booking Form */}
        <Motion.div className="hotel-booking card mt-8" variants={childVariants}>
          <h2 className="mb-4">Book Your Stay</h2>
          <div className="booking-form grid-3">
            <div className="form-group">
              <label className="form-label">Check-in Date</label>
              <div className="search-input-wrapper">
                <span className="search-icon">📅</span>
                <input
                  type="text"
                  className="form-input"
                  value={checkIn}
                  placeholder="Select check-in date"
                  readOnly
                  onClick={() => setShowCheckInCalendar(true)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Check-out Date</label>
              <div className="search-input-wrapper">
                <span className="search-icon">📅</span>
                <input
                  type="text"
                  className="form-input"
                  value={checkOut}
                  placeholder="Select check-out date"
                  readOnly
                  onClick={() => setShowCheckOutCalendar(true)}
                />
              </div>
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Guests</label>
              <div className="search-input-wrapper">
                <span className="search-icon">👥</span>
                <input
                  type="text"
                  className="form-input"
                  value={guests === 7 ? '6+ Guests' : (guestOptions.find(option => option.value === guests)?.label || `${guests} Guest${guests > 1 ? 's' : ''}`)}
                  placeholder="Select guests"
                  readOnly
                  onClick={() => setShowGuestDropdown(true)}
                />
              </div>
              <CustomDropdown
                isOpen={showGuestDropdown}
                onClose={() => setShowGuestDropdown(false)}
                value={guests}
                onChange={(value) => {
                  setGuests(value);
                  setShowGuestDropdown(false);
                }}
                options={guestOptions}
                placeholder="Select number of guests"
              />
            </div>
          </div>
          <div className="booking-summary">
            <div className="flex-between mt-4">
              <div className="hotel-price">
                {fmt(hotel.price, 'nightly')}<span className="hotel-price-per">/night</span>
              </div>
              <div className={`hotel-availability ${hotel.available ? 'available' : 'unavailable'}`}>
                {hotel.available ? 'Available' : 'Not Available'}
              </div>
            </div>
            {checkIn && checkOut && (
              <div className="total-price mt-2">
                <strong>
                  Total: {fmt(breakdown.grandTotal, 'total')} for {breakdown.nights} night{breakdown.nights === 1 ? '' : 's'}
                </strong>
                <div style={{ fontSize: '14px', color: 'var(--text-gray)', marginTop: '8px' }}>
                  <div>Base: {fmt(breakdown.base, 'base')}</div>
                  <div>Service Fee: {fmt(breakdown.service, 'service')}</div>
                  <div>Taxes: {fmt(breakdown.taxes, 'taxes')}</div>
                  {guests === 7 && (
                    <div>
                      Catering (6+ guests): {fmt(breakdown.cateringFee, 'catering')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cancellation Policy Notice */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.1))',
            border: '1px solid #10b981',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '16px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#065f46',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px' }}>✅</span>
              <strong style={{ color: '#ff6b35', fontSize: '16px' }}>Free Cancellation Policy</strong>
            </div>
            <p style={{ margin: 0, lineHeight: 1.5, color: 'white', fontSize: '15px' }}>
              Enjoy peace of mind with free cancellation up to 24 hours before your check-in time.
              <br />
              <span style={{ fontWeight: '600', color: '#ffd700' }}>Note:</span> Cancellations within 24 hours of check-in are not permitted.
            </p>
          </div>

          <button
            className="btn btn-primary mt-4"
            onClick={handleBooking}
            disabled={!hotel.available || !checkIn || !checkOut || new Date(checkOut + 'T00:00:00') <= new Date(checkIn + 'T00:00:00')}
          >
            {hotel.available ? 'Book Now' : 'Not Available'}
          </button>
        </Motion.div>

        {/* Reviews Section */}
        <Motion.div className="hotel-reviews card mt-8" variants={childVariants}>
          <div className="flex-between mb-4">
            <div>
              <h2 className="mb-2">Guest Reviews</h2>
              {reviewStats.count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="rating">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`star ${i < Math.round(reviewStats.averageRating) ? 'filled' : ''}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span style={{ color: 'var(--text-gray)', fontSize: '16px' }}>
                    {reviewStats.averageRating.toFixed(1)} ({reviewStats.count} review{reviewStats.count !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(() => {
                const currentUser = getCurrentUserSync();

                if (!currentUser) {
                  return (
                    <Motion.button
                      onClick={() => {
                        showToastMessage('Please log in to write a review', 'warn');
                        navigate('/auth');
                      }}
                      className="btn btn-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ fontSize: '14px', padding: '12px 24px' }}
                    >
                      Login to Review
                    </Motion.button>
                  );
                }

                if (userReview) {
                  return (
                    <>
                      <Motion.button
                        onClick={() => setShowEditReviewModal(true)}
                        className="btn btn-secondary"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ fontSize: '14px', padding: '12px 24px' }}
                      >
                        Edit Review
                      </Motion.button>
                      <Motion.button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="btn btn-danger"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ fontSize: '14px', padding: '12px 24px' }}
                      >
                        Delete Review
                      </Motion.button>
                    </>
                  );
                }

                return (
                  <Motion.button
                    onClick={() => setShowReviewForm(true)}
                    className="btn btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ fontSize: '14px', padding: '12px 24px' }}
                  >
                    Write Review
                  </Motion.button>
                );
              })()}
            </div>
          </div>

          <div className="reviews-list">
            {hotelReviews.length > 0 ? (
              hotelReviews.map((review, index) => (
                <Motion.div
                  key={review.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="review-card"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '20px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  whileHover={{
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                    borderColor: 'var(--primary-color)'
                  }}
                >
                  {/* Review Header with Avatar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '18px',
                        border: '3px solid var(--bg-primary)'
                      }}>
                        {(review.userName || 'Anonymous User').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: 'var(--text-light)',
                          fontSize: '16px',
                          marginBottom: '2px'
                        }}>
                          {review.userName || 'Anonymous User'}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: 'var(--text-gray)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>📅</span>
                          <span>{new Date(review.date || review.stayDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rating Stars */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(255, 193, 7, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 193, 7, 0.2)'
                    }}>
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          style={{
                            color: i < review.rating ? '#ffc107' : '#e0e0e0',
                            fontSize: '16px',
                            textShadow: i < review.rating ? '0 1px 3px rgba(255, 193, 7, 0.3)' : 'none'
                          }}
                        >
                          ★
                        </span>
                      ))}
                      <span style={{
                        marginLeft: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--text-light)'
                      }}>
                        {review.rating}.0
                      </span>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div style={{
                    color: 'var(--text-gray)',
                    lineHeight: '1.7',
                    fontSize: '15px',
                    marginBottom: '12px',
                    background: 'rgba(0, 0, 0, 0.02)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    position: 'relative'
                  }}>
                    {/* Quote Icon */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '12px',
                      fontSize: '20px',
                      color: 'var(--primary-color)',
                      opacity: 0.3
                    }}>
                      "
                    </div>
                    <div style={{ paddingLeft: '20px' }}>
                      {review.comment}
                    </div>
                  </div>

                  {/* Updated At Info */}
                  {review.updatedAt && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-gray)',
                      textAlign: 'right',
                      fontStyle: 'italic',
                      opacity: 0.7
                    }}>
                      Updated on {new Date(review.updatedAt).toLocaleDateString()}
                    </div>
                  )}

                  {/* Verified Badge for Authenticated Users */}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                  }}>
                    <span>✓</span>
                    Verified
                  </div>
                </Motion.div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 40px',
                color: 'var(--text-gray)',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '2px dashed var(--border-color)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📝</div>
                <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>No reviews yet</p>
                <p style={{ fontSize: '14px', opacity: 0.7 }}>Be the first to share your experience!</p>
              </div>
            )}
          </div>
        </Motion.div>
      </div>

      {/* Custom Calendar Components */}
      <CustomCalendar
        isOpen={showCheckInCalendar}
        onClose={() => setShowCheckInCalendar(false)}
        onDateSelect={setCheckIn}
        selectedDate={checkIn}
        excludeDate={checkOut}
      />

      <CustomCalendar
        isOpen={showCheckOutCalendar}
        onClose={() => setShowCheckOutCalendar(false)}
        onDateSelect={setCheckOut}
        selectedDate={checkOut}
        minDate={checkIn}
      />

      {/* Toast Notification */}
      {showToast && (
        <Motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="toast-notification"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: ({ success: '#10b981', warn: '#f59e0b', error: '#ef4444', info: '#3b82f6' }[toastType] || '#3b82f6'),
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 1000,
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          {toastMessage}
        </Motion.div>
      )}

      {/* Review Form Modal */}
      <ReviewForm
        isOpen={showReviewForm}
        onClose={() => setShowReviewForm(false)}
        hotelId={hotel?.id}
        hotelName={hotel?.name}
        onReviewSubmit={handleReviewSubmit}
      />

      {/* Edit Review Modal */}
      <EditReviewModal
        isOpen={showEditReviewModal}
        onClose={() => setShowEditReviewModal(false)}
        onSave={handleEditReview}
        review={userReview}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
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
          onClick={() => setShowDeleteConfirm(false)}
        >
          <Motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--border-radius)',
              padding: '32px',
              maxWidth: '450px',
              width: '90%',
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
              maxHeight: '300px'
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
                Delete Review
              </h3>
              <p style={{
                color: 'var(--text-gray)',
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                Are you sure you want to delete your review? This action cannot be undone.
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <Motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDeleteConfirm(false)}
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
                Cancel
              </Motion.button>

              <Motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteReview}
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
                Delete Review
              </Motion.button>
            </div>
          </Motion.div>
        </div>
      )}
    </Motion.div>
  );
};

export default HotelDetails;