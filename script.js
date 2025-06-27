// Weather Dashboard Script

// --- Constants ---
const API_KEY = "406cea89f5b5d606ef0cd7ef8cf8edd6"; // API Key set as per user instruction
const API_URL_CURRENT = "https://api.openweathermap.org/data/2.5/weather";
const API_URL_FORECAST = "https://api.openweathermap.org/data/2.5/forecast";

console.log("Weather Dashboard script loaded. API Key set.");

// --- DOM Element Selectors ---
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const geolocationButton = document.getElementById('geolocation-button');
const recentSearchesButtonsDiv = document.getElementById('recent-searches-buttons');
const clearHistoryButton = document.getElementById('clear-history-button');

// Current Weather Display Elements
const currentCityName = document.getElementById('current-city-name');
const currentDate = document.getElementById('current-date');
const currentWeatherIcon = document.getElementById('current-weather-icon');
const currentTemp = document.getElementById('current-temp');
const currentFeelsLike = document.getElementById('current-feels-like');
const currentHumidity = document.getElementById('current-humidity');
const currentWind = document.getElementById('current-wind');
const currentPressure = document.getElementById('current-pressure');
const currentVisibility = document.getElementById('current-visibility');
const currentWeatherDescription = document.getElementById('current-weather-description');

// UI Feedback Elements
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessageDiv = document.getElementById('error-message');

// Forecast Display Element
const forecastCardsContainer = document.querySelector('.forecast-cards-container');


// --- Core Weather Functions ---

/**
 * Fetches the current weather data for a given city.
 * @param {string} city The name of the city.
 */
