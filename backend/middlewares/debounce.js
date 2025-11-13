module.exports = function debounceHandler(handler, wait = 300, keyFn) {
    const map = new Map();
    return (req, res, next) => {
        const key = typeof keyFn === 'function' ? keyFn(req) : (req.userId ? `${req.userId}:${req.originalUrl}` : `${req.ip}:${req.originalUrl}`);
        const prev = map.get(key);
        if (prev) {
            clearTimeout(prev.timer);
            try {
                if (!prev.stored.res.headersSent) prev.stored.res.status(204).end();
            } catch (e) { }
        }

        const stored = { req, res, next };
        const timer = setTimeout(async () => {
            map.delete(key);
            try {
                await Promise.resolve(handler(stored.req, stored.res, stored.next));
            } catch (err) {
                try { if (!stored.res.headersSent) stored.res.status(500).json({ error: { message: 'Server error' } }); } catch (e) { }
            }
        }, wait);

        map.set(key, { timer, stored });
    };
};
