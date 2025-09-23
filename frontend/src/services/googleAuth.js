// Google OAuth helpers (frontend-only demo; verify ID token on backend in production)

const GIS_SRC = 'https://accounts.google.com/gsi/client';

export function loadGoogleIdentity(timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) return resolve(window.google);
        const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
        if (existing) {
            const t = setInterval(() => {
                if (window.google?.accounts?.id) {
                    clearInterval(t);
                    resolve(window.google);
                }
            }, 50);
            setTimeout(() => {
                clearInterval(t);
                window.google ? resolve(window.google) : reject(new Error('Google Identity not available'));
            }, timeoutMs);
            return;
        }
        const s = document.createElement('script');
        s.src = GIS_SRC;
        s.async = true;
        s.defer = true;
        s.onload = () => resolve(window.google);
        s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(s);
        setTimeout(() => {
            if (!window.google) reject(new Error('Google Identity load timeout'));
        }, timeoutMs);
    });
}

export function parseJwt(idToken) {
    try {
        const base64 = idToken.split('.')[1];
        const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
        return null;
    }
}

/**
 * Trigger Google One Tap / popup flow and return basic profile from the ID token (unverified on client).
 * For production, send credential to backend for verification and session creation.
 */
export async function signInWithGoogle(clientId) {
    const isDev = import.meta.env.DEV;
    if (!clientId) {
        if (isDev) return { id: 'dev-google-user', name: 'Dev Google User', email: 'dev.user@example.com', picture: '' };
        throw new Error('Missing Google Client ID');
    }
    const google = await loadGoogleIdentity();
    return new Promise((resolve, reject) => {
        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => {
                    const credential = response?.credential;
                    if (!credential) return reject(new Error('No Google credential'));
                    const payload = parseJwt(credential) || {};
                    // Client-only identity (NOT verified). Store minimally for demo UX.
                    resolve({
                        id: payload.sub || 'google-user',
                        name: payload.name || payload.given_name || 'Google User',
                        email: (payload.email || '').toLowerCase(),
                        picture: payload.picture || ''
                    });
                },
                auto_select: false,
                ux_mode: 'popup'
            });
            google.accounts.id.prompt();
        } catch (e) {
            if (isDev) {
                resolve({ id: 'dev-google-user', name: 'Dev Google User', email: 'dev.user@example.com', picture: '' });
            } else {
                reject(e);
            }
        }
    });
}