async function getCurrentWeather(city) {
    loadingIndicator.classList.remove('hidden');
    errorMessageDiv.classList.add('hidden'); // Clear previous errors
    errorMessageDiv.textContent = '';

    if (!city) {
        displayError("Please enter a city name.");
        loadingIndicator.classList.add('hidden');
        return;
    }

    const cacheKey = `current_${city.toLowerCase()}`;
    const cachedData = getCachedApiData(cacheKey);

    if (cachedData) {
        displayCurrentWeather(cachedData);
        // Need to fetch forecast even if current weather is cached,
        // unless forecast is also cached based on same city name / coords.
        // Let's assume forecast cache will be checked within getFiveDayForecast.
        // We need lat/lon from cachedData for the forecast call.
        await getFiveDayForecast(cachedData.name || city, cachedData.coord.lat, cachedData.coord.lon);
        loadingIndicator.classList.add('hidden'); // Hide loader after processing cached data + new forecast
        return;
    }

    const fullApiUrl = `${API_URL_CURRENT}?q=${city}&appid=${API_KEY}&units=metric`;

    try {
        const response = await fetch(fullApiUrl);

        if (!response.ok) {
            // Try to parse error message from API first
            let apiErrorMessage = `HTTP error ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.message) {
                    apiErrorMessage = errorData.message;
                }
            } catch (e) {
                // Could not parse JSON, stick with HTTP status
            }

            if (response.status === 404) {
                throw new Error(`City not found: '${city}'. Please check the spelling. Server: ${apiErrorMessage}`);
            } else if (response.status === 401) {
                throw new Error(`Invalid API Key (Error ${response.status}). Please verify your API_KEY in script.js. Server: ${apiErrorMessage}`);
            } else {
                throw new Error(`Failed to fetch current weather: ${apiErrorMessage} (Status: ${response.status})`);
            }
        }

        const data = await response.json();
        // Current weather API returns 'cod' as a number
        if (data.cod && data.cod !== 200) {
            throw new Error(data.message || "An unexpected error occurred with the weather service fetching current weather.");
        }

        // Save the successfully searched city name (from API response for consistency) to history
        // Only do this if 'city' was the primary search term, not from a geo lookup that might also call this.
        // The 'city' param to getCurrentWeather is the user's input.
        // 'data.name' is what the API returned.
        if (city && city.trim().length > 0) { // Ensure it was a city name search
             saveSearchToHistory(data.name);
        }
        setCachedApiData(cacheKey, data); // Cache the fetched data
        displayCurrentWeather(data);
        // After successfully getting current weather, fetch forecast
        // Pass city name for display purposes if needed, lat/lon for accuracy
        await getFiveDayForecast(data.name || city, data.coord.lat, data.coord.lon);
    } catch (error) {
        console.error("Error in getCurrentWeather or subsequent forecast call:", error);
        displayError(error.message);
        clearFiveDayForecastDisplay();
        loadingIndicator.classList.add('hidden'); // Ensure loader is hidden on error path
    }
    // 'finally' block removed from here; loading indicator is hidden by getFiveDayForecast or the catch block above.
}


/**
 * Fetches the 5-day weather forecast for a given city or coordinates.
 * Using coordinates from current weather data is preferred for accuracy.
 * @param {string} city The name of the city (used as fallback or for display).
 * @param {number} lat Latitude.
 * @param {number} lon Longitude.
 */
async function getFiveDayForecast(city, lat, lon) {
    // Consider a separate loading indicator for forecast or manage a global one carefully.
    // For now, assuming the main loading indicator is still active or we don't show a separate one.
    // errorMessageDiv.classList.add('hidden'); // Errors are handled by displayError primarily

    // Using lat/lon for forecast cache key as it's more precise
    const cacheKey = `forecast_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cachedData = getCachedApiData(cacheKey);

    if (cachedData) {
        const processedForecast = processForecastData(cachedData.list); // Process raw list data from cache
        displayFiveDayForecast(processedForecast);
        console.log("5-Day Forecast data from CACHE:", cachedData);
        console.log("Processed 5-Day Forecast from CACHE:", processedForecast);
        loadingIndicator.classList.add('hidden'); // Hide loader after displaying cached forecast
        return;
    }

    const fullApiUrl = `${API_URL_FORECAST}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    try {
        const response = await fetch(fullApiUrl);
        if (!response.ok) {
            let apiErrorMessage = `HTTP error ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.message) {
                    apiErrorMessage = errorData.message;
                }
            } catch (e) {
                // Could not parse JSON, stick with HTTP status
            }
            throw new Error(`Failed to fetch 5-day forecast: ${apiErrorMessage} (Status: ${response.status})`);
        }
        const data = await response.json();

        if (data.cod && data.cod !== "200") { // Forecast API returns `cod` as a string
             throw new Error(data.message || "An unexpected error occurred with the forecast service.");
        }

        setCachedApiData(cacheKey, data); // Cache the raw forecast data (which includes data.list)
        const processedForecast = processForecastData(data.list);
        displayFiveDayForecast(processedForecast);
        console.log("5-Day Forecast data from API:", data); // For debugging
        console.log("Processed 5-Day Forecast from API:", processedForecast); // For debugging

    } catch (error) {
        console.error("Error in getFiveDayForecast:", error);
        displayError(error.message); // Use the main displayError to show this error too
        clearFiveDayForecastDisplay();
    } finally {
        // This is the final data fetching step, so hide the main loading indicator.
        loadingIndicator.classList.add('hidden');
    }
}

/**
 * Processes the raw forecast list data to get daily summaries.
 * @param {Array} forecastListData The list of 3-hour interval forecasts from OpenWeatherMap.
 * @returns {Array} An array of objects, each representing a summarized daily forecast.
 */
