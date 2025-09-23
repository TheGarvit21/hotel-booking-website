// Hotel management utilities for admin dashboard

export const addHotel = async (hotel) => {
    const hotels = JSON.parse(localStorage.getItem('indianHotels') || '[]');
    // Ensure unique name to avoid collision with default hotels
    let baseName = hotel.name ? hotel.name.trim() : 'Hotel';
    let uniqueName = baseName;
    let counter = 2;
    while (hotels.some(h => h.name === uniqueName && h.city === hotel.city)) {
        uniqueName = `${baseName} (${hotel.city || ''} #${counter})`;
        counter++;
    }
    hotel.name = uniqueName;
    hotel.id = Date.now();
    // Always set status to 'active', available to true, and ensure city is set
    hotel.status = 'active';
    hotel.available = true;
    // Set city from location if missing
    if (!hotel.city && hotel.location) {
        const cityMatch = /\b(Mumbai|New Delhi|Bangalore|Chennai|Hyderabad|Kolkata|Pune|Jaipur|Goa|Ahmedabad|Kerala)\b/i.exec(hotel.location);
        hotel.city = cityMatch ? cityMatch[1] : '';
    }
    // Set location from city if missing
    if (!hotel.location && hotel.city) {
        hotel.location = hotel.city;
    }
    // Assign a random Unsplash image if not provided or empty
    const unsplashImages = [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
    ];
    if (!hotel.image || hotel.image === '') {
        hotel.image = unsplashImages[Math.floor(Math.random() * unsplashImages.length)];
    }
    if (!hotel.images || !Array.isArray(hotel.images) || hotel.images.length === 0) {
        // Assign 3-5 random images for gallery
        hotel.images = Array.from({ length: 4 }, () => unsplashImages[Math.floor(Math.random() * unsplashImages.length)]);
    }
    hotels.push(hotel);
    localStorage.setItem('indianHotels', JSON.stringify(hotels));
    return hotel;
};

export const updateHotel = async (hotelId, updatedFields) => {
    let hotels = JSON.parse(localStorage.getItem('indianHotels') || '[]');
    hotels = hotels.map(hotel => {
        if (hotel.id === hotelId) {
            const updated = { ...hotel, ...updatedFields };
            updated.status = 'active';
            updated.available = true;
            if (!updated.city && updated.location) {
                const cityMatch = /\b(Mumbai|New Delhi|Bangalore|Chennai|Hyderabad|Kolkata|Pune|Jaipur|Goa|Ahmedabad|Kerala)\b/i.exec(updated.location);
                updated.city = cityMatch ? cityMatch[1] : '';
            }
            return updated;
        }
        return hotel;
    });
    localStorage.setItem('indianHotels', JSON.stringify(hotels));
    return hotels.find(hotel => hotel.id === hotelId);
};

export const deleteHotel = async (hotelId) => {
    let hotels = JSON.parse(localStorage.getItem('indianHotels') || '[]');
    hotels = hotels.filter(hotel => hotel.id !== hotelId);
    localStorage.setItem('indianHotels', JSON.stringify(hotels));
    return true;
};
