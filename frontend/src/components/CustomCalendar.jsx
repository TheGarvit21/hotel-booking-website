import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';

const CustomCalendar = ({ isOpen, onClose, onDateSelect, selectedDate, minDate, excludeDate }) => {
  // Set initial month to selectedDate if present, else today
  const getInitialMonth = () => {
    if (selectedDate) {
      const d = new Date(selectedDate + 'T00:00:00');
      if (!isNaN(d)) return d;
    }
    return new Date();
  };
  const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
  // When calendar opens or selectedDate changes, show the month of selectedDate
  useEffect(() => {
    if (isOpen) {
      if (selectedDate) {
        const d = new Date(selectedDate + 'T00:00:00');
        if (!isNaN(d)) setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      } else {
        setCurrentMonth(new Date());
      }
    }
  }, [isOpen, selectedDate]);
  // ...holidays state removed...
  const calendarRef = useRef(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (isOpen && calendarRef.current) {
      gsap.fromTo(calendarRef.current,
        { opacity: 0, scale: 0.9, y: -20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  // ...holidays effect removed...

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // ...holiday check removed...

  // Helper: Check if this calendar is for check-in or check-out
  // If minDate is set, this is a check-out calendar
  const isCheckOutCalendar = !!minDate;

  // Helper: Check if a date should be disabled
  const isDateDisabled = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check-in calendar logic
    if (!isCheckOutCalendar) {
      // Disable past dates
      if (date < today) return true;
      // If check-out is selected, disable dates after it
      if (excludeDate) {
        const checkOut = new Date(excludeDate + 'T00:00:00');
        if (date >= checkOut) return true;
      }
      // Optionally, limit max check-in to 6 months from today
      const maxCheckIn = new Date();
      maxCheckIn.setMonth(today.getMonth() + 6);
      if (date > maxCheckIn) return true;
    } else {
      // Check-out calendar logic
      if (!minDate) return true; // No check-in selected
      const min = new Date(minDate + 'T00:00:00');
      min.setDate(min.getDate() + 1); // Must be after check-in
      // Optionally, limit max check-out to 3 months after check-in
      const max = new Date(minDate + 'T00:00:00');
      max.setMonth(max.getMonth() + 3);
      if (date < min || date > max) return true;
    }
    return false;
  };

  // Helper: Check if a date is selected
  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    const selected = new Date(selectedDate + 'T00:00:00');
    return date.getFullYear() === selected.getFullYear() &&
      date.getMonth() === selected.getMonth() &&
      date.getDate() === selected.getDate();
  };

  // Helper: Check if a month has at least one selectable day
  // For navigation, allow moving to any month in the allowed range (not just if selectable days exist)
  const isMonthInRange = (monthDate) => {
    // For check-in: allow 6 months from today
    // For check-out: allow 3 months from minDate (check-in)
    if (!isCheckOutCalendar) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxCheckIn = new Date();
      maxCheckIn.setMonth(today.getMonth() + 6);
      return monthDate >= new Date(today.getFullYear(), today.getMonth(), 1) && monthDate <= new Date(maxCheckIn.getFullYear(), maxCheckIn.getMonth(), 1);
    } else {
      if (!minDate) return false;
      const min = new Date(minDate + 'T00:00:00');
      min.setDate(min.getDate() + 1);
      const max = new Date(minDate + 'T00:00:00');
      max.setMonth(max.getMonth() + 3);
      return monthDate >= new Date(min.getFullYear(), min.getMonth(), 1) && monthDate <= new Date(max.getFullYear(), max.getMonth(), 1);
    }
  };

  // Helper: Handle date click
  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!isCheckOutCalendar) {
      // If selecting check-in and current check-out is before or same, clear check-out
      if (excludeDate) {
        const checkOut = new Date(excludeDate + 'T00:00:00');
        if (date >= checkOut) {
          onDateSelect(formatted);
          // Clear check-out in parent if needed (parent logic should handle this)
        } else {
          onDateSelect(formatted);
        }
      } else {
        onDateSelect(formatted);
      }
    } else {
      onDateSelect(formatted);
    }
    onClose();
  };

  // Helper: Navigate months
  const navigateMonth = (offset) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + offset);
      return newMonth;
    });
  };

  const days = getDaysInMonth(currentMonth);

  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(currentMonth.getMonth() + 1);
  const disableNextMonth = !isMonthInRange(nextMonth);

  const prevMonth = new Date(currentMonth);
  prevMonth.setMonth(currentMonth.getMonth() - 1);
  const disablePrevMonth = !isMonthInRange(prevMonth);

  // If this is the check-out calendar and no check-in date is selected, show prompt
  if (isCheckOutCalendar && !minDate) {
    return isOpen ? (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="calendar-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              maxWidth: '300px',
              textAlign: 'center',
              fontFamily: 'Arial, sans-serif',
              position: 'relative',
              margin: 'auto'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>
              Select Check-In Date First
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#666' }}>
              Please choose a check-in date before selecting a check-out date.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                background: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    ) : null;
  }

  return isOpen ? (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="calendar-overlay"
        onClick={onClose}
      >
        <motion.div
          ref={calendarRef}
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="custom-calendar"
        >
          <div className="calendar-header">
            <button
              onClick={() => navigateMonth(-1)}
              className="calendar-nav-btn"
              disabled={disablePrevMonth}
            >
              ←
            </button>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', fontFamily: 'Playfair Display, serif' }}>
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={() => navigateMonth(1)}
              className="calendar-nav-btn"
              disabled={disableNextMonth}
            >
              →
            </button>
          </div>

          <div className="calendar-weekdays">
            {weekdays.map((day) => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-days">
            {days.map((date, index) => (
              <motion.button
                key={index}
                onClick={() => date && handleDateClick(date)}
                disabled={!date || isDateDisabled(date)}
                whileHover={date && !isDateDisabled(date) ? { scale: 1.1 } : {}}
                whileTap={date && !isDateDisabled(date) ? { scale: 0.95 } : {}}
                className={`calendar-day ${isDateSelected(date) ? 'selected' : ''}`}
                style={{ position: 'relative' }}
              >
                {date ? <span>{date.getDate()}</span> : ''}
              </motion.button>
            ))}
          </div>

          {/* ...holidays legend and error UI removed... */}

          {!isCheckOutCalendar && (
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  const today = new Date();
                  if (!isDateDisabled(today)) {
                    handleDateClick(today);
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '10px 20px', fontSize: '14px' }}
                disabled={isDateDisabled(new Date())}
              >
                Today
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  ) : null;
};

export default CustomCalendar;