function processForecastData(forecastListData) {
    if (!forecastListData || forecastListData.length === 0) {
        return [];
    }

    const dailyData = {};

    forecastListData.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        // Use item.dt_txt.split(' ')[0] for date string if more direct grouping is needed by YYYY-MM-DD
        // const dateKey = item.dt_txt.split(' ')[0];

        if (!dailyData[date]) {
            dailyData[date] = {
                date: date,
                temps: [],
                humidities: [],
                winds: [],
                weatherIcons: [],
                weatherDescriptions: [],
                dt_texts: [] // Store dt_txt to pick a representative icon (e.g., midday)
            };
        }
        dailyData[date].temps.push(item.main.temp);
        dailyData[date].humidities.push(item.main.humidity);
        dailyData[date].winds.push(item.wind.speed);
        dailyData[date].weatherIcons.push(item.weather[0].icon);
        dailyData[date].weatherDescriptions.push(item.weather[0].description);
        dailyData[date].dt_texts.push(item.dt_txt);
    });

    return Object.values(dailyData).map(day => {
        const minTemp = Math.min(...day.temps);
        const maxTemp = Math.max(...day.temps);

        // Logic to choose a representative icon:
        // Prioritize midday (12:00:00 or 15:00:00) icon if available for that day.
        let representativeIcon = day.weatherIcons[0]; // Default to first icon
        let representativeDescription = day.weatherDescriptions[0];

        const middayIndex = day.dt_texts.findIndex(dt_txt => dt_txt.includes("12:00:00") || dt_txt.includes("15:00:00"));
        if (middayIndex !== -1) {
            representativeIcon = day.weatherIcons[middayIndex];
            representativeDescription = day.weatherDescriptions[middayIndex];
        } else {
            // Fallback: Could use the most frequent icon, or just the first one of the day.
            // For simplicity, using the first one if no midday is found.
            // Or, find the icon corresponding to the max_temp time or min_temp time if that's preferred.
        }

        return {
            date: day.date,
            minTemp: minTemp.toFixed(1),
            maxTemp: maxTemp.toFixed(1),
            icon: representativeIcon,
            description: representativeDescription, // Could be useful for alt text on forecast cards
            // avgHumidity: (day.humidities.reduce((a, b) => a + b, 0) / day.humidities.length).toFixed(0) // Example for more data
        };
    }).slice(0, 5); // Ensure we only take up to 5 days of forecast
}


// --- DOM Manipulation Functions ---

/**
 * Clears the 5-day forecast display area.
 */
function clearFiveDayForecastDisplay() {
    if (forecastCardsContainer) {
        forecastCardsContainer.innerHTML = '';
    }
    // console.log("Forecast display cleared.");
}

/**
 * Displays the 5-day forecast on the page.
 * @param {Array} dailyForecastsArray An array of processed daily forecast objects.
 */
function displayFiveDayForecast(dailyForecastsArray) {
    if (!forecastCardsContainer) {
        console.error("Forecast container not found in DOM.");
        return;
    }
    clearFiveDayForecastDisplay(); // Clear any old forecast cards

    if (!dailyForecastsArray || dailyForecastsArray.length === 0) {
        // Optionally display a message like "Forecast not available"
        // For now, just ensures it's clear if no data.
        // displayError can be called by the fetching function if there's a total failure.
        console.log("No forecast data to display or array is empty.");
        return;
    }

    // Clear previous error messages if any, as we are about to display new data
    errorMessageDiv.classList.add('hidden');
    errorMessageDiv.textContent = '';

    dailyForecastsArray.forEach(day => {
        const card = document.createElement('div');
        card.classList.add('weather-card', 'forecast-card');

        const dateEl = document.createElement('h4');
        dateEl.textContent = day.date;

        const iconEl = document.createElement('img');
        iconEl.src = `http://openweathermap.org/img/wn/${day.icon}@2x.png`;
        iconEl.alt = day.description || "Weather icon"; // Use processed description

        const tempEl = document.createElement('p');
        tempEl.innerHTML = `Temp: ${day.minTemp}°C / ${day.maxTemp}°C`; // Using innerHTML for degree symbol

        // Optionally, add more details like humidity or wind if processed and desired
        // const humidityEl = document.createElement('p');
        // humidityEl.textContent = `Humidity: ${day.avgHumidity}%`;

        card.appendChild(dateEl);
        card.appendChild(iconEl);
        card.appendChild(tempEl);
        // card.appendChild(humidityEl);

        forecastCardsContainer.appendChild(card);
    });
}


/**
 * Displays the current weather data on the page.
 * @param {object} data The weather data object from OpenWeatherMap.
 */

/**
 * Displays the current weather data on the page.
 * @param {object} data The weather data object from OpenWeatherMap.
 */
