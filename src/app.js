const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// Load env vars
dotenv.config();

const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// Auth Middleware
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: missing token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: invalid token' });
    }
};

// Routes
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Server is healthy' });
});

// Google Auth Route
app.post('/api/auth/google',
    [
        body('idToken').notEmpty().withMessage('idToken is required').isString()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { idToken } = req.body;

        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            const email = payload['email'];

            if (email !== 'corpofullve@gmail.com') {
                return res.status(403).json({ status: 'error', message: 'Access denied: unauthorized email' });
            }

            // Create JWT
            const token = jwt.sign(
                { email: email, role: 'superadmin' },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '1d' }
            );

            res.status(200).json({ status: 'success', token, user: { email } });
        } catch (error) {
            console.error('Error verifying Google token:', error);
            res.status(401).json({ status: 'error', message: 'Invalid token' });
        }
    }
);

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
