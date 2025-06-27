# Weather Dashboard - Full Stack Application

A comprehensive web application that fetches and displays real-time weather data and forecasts, now with a secure backend API proxy.

## Project Overview

This application allows users to search for weather conditions by city name or use their current geolocation. It displays current weather details and a 5-day forecast. User search history is saved locally, and API responses are cached on both client and server-side to improve performance and reduce redundant API calls to the OpenWeatherMap service.

The project is structured into a separate frontend (HTML, CSS, JavaScript) and a backend (Node.js with Express) to securely manage the OpenWeatherMap API key.

## Features

*   Current weather display:
    *   City name, country, date
    *   Temperature, "feels like" temperature
    *   Humidity, wind speed, pressure, visibility
    *   Weather description and icon
*   5-day weather forecast with daily summaries (min/max temp, icon).
*   Search by city name.
*   Weather lookup by user's geolocation.
*   Recent search history (persisted in localStorage) with quick search buttons.
*   Client-side caching of API responses to reduce backend calls.
*   Server-side in-memory caching of OpenWeatherMap API responses to reduce external API calls.
*   Dynamic UI updates based on weather conditions (e.g., background changes).
*   Responsive design.
*   Secure API key management via backend proxy.

## Project Structure

```
weather-app/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── backend/
│   ├── server.js         # Main Express server file
│   ├── routes/
│   │   └── weather.js    # API routes for weather data
│   ├── data/             # (Currently unused, planned for persistent cache)
│   ├── .env              # Environment variables (API_KEY, PORT) - DO NOT COMMIT ACTUAL KEYS
│   ├── .gitignore        # Specifies intentionally untracked files (node_modules, .env)
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

*   Node.js and npm installed (for the backend).
*   A modern web browser (for the frontend).
*   An API key from [OpenWeatherMap](https://openweathermap.org/appid).

### Setup and Running the Application

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd weather-app
    ```

2.  **Backend Setup:**
    *   Navigate to the backend directory:
        ```bash
        cd backend
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Create a `.env` file in the `backend/` directory. Copy the contents of `.env.example` (if provided) or create it manually with the following content:
        ```dotenv
        PORT=3000
        API_KEY="YOUR_OPENWEATHERMAP_API_KEY"
        ```
        Replace `"YOUR_OPENWEATHERMAP_API_KEY"` with your actual OpenWeatherMap API key.
    *   Start the backend server:
        ```bash
        npm start
        ```
        The backend server should now be running on `http://localhost:3000` (or the port specified in your `.env` file). You should see log messages indicating the server has started and if the API key was loaded.

3.  **Frontend Setup:**
    *   Open the `frontend/index.html` file in your web browser.
        *   You can usually do this by double-clicking the file.
        *   For best results, especially to avoid potential CORS issues if you modify how frontend communicates or if certain browser securities apply, serve the `frontend` directory using a simple HTTP server. For example, using `live-server` (install with `npm install -g live-server` then run `live-server` in the `frontend/` directory or project root).

4.  **Using the Application:**
    *   Enter a city name in the search bar and click "Search" or press Enter.
    *   Click "Use My Location" to get weather for your current position (you'll be prompted for location permission).
    *   Recently searched cities will appear as clickable buttons.
    *   Use "Clear History" to remove recent search buttons.

## API Key Management

The OpenWeatherMap API key is managed securely on the backend. The frontend application makes requests to the backend server, which then queries the OpenWeatherMap API using the stored key. This prevents the API key from being exposed in the client-side code.

## Future Enhancements / Deployment Considerations

*   **Persistent Server-Side Cache:** Implement caching to `backend/data/cache.json` using the `fs` module for persistence across server restarts.
*   **More Robust Error Handling:** Enhance error handling on both frontend and backend.
*   **Input Sanitization & Validation:** Add stricter validation and sanitization for all inputs on the backend.
*   **Rate Limiting:** Implement rate limiting on the backend API endpoints.
*   **Deployment:**
    *   **Frontend:** Can be deployed to static hosting services like Netlify, Vercel, or GitHub Pages.
    *   **Backend:** Can be deployed to platforms like Heroku, Railway, Render, or any Node.js hosting environment. Environment variables (especially `API_KEY` and `PORT`) must be configured on the deployment platform.
*   **Advanced Features:** Consider adding features like auto-complete for city names, weather alerts, etc., as outlined in advanced project phases.

---

*This README will be updated as the project progresses.*
