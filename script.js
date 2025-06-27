// Weather Dashboard Script

// --- Constants ---
const API_KEY = "406cea89f5b5d606ef0cd7ef8cf8edd6"; // API Key set as per user instruction
const API_URL_CURRENT = "https://api.openweathermap.org/data/2.5/weather";
const API_URL_FORECAST = "https://api.openweathermap.org/data/2.5/forecast";

console.log("Weather Dashboard script loaded. API Key set.");

// --- DOM Element Selectors ---
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');

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

    const fullApiUrl = `${API_URL_FORECAST}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    // Or by city name: const fullApiUrl = `${API_URL_FORECAST}?q=${city}&appid=${API_KEY}&units=metric`;
    // Using lat/lon from current weather is generally more precise.

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

        const processedForecast = processForecastData(data.list);
        displayFiveDayForecast(processedForecast); // This function will be implemented next
        console.log("5-Day Forecast data:", data); // For debugging
        console.log("Processed 5-Day Forecast:", processedForecast); // For debugging

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
});
