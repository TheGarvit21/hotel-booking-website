export const getBookings = (userId = null) => {
  try {
    // --- FETCH LOGIC (commented) ---
    // let bookings = [];
    // if (userId) {
    //   const res = await fetch(`/api/bookings?userId=${userId}`);
    //   bookings = await res.json();
    // } else {
    //   const res = await fetch('/api/bookings');
    //   bookings = await res.json();
    // }
    // return bookings;
    // --- END FETCH LOGIC ---
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    if (userId) {
      return bookings.filter(booking => booking.userId === userId);
    }

    return bookings;
  } catch (error) {
    console.error('Error getting bookings:', error);
    return [];
  }
};

export const hasBookingConflict = (userId, hotelId, checkIn, checkOut) => {
  // --- FETCH LOGIC (commented) ---
  // const res = await fetch(`/api/bookings?userId=${userId}&hotelId=${hotelId}`);
  // const bookings = await res.json();
  // --- END FETCH LOGIC ---
  const bookings = getBookings(userId);
  const newCheckIn = new Date(checkIn + 'T00:00:00');
  const newCheckOut = new Date(checkOut + 'T00:00:00');
  return bookings.some(b =>
    b.hotelId === hotelId &&
    b.status === 'confirmed' &&
    (
      new Date(b.checkIn + 'T00:00:00') < newCheckOut &&
      new Date(b.checkOut + 'T00:00:00') > newCheckIn
    )
  );
};

/**
 * Check if user has any overlapping confirmed booking across ALL hotels.
 * Returns true if any overlap is found.
 */
export const hasAnyBookingConflict = (userId, checkIn, checkOut) => {
  const bookings = getBookings(userId);
  const newCheckIn = new Date(checkIn + 'T00:00:00');
  const newCheckOut = new Date(checkOut + 'T00:00:00');
  return bookings.some(b =>
    b.status === 'confirmed' &&
    new Date(b.checkIn + 'T00:00:00') < newCheckOut &&
    new Date(b.checkOut + 'T00:00:00') > newCheckIn
  );
};

/**
 * Return the first conflicting booking (if any) for a user across all hotels.
 * Useful for messaging.
 */
export const findBookingConflict = (userId, checkIn, checkOut) => {
  const bookings = getBookings(userId);
  const newCheckIn = new Date(checkIn + 'T00:00:00');
  const newCheckOut = new Date(checkOut + 'T00:00:00');
  return bookings.find(b =>
    b.status === 'confirmed' &&
    new Date(b.checkIn + 'T00:00:00') < newCheckOut &&
    new Date(b.checkOut + 'T00:00:00') > newCheckIn
  ) || null;
};

export const addBooking = (booking) => {
  try {
    // --- FETCH LOGIC (commented) ---
    // const res = await fetch('/api/bookings', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newBooking)
    // });
    // const savedBooking = await res.json();
    // return savedBooking;
    // --- END FETCH LOGIC ---
    // Prevent double booking for same user and overlapping dates (across any hotel)
    if (hasAnyBookingConflict(booking.userId, booking.checkIn, booking.checkOut)) {
      const error = new Error('You already have a booking for these dates at this hotel.');
      error.code = 'BOOKING_CONFLICT';
      throw error;
    }
    const bookings = getBookings();
    const newBooking = {
      id: Date.now().toString(),
      ...booking,
      bookingDate: new Date().toISOString(),
      status: 'confirmed'
    };
    bookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    return newBooking;
  } catch (error) {
    console.error('Error adding booking:', error);
    throw error;
  }
};

export const cancelBooking = (bookingId) => {
  try {
    // --- FETCH LOGIC (commented) ---
    // await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
    // --- END FETCH LOGIC ---
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Update booking status to cancelled instead of removing it
    const updatedBookings = bookings.map(b =>
      b.id === bookingId
        ? { ...b, status: 'cancelled', cancelledAt: new Date().toISOString() }
        : b
    );
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));

    // Return the cancelled booking for notification purposes
    return { ...booking, status: 'cancelled', cancelledAt: new Date().toISOString() };
  } catch (error) {
    console.error('Error canceling booking:', error);
    throw error;
  }
};

/**
 * Check if a booking can be cancelled (24 hours before check-in)
 */
export const canCancelBooking = (booking) => {
  if (!booking || booking.status !== 'confirmed') {
    return { canCancel: false, reason: 'Booking is not confirmed' };
  }

  const now = new Date();
  const checkInDate = new Date(booking.checkIn + 'T14:00:00'); // Assuming 2 PM check-in
  const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

  if (hoursUntilCheckIn < 24) {
    return {
      canCancel: false,
      reason: 'Cancellations are only allowed 24 hours before check-in',
      hoursRemaining: Math.max(0, hoursUntilCheckIn)
    };
  }

  return {
    canCancel: true,
    hoursRemaining: hoursUntilCheckIn
  };
};

/**
 * Get formatted time until cancellation deadline
 */
export const getCancellationDeadline = (booking) => {
  const checkInDate = new Date(booking.checkIn + 'T14:00:00');
  const cancellationDeadline = new Date(checkInDate.getTime() - (24 * 60 * 60 * 1000)); // 24 hours before

  return cancellationDeadline.toLocaleString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const updateBookingStatus = (bookingId, status) => {
  try {
    // --- FETCH LOGIC (commented) ---
    // await fetch(`/api/bookings/${bookingId}`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ status })
    // });
    // --- END FETCH LOGIC ---
    const bookings = getBookings();
    const updatedBookings = bookings.map(booking =>
      booking.id === bookingId
        ? { ...booking, status }
        : booking
    );
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
    return true;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};
