// Simple geoutils: coordinates for major Indian cities used in the catalog
// Coordinates are approximate city centers (lat, lon in degrees)

export const CITY_COORDS = {
    'Goa': { lat: 15.2993, lon: 74.1240 },
    'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
    'Bangalore': { lat: 12.9716, lon: 77.5946 },
    'Bengaluru': { lat: 12.9716, lon: 77.5946 },
    'Chennai': { lat: 13.0827, lon: 80.2707 },
    'Hyderabad': { lat: 17.3850, lon: 78.4867 },
    'Jaipur': { lat: 26.9124, lon: 75.7873 },
    'Kolkata': { lat: 22.5726, lon: 88.3639 },
    'Mumbai': { lat: 19.0760, lon: 72.8777 },
    'New Delhi': { lat: 28.6139, lon: 77.2090 },
    'Delhi': { lat: 28.6139, lon: 77.2090 },
    'Pune': { lat: 18.5204, lon: 73.8567 },
    'Kerala': { lat: 10.8505, lon: 76.2711 }
};

export function getCityCoords(city) {
    if (!city) return null;
    const key = String(city).trim();
    return CITY_COORDS[key] || null;
}

// Haversine distance in kilometers between two {lat, lon}
export function haversineKm(a, b) {
    if (!a || !b) return Infinity;
    const R = 6371; // km
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return Math.round(R * c * 10) / 10; // 0.1 km precision
}

function toRad(deg) {
    return (deg * Math.PI) / 180;
}
