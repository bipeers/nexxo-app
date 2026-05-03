const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');

// Load env vars
dotenv.config();

const app = express();

// Security Middlewares
// 1. Set Security HTTP headers
app.use(helmet());

// 2. Rate limiting
// Limit each IP to 100 requests per windowMs (10 minutes)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 10 minutes'
});
app.use('/api', limiter);

// 3. Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 5. Prevent parameter pollution
app.use(hpp());

// 6. Enable CORS
// Configure this according to your specific frontend URL in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : '*',
    credentials: true
};
app.use(cors(corsOptions));

// Routes
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Server is healthy' });
});

// Example route with explicit input validation
app.post('/api/data',
    // Validation chain - targeted validation and sanitization
    [
        body('data')
            .notEmpty().withMessage('Data is required')
            .isString().withMessage('Data must be a string')
            .trim()
            .escape() // HTML escaping as an extra layer
    ],
    (req, res) => {
        // Check validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { data } = req.body;

        // Process data...
        res.status(200).json({ status: 'success', received: data });
    }
);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});

module.exports = app;
