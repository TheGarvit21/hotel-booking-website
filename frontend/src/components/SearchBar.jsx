import { motion as Motion } from 'framer-motion';
import { gsap } from 'gsap';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomCalendar from './CustomCalendar';
import CustomDropdown from './CustomDropdown';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong in the dropdown.</div>;
    }
    return this.props.children;
  }
}

const SearchBar = ({ onSearch, initialValues = {} }) => {
  const [searchData, setSearchData] = useState({
    location: initialValues.location || '',
    checkIn: initialValues.checkIn || '',
    checkOut: initialValues.checkOut || '',
    guests: initialValues.guests || 1,
  });

  const [activeCalendar, setActiveCalendar] = useState(null);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const searchBarRef = useRef(null);
  const navigate = useNavigate();

  const guestOptions = [
    { value: 1, label: '1 Guest', description: 'Perfect for solo travelers', icon: '👤' },
    { value: 2, label: '2 Guests', description: 'Ideal for couples', icon: '👥' },
    { value: 3, label: '3 Guests', description: 'Small group or family', icon: '👨‍👩‍👦' },
    { value: 4, label: '4 Guests', description: 'Family of four', icon: '👨‍👩‍👧‍👦' },
    { value: 5, label: '5 Guests', description: 'Large family', icon: '👨‍👩‍👧‍👧‍👦' },
    { value: 6, label: '6 Guests', description: 'Group booking', icon: '👥👥👥' },
    { value: 7, label: '6+ Guests', description: 'Large group booking', icon: '👥👥' },
  ];

  useEffect(() => {
    if (searchBarRef.current) {
      gsap.fromTo(
        searchBarRef.current,
        { opacity: 0, y: 50, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateSelect = (field, date) => {
    setSearchData((prev) => ({ ...prev, [field]: date }));
    setActiveCalendar(null);
  };

  const handleGuestsChange = (value) => {
    setSearchData((prev) => ({ ...prev, guests: value }));
    setShowGuestsDropdown(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    gsap.to(e.target.querySelector('button'), {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
    });

    if (onSearch) {
      onSearch(searchData);
    } else {
      const params = new URLSearchParams(searchData);
      navigate(`/hotels?${params.toString()}`, { state: { ...searchData } }); // <-- Pass state
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSelectedGuestOption = () => {
    if (searchData.guests === 7) {
      return { label: '6+ Guests', description: 'Large group booking' };
    }
    return guestOptions.find((option) => option.value === searchData.guests) || guestOptions[0];
  };


  return (
    <>
      <Motion.form ref={searchBarRef} className="search-bar enhanced-search-bar" onSubmit={handleSearch}>
        <div className="search-field enhanced-field">
          <label>Destination</label>
          <div className={`search-input-wrapper ${focusedField === 'location' ? 'focused' : ''}`}>
            <span className="search-icon">📍</span>
            <input
              type="text"
              name="location"
              value={searchData.location}
              onChange={handleInputChange}
              onFocus={() => setFocusedField('location')}
              onBlur={() => setFocusedField(null)}
              placeholder="Select a city"
              required
              style={{
                minHeight: '56px',
                padding: '18px 20px 18px 55px',
                fontSize: '16px',
                fontWeight: 500
              }}
            />
          </div>
        </div>

        <div className="search-field enhanced-field" style={{ position: 'relative' }}>
          <label>Check-in</label>
          <div
            className={`search-input-wrapper ${focusedField === 'checkIn' ? 'focused' : ''}`}
            onClick={() => {
              setActiveCalendar('checkIn');
              setFocusedField('checkIn');
            }}
            style={{ cursor: 'pointer' }}
          >
            <span className="search-icon">📅</span>
            <div
              style={{
                minHeight: '56px',
                padding: '18px 20px 18px 55px',
                fontSize: '16px',
                color: searchData.checkIn ? 'var(--bg-dark)' : '#999',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {searchData.checkIn ? formatDate(searchData.checkIn) : 'Select date'}
            </div>
          </div>
        </div>

        <div className="search-field enhanced-field" style={{ position: 'relative' }}>
          <label>Check-out</label>
          <div
            className={`search-input-wrapper ${focusedField === 'checkOut' ? 'focused' : ''}`}
            onClick={() => {
              setActiveCalendar('checkOut');
              setFocusedField('checkOut');
            }}
            style={{ cursor: 'pointer' }}
          >
            <span className="search-icon">📅</span>
            <div
              style={{
                minHeight: '56px',
                padding: '18px 20px 18px 55px',
                fontSize: '16px',
                color: searchData.checkOut ? 'var(--bg-dark)' : '#999',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {searchData.checkOut ? formatDate(searchData.checkOut) : 'Select date'}
            </div>
          </div>
        </div>

        <div className="search-field enhanced-field" style={{ position: 'relative', overflow: 'visible' }}>
          <label>Guests</label>
          <div
            className={`search-input-wrapper ${showGuestsDropdown ? 'focused' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowGuestsDropdown(!showGuestsDropdown);
              setFocusedField('guests');
            }}
            style={{ cursor: 'pointer' }}
          >
            <span className="search-icon">👥</span>
            <div
              style={{
                minHeight: '56px',
                padding: '18px 20px 18px 55px',
                fontSize: '16px',
                color: 'var(--bg-dark)',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>{getSelectedGuestOption().label}</span>
              <span
                style={{
                  transform: showGuestsDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                  fontSize: '12px'
                }}
              >
                ▼
              </span>
            </div>
          </div>
          <ErrorBoundary>
            {showGuestsDropdown && (
              <CustomDropdown
                isOpen={showGuestsDropdown}
                onClose={() => {
                  setShowGuestsDropdown(false);
                  setFocusedField(null);
                }}
                value={searchData.guests}
                onChange={handleGuestsChange}
                options={guestOptions}
              />
            )}
          </ErrorBoundary>
        </div>

        <Motion.button
          type="submit"
          className="btn btn-primary search-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>🔍</span>
          Search Hotels
        </Motion.button>
      </Motion.form>

      <CustomCalendar
        isOpen={activeCalendar === 'checkIn'}
        onClose={() => {
          setActiveCalendar(null);
          setFocusedField(null);
        }}
        onDateSelect={(date) => handleDateSelect('checkIn', date)}
        selectedDate={searchData.checkIn}
        excludeDate={searchData.checkOut}
      />

      <CustomCalendar
        isOpen={activeCalendar === 'checkOut'}
        onClose={() => {
          setActiveCalendar(null);
          setFocusedField(null);
        }}
        onDateSelect={(date) => handleDateSelect('checkOut', date)}
        selectedDate={searchData.checkOut}
        minDate={searchData.checkIn}
      />
    </>
  );
};

export default SearchBar;