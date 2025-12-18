const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const windowMs = config.rateLimitWindowMs || 15 * 60 * 1000;
const max = config.rateLimitMax || 100;
const message = config.rateLimitMessage || 'Too many requests from this IP, please try again later.';

const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message
});

module.exports = limiter;
