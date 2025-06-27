require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors'); // Corrected: no 'new' keyword needed
const weatherRoutes = require('./routes/weather');

const app = express();
const PORT = process.env.PORT || 3001; // Default to 3001 if PORT not in .env

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies (though not strictly needed for these GET requests)

// Basic Request Logger Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/weather', weatherRoutes);

// Root route for basic testing
app.get('/', (req, res) => {
    res.send('Weather App Backend is running!');
});

// Global error handler (very basic)
app.use((err, req, res, next) => {
    console.error("Global error handler:", err.stack);
    res.status(500).send('Something broke on the server!');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!process.env.API_KEY) {
        console.warn("Warning: API_KEY is not defined in your .env file. Weather API calls will fail.");
    } else {
        console.log("API_KEY loaded successfully.");
    }
});
