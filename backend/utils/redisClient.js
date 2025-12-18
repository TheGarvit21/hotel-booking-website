// Lightweight Redis client helper using `redis` (node-redis v4+)
// Returns a singleton connected client. Callers should `await createClient()`.

const redis = require('redis');
const config = require('../config/config');

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
        const url = config.redisUrl || 'redis://127.0.0.1:6379';

        const socketOptions = {
            reconnectStrategy: (retries) => {
                if (retries > 5) {
                    console.error('[Redis] Max retries exceeded. Stopping reconnection.');
                    return new Error('Max retries exceeded');
                }
                const delay = Math.min(retries * 100, 3000);
                console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${retries})`);
                return delay;
            }
        };

        // Explicitly enable TLS if using rediss://
        if (url.startsWith('rediss://')) {
            socketOptions.tls = true;
            // socketOptions.rejectUnauthorized = false; // Uncomment if needed for self-signed certs
        }

        client = redis.createClient({
            url,
            socket: socketOptions
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
