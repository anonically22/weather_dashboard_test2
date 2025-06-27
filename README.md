# Weather Dashboard

A simple web application to display current weather and a 5-day forecast for a searched city using the OpenWeatherMap API.

This project is forked from `weather_dashboard_test2`.

## Project Phases

This project is being developed phase-wise.

### Phase 1: Foundation & Setup

**Learning Goals:**
- Set up project structure
- Create basic HTML layout
- Style with CSS
- Understand API basics

**Tasks Completed:**
- Project Setup: Created `index.html`, `styles.css`, `script.js`.
- Static UI Design: Implemented HTML for search, current weather, and forecast sections.
- CSS Styling: Added initial CSS for layout, theming, and responsiveness.

**Deliverables for this phase:**
- Static HTML page with complete UI.
- Responsive design that works on mobile and desktop.
- API key obtained and documented.

## API Key Configuration

To fetch weather data, you need an API key from [OpenWeatherMap](https://openweathermap.org/appid).

1.  **Sign up** for a free account on OpenWeatherMap.
2.  Navigate to the **API keys** section on your account page.
3.  Generate a new API key if you don't have one.
4.  **Store your API Key**: For this project, the API key should be stored as a constant in the `script.js` file.

    ```javascript
    // In script.js
    // Replace "YOUR_API_KEY_HERE" with your actual OpenWeatherMap API key.
    const API_KEY = "YOUR_API_KEY_HERE";
    ```

    **Important Security Note:** For a real-world production application, especially one involving a backend server, API keys and other sensitive credentials should **never** be hardcoded directly into client-side JavaScript. They should be stored securely, for example, as environment variables on the server, and accessed through a backend API endpoint. For this front-end only educational project, placing it as a constant in `script.js` is a simplified approach for ease of setup. Be mindful of this when working on production projects.

## Future Phases
- Phase 2: JavaScript Logic & API Integration
- Phase 3: Advanced Features & Polishing

---

*This README will be updated as the project progresses.*
