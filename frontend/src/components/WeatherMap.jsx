import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { fetchCurrentWeather } from '../services/weatherService';
import '../styles/weather-map.css';

const CITY_COORDS = {
    Goa: { lat: 15.2993, lon: 74.124 },
    Mumbai: { lat: 19.076, lon: 72.8777 },
    Delhi: { lat: 28.6139, lon: 77.209 },
    'New Delhi': { lat: 28.6139, lon: 77.209 },
    Bangalore: { lat: 12.9716, lon: 77.5946 },
    Chennai: { lat: 13.0827, lon: 80.2707 },
    Hyderabad: { lat: 17.385, lon: 78.4867 },
    Kolkata: { lat: 22.5726, lon: 88.3639 },
    Pune: { lat: 18.5204, lon: 73.8567 },
    Ahmedabad: { lat: 23.0225, lon: 72.5714 },
    Jaipur: { lat: 26.9124, lon: 75.7873 },
};

function getCoordsForCity(city) {
    if (!city) return null;
    if (CITY_COORDS[city]) return CITY_COORDS[city];
    const key = Object.keys(CITY_COORDS).find(k =>
        city.toLowerCase().includes(k.toLowerCase())
    );
    return key ? CITY_COORDS[key] : null;
}

const weatherDesc = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    61: 'Slight rain',
    71: 'Slight snow fall',
    80: 'Rain showers',
    95: 'Thunderstorm',
};

function WeatherMapModal({ city, open, onClose }) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!city || !open) return;
        const coords = getCoordsForCity(city);
        if (!coords) {
            setError('No coordinates for this city');
            setLoading(false);
            return;
        }
        setLoading(true);
        fetchCurrentWeather(coords)
            .then(data => {
                setWeather(data);
                setError(null);
            })
            .catch(() => setError('Could not fetch weather'))
            .finally(() => setLoading(false));
    }, [city, open]);

    return (
        <AnimatePresence>
            {open && (
                <Motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="confirmation-overlay"
                    onClick={onClose}
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
                        backdropFilter: 'blur(5px)',
                    }}
                >
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="confirmation-modal"
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--border-radius)',
                            padding: '32px',
                            maxWidth: '400px',
                            width: '90%',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
                            position: 'relative',
                            textAlign: 'center',
                        }}
                    >
                        <button
                            onClick={onClose}
                            aria-label="Close weather details"
                            style={{
                                position: 'absolute',
                                top: 12,
                                right: 18,
                                background: 'none',
                                border: 'none',
                                fontSize: 28,
                                color: 'var(--text-gray)',
                                cursor: 'pointer',
                                borderRadius: '50%',
                                padding: 4,
                                transition: 'var(--transition)',
                            }}
                        >
                            ×
                        </button>
                        <div style={{ marginBottom: 18 }}>
                            <span style={{ fontSize: 32, marginRight: 8 }}>☁️</span>
                            <span
                                style={{
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    color: '#ffd166',
                                }}
                            >
                                Weather in <span style={{ color: '#ffd166' }}>{city}</span>
                            </span>
                        </div>
                        {loading ? (
                            <div>Loading weather...</div>
                        ) : error ? (
                            <div className="error">{error}</div>
                        ) : weather && weather.current_weather ? (
                            (() => {
                                const w = weather.current_weather;
                                const desc = weatherDesc[w.weathercode] || 'Unknown';
                                return (
                                    <>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 10,
                                                marginBottom: 8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontWeight: 800,
                                                    fontSize: '2rem',
                                                    color: '#ffd166',
                                                }}
                                            >
                                                {Math.round(w.temperature)}°C
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '1.1rem',
                                                    color: 'var(--text-light)',
                                                }}
                                            >
                                                {desc}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '1rem',
                                                color: 'var(--text-gray)',
                                                marginBottom: 2,
                                            }}
                                        >
                                            <span>Wind: {w.windspeed} km/h</span>
                                            <span style={{ marginLeft: 14 }}>
                                                Time: {w.time ? new Date(w.time).toLocaleString() : ''}
                                            </span>
                                        </div>
                                    </>
                                );
                            })()
                        ) : null}
                    </Motion.div>
                </Motion.div>
            )}
        </AnimatePresence>
    );
}

function WeatherMapButton({ city }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                aria-label="Check weather"
                className="weather-check-btn"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    color: '#ffd166',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    marginLeft: 18,
                    padding: '4px 12px',
                    borderRadius: 8,
                    transition: 'background 0.15s',
                }}
                onClick={() => setOpen(true)}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') setOpen(true);
                }}
            >
                <span style={{ fontSize: 22, verticalAlign: 'middle' }}>☁️</span>
                <span>Check Weather</span>
            </button>
            <WeatherMapModal city={city} open={open} onClose={() => setOpen(false)} />
        </>
    );
}

export { WeatherMapButton, WeatherMapModal };
export default WeatherMapButton;
