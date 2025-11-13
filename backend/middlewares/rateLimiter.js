const rateLimit = require('express-rate-limit');

const windowMs = process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : 15 * 60 * 1000;
const max = process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100;
const message = process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP, please try again later.';

const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message
});

module.exports = limiter;
