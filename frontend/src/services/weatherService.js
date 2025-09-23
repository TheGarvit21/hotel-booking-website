// weatherService.js
// Service to fetch weather data using Open-Meteo API

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// Fetch current weather for given latitude and longitude
export async function fetchCurrentWeather({ lat, lon }) {
    const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius&windspeed_unit=kmh&precipitation_unit=mm`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch weather');
    return res.json();
}