function displayCurrentWeather(data) {
    if (!data) {
        displayError("No data to display.");
        return;
    }

    // Clear previous error messages as successful data is now being displayed
    errorMessageDiv.classList.add('hidden');
    errorMessageDiv.textContent = '';

    currentCityName.textContent = data.name ? `${data.name}, ${data.sys.country}` : "Unknown Location";
    currentDate.textContent = new Date(data.dt * 1000).toLocaleDateString(); // Use date from API if available
    currentTemp.textContent = data.main && data.main.temp !== undefined ? data.main.temp.toFixed(1) : "--";
    currentFeelsLike.textContent = data.main && data.main.feels_like !== undefined ? data.main.feels_like.toFixed(1) : "--";
    currentHumidity.textContent = data.main && data.main.humidity !== undefined ? data.main.humidity : "--";
    currentWind.textContent = data.wind && data.wind.speed !== undefined ? data.wind.speed.toFixed(1) : "--";
    currentPressure.textContent = data.main && data.main.pressure !== undefined ? data.main.pressure : "--";
    // Visibility is given in meters, convert to km if appropriate and value exists
    currentVisibility.textContent = data.visibility !== undefined ? (data.visibility / 1000).toFixed(1) : "--";

    if (data.weather && data.weather.length > 0) {
        currentWeatherDescription.textContent = data.weather[0].description;
        currentWeatherIcon.alt = data.weather[0].description;
        currentWeatherIcon.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    } else {
        currentWeatherDescription.textContent = "N/A";
        currentWeatherIcon.alt = "Weather icon not available";
        currentWeatherIcon.src = "http://openweathermap.org/img/wn/01d@2x.png"; // Default icon
    }
    console.log("Displayed current weather for:", data.name);
    updateWeatherStyling(data.weather && data.weather.length > 0 ? data.weather[0].main : null);
}

/**
 * Updates body class based on weather conditions for dynamic styling.
 * @param {string|null} weatherMain The main weather condition (e.g., "Clear", "Clouds", "Rain").
 */
function updateWeatherStyling(weatherMain) {
    const body = document.body;
    // Remove any existing weather classes
    body.classList.remove('weather-sunny', 'weather-cloudy', 'weather-rainy', 'weather-snowy', 'weather-default');

    if (!weatherMain) {
        body.classList.add('weather-default');
        return;
    }

    switch (weatherMain.toLowerCase()) {
        case 'clear':
            body.classList.add('weather-sunny');
            break;
        case 'clouds':
            body.classList.add('weather-cloudy');
            break;
        case 'rain':
        case 'drizzle':
        case 'thunderstorm':
            body.classList.add('weather-rainy');
            break;
        case 'snow':
            body.classList.add('weather-snowy');
            break;
        default:
            body.classList.add('weather-default'); // For Mist, Smoke, Haze, Dust, Fog, Sand, Ash, Squall, Tornado etc.
            break;
    }
}


/**
 * Displays an error message to the user.
 * @param {string} message The error message to display.
 */
function displayError(message) {
    console.error("Displaying error:", message);
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove('hidden');

    // Clear current weather display on error
    currentCityName.textContent = "City Name";
    currentDate.textContent = "Date";
    currentWeatherDescription.textContent = "Description";
    currentTemp.textContent = "--";
    currentFeelsLike.textContent = "--";
    currentHumidity.textContent = "--";
    currentWind.textContent = "--";
    currentPressure.textContent = "--";
    currentVisibility.textContent = "--";
    currentWeatherIcon.src = "http://openweathermap.org/img/wn/10d@2x.png"; // Default icon
    currentWeatherIcon.alt = "Weather icon";
    updateWeatherStyling(null); // Reset to default styling on error
}

// --- Event Listeners ---

searchButton.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getCurrentWeather(city);
    } else {
        displayError("Please enter a city name to search.");
    }
});

cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getCurrentWeather(city);
        } else {
            displayError("Please enter a city name to search.");
        }
    }
});

// Example of how it might be called (for testing in console):
// getCurrentWeather("London");
// getCurrentWeather("NonExistentCity"); // To test 404
// To test API key error (after replacing API_KEY with something invalid):
// const Real_API_KEY = API_KEY; API_KEY = "invalidkey"; getCurrentWeather("London"); API_KEY = Real_API_KEY;

