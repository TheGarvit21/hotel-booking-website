// Lightweight Redis client helper using `redis` (node-redis v4+)
// Returns a singleton connected client. Callers should `await createClient()`.

const redis = require('redis');

let client = null;
let isConnecting = false;

async function createClient() {
    // Return existing connected client
    if (client && client.isOpen) return client;
    
    // Avoid multiple simultaneous connection attempts
    if (isConnecting) {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (client && client.isOpen) {
                    clearInterval(checkInterval);
                    resolve(client);
                }
            }, 100);
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error('Redis connection timeout'));
            }, 5000);
        });
    }

    isConnecting = true;

    try {
        const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

        client = redis.createClient({ 
            url,
            socket: {
                reconnectStrategy: (retries) => {
                    // Exponential backoff: 0, 100, 200, 400, 800, ... up to 3000ms
                    const delay = Math.min(retries * 100, 3000);
                    console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${retries})`);
                    return delay;
                }
            }
        });

        client.on('error', (err) => {
            console.error('[Redis] Client Error:', err.message || err);
        });

        client.on('close', () => {
            console.log('[Redis] Connection closed');
        });

        client.on('connect', () => {
            console.log('[Redis] Connected');
        });

        await client.connect();
        console.log('[Redis] Successfully connected');
        isConnecting = false;
        return client;
    } catch (err) {
        console.error('[Redis] Failed to connect:', err.message || err);
        isConnecting = false;
        client = null;
        throw err;
    }
}

module.exports = { createClient };
