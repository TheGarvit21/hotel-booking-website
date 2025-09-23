/**
 * Safe storage helpers (no UI impact). Use existing keys to avoid breaking changes.
 */

const parseJSON = (value, fallback) => {
    try {
        return value == null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
};

/** Get JSON from localStorage or sessionStorage */
export function getJSON(key, { session = false, fallback = null } = {}) {
    const store = session ? sessionStorage : localStorage;
    return parseJSON(store.getItem(key), fallback);
}

/** Set JSON into localStorage or sessionStorage */
export function setJSON(key, value, { session = false } = {}) {
    const store = session ? sessionStorage : localStorage;
    try {
        if (value === undefined) return;
        store.setItem(key, JSON.stringify(value));
    } catch {
        // Fallback: best-effort cleanup when quota is exceeded or storage unavailable
        try {
            store.removeItem(key);
        } catch {
            // ignore
        }
    }
}

/** Remove key from both storages unless explicitly limited */
export function removeKey(key, { both = true, session = false } = {}) {
    try {
        if (both) {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
            return;
        }
        const store = session ? sessionStorage : localStorage;
        store.removeItem(key);
    } catch {
        // ignore missing storage or permission errors
    }
}