// Initial page load setup
document.addEventListener('DOMContentLoaded', () => {
    updateWeatherStyling(null); // Set default background on load
    displaySearchHistory(); // Display search history on load
});

// --- Event Listener for Clear History Button ---
if (clearHistoryButton) {
    clearHistoryButton.addEventListener('click', () => {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
        displaySearchHistory(); // Update UI to show empty history
    });
}

// --- Geolocation Functions ---

/**
 * Gets the user's current geolocation coordinates.
 * @returns {Promise<GeolocationCoordinates>} A promise that resolves with the coordinates object or rejects with an error.
 */
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve(position.coords);
            },
            (error) => {
                let message = "Error getting location: ";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message += "User denied the request for Geolocation.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        message += "The request to get user location timed out.";
                        break;
                    default:
                        message += "An unknown error occurred.";
                        break;
                }
                reject(new Error(message));
            }
        );
    });
}


// --- Weather Fetching by Coordinates ---
/**
 * Fetches current weather and forecast using geographic coordinates.
 * @param {number} lat Latitude.
 * @param {number} lon Longitude.
 */
async function getWeatherByCoords(lat, lon) {
    loadingIndicator.classList.remove('hidden'); // Ensure loader is visible
    errorMessageDiv.classList.add('hidden');
    errorMessageDiv.textContent = '';

    const cacheKey = `current_coords_${lat.toFixed(2)}_${lon.toFixed(2)}`; // Create a key from coords
    const cachedData = getCachedApiData(cacheKey);

    if (cachedData) {
        displayCurrentWeather(cachedData);
        const cityNameForDisplay = cachedData.name || "Current Location";
        cityInput.value = cityNameForDisplay;
        await getFiveDayForecast(cityNameForDisplay, lat, lon); // Forecast also needs caching
        loadingIndicator.classList.add('hidden');
        return;
    }

    const fullApiUrlCurrent = `${API_URL_CURRENT}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    try {
        // Fetch current weather by coordinates
        const responseCurrent = await fetch(fullApiUrlCurrent);
        if (!responseCurrent.ok) {
            let apiErrorMessage = `HTTP error ${responseCurrent.status}`;
            try {
                const errorData = await responseCurrent.json();
                apiErrorMessage = errorData.message || apiErrorMessage;
            } catch (e) { /* Ignore if error response isn't JSON */ }
            throw new Error(`Failed to fetch current weather by coordinates: ${apiErrorMessage}`);
        }
        const currentData = await responseCurrent.json();
        if (currentData.cod && currentData.cod !== 200) {
            throw new Error(currentData.message || "Error from weather service fetching current weather by coordinates.");
        }

        setCachedApiData(cacheKey, currentData); // Cache the fetched data
        displayCurrentWeather(currentData); // Display current weather

        // City name from current weather response by coords might be useful for display or history if we decide to save it
        const cityNameForDisplay = currentData.name || "Current Location";
        cityInput.value = cityNameForDisplay; // Update search bar with city name found by geo

        // Fetch 5-day forecast using the same coordinates
        // getFiveDayForecast will handle its own loading indicator if needed, or use the global one.
        // It also hides the global loadingIndicator in its finally block.
        await getFiveDayForecast(cityNameForDisplay, lat, lon);

    } catch (error) {
        console.error("Error in getWeatherByCoords:", error);
        displayError(error.message);
        clearFiveDayForecastDisplay(); // Clear forecast if current weather by coords fails mid-way or forecast fails
        loadingIndicator.classList.add('hidden'); // Explicitly hide loader on error
    }
    // Note: getFiveDayForecast has its own finally block to hide the loader.
    // If getWeatherByCoords fails before calling getFiveDayForecast, the catch block here handles hiding it.
}

// --- LocalStorage Search History Functions ---
const SEARCH_HISTORY_KEY = 'weatherSearchHistory';
const MAX_HISTORY_ITEMS = 5;

// --- API Cache Configuration ---
const CACHE_PREFIX = 'weatherApiCache_';
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// --- Cache Helper Functions ---
/**
 * Retrieves an item from the API cache if it's valid.
 * @param {string} key The cache key.
 * @returns {object|null} The cached data or null if not found or expired.
 */
function getCachedApiData(key) {
    const itemStr = localStorage.getItem(CACHE_PREFIX + key);
    if (!itemStr) {
        return null;
    }
    try {
        const item = JSON.parse(itemStr);
        const now = new Date().getTime();
        if (now - item.timestamp < CACHE_DURATION_MS) {
            console.log("Cache hit for:", key);
            return item.data;
        } else {
            console.log("Cache expired for:", key);
            localStorage.removeItem(CACHE_PREFIX + key); // Remove expired item
            return null;
        }
    } catch (error) {
        console.error("Error parsing cache data for key:", key, error);
        return null; // Treat parse error as cache miss
    }
}

/**
 * Stores an item in the API cache.
 * @param {string} key The cache key.
 * @param {object} data The data to cache.
 */
function setCachedApiData(key, data) {
    const item = {
        data: data,
        timestamp: new Date().getTime()
    };
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
        console.log("Cache set for:", key);
    } catch (error) {
        console.error("Error setting cache data for key:", key, error, "(LocalStorage might be full)");
        // Optionally, implement a more sophisticated cache eviction strategy if storage is full
    }
}


/**
 * Retrieves the search history from localStorage.
 * @returns {string[]} An array of city names.
 */
function getSearchHistory() {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
}

/**
 * Saves a city name to the search history in localStorage.
 * Ensures the city is at the top, removes duplicates, and limits history size.
 * @param {string} cityName The city name to save.
 */
function saveSearchToHistory(cityName) {
    if (!cityName || typeof cityName !== 'string' || cityName.trim() === "") return;

    let history = getSearchHistory();
    // Remove any existing instance of the city to move it to the top (most recent)
    history = history.filter(item => item.toLowerCase() !== cityName.toLowerCase());

    history.unshift(cityName); // Add to the beginning

    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS); // Limit to max items
    }

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    displaySearchHistory(); // Update UI after saving
}


// --- UI Update for Search History ---
/**
 * Displays search history buttons in the UI.
 */
function displaySearchHistory() {
    if (!recentSearchesButtonsDiv) return;

    const history = getSearchHistory();
    recentSearchesButtonsDiv.innerHTML = ''; // Clear existing buttons

    if (history.length === 0) {
        if (clearHistoryButton) clearHistoryButton.classList.add('hidden');
        // Optionally, display a message like "No recent searches."
        const noHistoryMsg = document.createElement('p');
        noHistoryMsg.textContent = "No recent searches yet.";
        noHistoryMsg.style.fontStyle = "italic";
        recentSearchesButtonsDiv.appendChild(noHistoryMsg);
        return;
    }

    if (clearHistoryButton) clearHistoryButton.classList.remove('hidden');

    history.forEach(cityName => {
        const button = document.createElement('button');
        button.textContent = cityName;
        button.addEventListener('click', () => {
            cityInput.value = cityName; // Populate search box
            getCurrentWeather(cityName); // Perform search
        });
        recentSearchesButtonsDiv.appendChild(button);
    });
}


// --- Event Listener for Geolocation Button ---
if (geolocationButton) {
    geolocationButton.addEventListener('click', async () => {
        loadingIndicator.classList.remove('hidden');
        errorMessageDiv.classList.add('hidden');
        errorMessageDiv.textContent = '';
        // cityInput.value = ''; // Keep city input as is, will be updated by getWeatherByCoords

        try {
            const coords = await getUserLocation();
            console.log("Geolocation successful:", coords.latitude, coords.longitude);
            await getWeatherByCoords(coords.latitude, coords.longitude);
        } catch (error) { // This catch is for errors from getUserLocation itself
            console.error("Geolocation error in button event listener:", error);
            displayError(error.message);
            loadingIndicator.classList.add('hidden'); // Ensure loader hidden if getUserLocation fails
        }
    });
}
