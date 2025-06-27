const express = require('express');
const fetch = require('node-fetch'); // Using node-fetch version 2

const router = express.Router();

const OPENWEATHERMAP_API_KEY = process.env.API_KEY;
const OPENWEATHERMAP_CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const OPENWEATHERMAP_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

// --- Simple In-Memory Cache ---
const cache = new Map(); // Using Map for better performance with frequent additions/deletions
const CACHE_DURATION_SERVER_MS = 10 * 60 * 1000; // 10 minutes server-side cache

function getServerCachedData(key) {
    const cachedEntry = cache.get(key);
    if (cachedEntry) {
        const now = new Date().getTime();
        if (now - cachedEntry.timestamp < CACHE_DURATION_SERVER_MS) {
            console.log(`Server cache HIT for: ${key}`);
            return cachedEntry.data;
        } else {
            console.log(`Server cache EXPIRED for: ${key}`);
            cache.delete(key);
        }
    }
    console.log(`Server cache MISS for: ${key}`);
    return null;
}

function setServerCachedData(key, data) {
    const entry = {
        data: data,
        timestamp: new Date().getTime()
    };
    cache.set(key, entry);
    console.log(`Server cache SET for: ${key}`);
    // Simple cache eviction if map grows too large (optional, basic version here)
    if (cache.size > 100) { // Example limit
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
        console.log(`Server cache EVICTED oldest key: ${oldestKey} due to size limit.`);
    }
}
// --- End Simple In-Memory Cache ---


// Middleware to check if API_KEY is set
router.use((req, res, next) => {
    if (!OPENWEATHERMAP_API_KEY) {
        console.error("API Key is not configured on the server.");
        return res.status(500).json({ message: "Server configuration error: API Key missing." });
    }
    next();
});

// Route for current weather
// Supports search by city name or by lat/lon
// e.g., /api/weather/current?city=London
// e.g., /api/weather/current?lat=51.5074&lon=0.1278
router.get('/current', async (req, res) => {
    const { city, lat, lon } = req.query;
    let apiUrl = '';
    let cacheKey = '';

    if (city) {
        apiUrl = `${OPENWEATHERMAP_CURRENT_URL}?q=${encodeURIComponent(city)}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
        cacheKey = `current_${city.toLowerCase()}`;
    } else if (lat && lon) {
        apiUrl = `${OPENWEATHERMAP_CURRENT_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
        cacheKey = `current_coords_${parseFloat(lat).toFixed(2)}_${parseFloat(lon).toFixed(2)}`;
    } else {
        return res.status(400).json({ message: "Missing query parameters: requires 'city' or 'lat' and 'lon'." });
    }

    const cachedData = getServerCachedData(cacheKey);
    if (cachedData) {
        return res.json(cachedData);
    }

    try {
        const weatherResponse = await fetch(apiUrl);
        const weatherData = await weatherResponse.json();

        if (!weatherResponse.ok) {
            return res.status(weatherResponse.status).json({
                message: weatherData.message || `Error fetching current weather from OpenWeatherMap. Status: ${weatherResponse.status}`,
                originalError: weatherData
            });
        }
        setServerCachedData(cacheKey, weatherData); // Cache successful response
        res.json(weatherData);
    } catch (error) {
        console.error("Error in /current weather route:", error);
        res.status(500).json({ message: "Server error while fetching current weather." });
    }
});

// Route for 5-day forecast
// Supports search by city name (less accurate for forecast) or by lat/lon (preferred)
// e.g., /api/weather/forecast?city=London
// e.g., /api/weather/forecast?lat=51.5074&lon=0.1278
router.get('/forecast', async (req, res) => {
    const { city, lat, lon } = req.query;
    let apiUrl = '';
    let cacheKey = '';

    if (lat && lon) { // Prefer lat/lon for forecast accuracy
        apiUrl = `${OPENWEATHERMAP_FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
        cacheKey = `forecast_coords_${parseFloat(lat).toFixed(2)}_${parseFloat(lon).toFixed(2)}`;
    } else if (city) {
        apiUrl = `${OPENWEATHERMAP_FORECAST_URL}?q=${encodeURIComponent(city)}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
        cacheKey = `forecast_${city.toLowerCase()}`;
    } else {
        return res.status(400).json({ message: "Missing query parameters: requires 'lat' and 'lon', or 'city'." });
    }

    const cachedData = getServerCachedData(cacheKey);
    if (cachedData) {
        return res.json(cachedData);
    }

    try {
        const forecastResponse = await fetch(apiUrl);
        const forecastData = await forecastResponse.json();

        if (!forecastResponse.ok) {
            return res.status(forecastResponse.status).json({
                message: forecastData.message || `Error fetching forecast from OpenWeatherMap. Status: ${forecastResponse.status}`,
                originalError: forecastData
            });
        }
        setServerCachedData(cacheKey, forecastData); // Cache successful response
        res.json(forecastData);
    } catch (error) {
        console.error("Error in /forecast route:", error);
        res.status(500).json({ message: "Server error while fetching forecast." });
    }
});

module.exports = router;
