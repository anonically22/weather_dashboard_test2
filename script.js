// Weather Dashboard Script

// --- Constants ---
const API_KEY = "406cea89f5b5d606ef0cd7ef8cf8edd6"; // API Key set as per user instruction
const API_URL_CURRENT = "https://api.openweathermap.org/data/2.5/weather";
// const API_URL_FORECAST = "https://api.openweathermap.org/data/2.5/forecast"; // We'll use this later

console.log("Weather Dashboard script loaded. API Key placeholder set.");

// --- DOM Element Selectors ---
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');

// Current Weather Display Elements
const currentCityName = document.getElementById('current-city-name');
const currentDate = document.getElementById('current-date');
const currentWeatherIcon = document.getElementById('current-weather-icon');
const currentTemp = document.getElementById('current-temp');
const currentHumidity = document.getElementById('current-humidity');
const currentWind = document.getElementById('current-wind');
const currentWeatherDescription = document.getElementById('current-weather-description');

// UI Feedback Elements
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessageDiv = document.getElementById('error-message');

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
            if (response.status === 404) {
                throw new Error(`City not found: '${city}'. Please check the spelling.`);
            } else if (response.status === 401) {
                throw new Error("Invalid API Key. Please verify your API_KEY in script.js or contact support if you recently generated it, as it might take a few minutes to activate.");
            } else {
                const errorData = await response.json().catch(() => null); // Try to get error message from API
                const apiMessage = errorData && errorData.message ? errorData.message : `HTTP error ${response.status}`;
                throw new Error(`Failed to fetch weather data: ${apiMessage}`);
            }
        }

        const data = await response.json();
        if (data.cod && data.cod !== 200) { // OpenWeatherMap sometimes returns 200 OK with an internal error code
            throw new Error(data.message || "An unexpected error occurred with the weather service.");
        }
        displayCurrentWeather(data);
    } catch (error) {
        console.error("Error in getCurrentWeather:", error);
        displayError(error.message);
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// --- DOM Manipulation Functions ---

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
    currentHumidity.textContent = data.main && data.main.humidity !== undefined ? data.main.humidity : "--";
    currentWind.textContent = data.wind && data.wind.speed !== undefined ? data.wind.speed.toFixed(1) : "--";

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
    currentHumidity.textContent = "--";
    currentWind.textContent = "--";
    currentWeatherIcon.src = "http://openweathermap.org/img/wn/10d@2x.png"; // Default icon
    currentWeatherIcon.alt = "Weather icon";
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
