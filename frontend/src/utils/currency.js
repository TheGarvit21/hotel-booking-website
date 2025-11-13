// ---------------- CONFIG ----------------
const DEFAULT_RATES = { INR: 1 };
const SUPPORTED_CODES = ['INR', 'USD', 'EUR', 'GBP'];

const SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const LOCALES = { USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };
const CURRENCY_CODES = { USD: 'USD', EUR: 'EUR', GBP: 'GBP' };

const STORAGE_KEY = 'currencyPref';
const RATES_STORAGE_KEY = 'currencyRatesINR';

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_STALE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Toggle to force using manual/local fallbacks only (no network calls)
const FORCE_FALLBACK_RATES = true;

const RATE_PROVIDERS = [
    'https://api.exchangerate.host/latest?base=INR&symbols=USD,EUR,GBP,INR',
    'https://api.frankfurter.app/latest?from=INR&to=USD,EUR,GBP',
    'https://open.er-api.com/v6/latest/INR'
];

// Manual emergency fallback when backend and all providers are unavailable.
// Store rates as TARGET per 1 INR (i.e., USD-per-INR), since we convert INR -> target via multiplication.
// User provided: 1 USD = 87.65 INR, so USD-per-INR = 1 / 87.65
const MANUAL_FALLBACK_RATES_PER_INR = {
    USD: 1 / 87.65,
    EUR: 1 / 102.31,
    // Leave EUR/GBP undefined to avoid making up values; they'll use last-known or default.
};

// ---------------- CACHE ----------------
let cache = { ts: 0, rates: DEFAULT_RATES };
let fetchLock = null; // Prevent concurrent fetches

// ---------------- HELPERS ----------------
function safeJSONParse(str) {
    try { return JSON.parse(str); } catch { return null; }
}

function saveRates(rates) {
    try {
        localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify({ ts: Date.now(), rates }));
    } catch (err) {
        // Failed to save rates
    }
}

function loadRates() {
    const parsed = safeJSONParse(localStorage.getItem(RATES_STORAGE_KEY));
    if (parsed && parsed.ts && parsed.rates) return parsed;
    return null;
}

async function fetchFrom(url, fetchFn) {
    const res = await fetchFn(url);
    if (!res.ok) throw new Error(`Fetch failed from ${url}`);
    return res.json();
}

function normalizeRates(data) {
    if (!data || !data.rates) return null;
    const { USD, EUR, GBP } = data.rates;
    if ([USD, EUR, GBP].some(v => typeof v !== 'number')) return null;
    return { INR: 1, USD, EUR, GBP };
}

// ---------------- PUBLIC API ----------------
export function getCurrencyPref() {
    const saved = safeJSONParse(localStorage.getItem(STORAGE_KEY));
    return saved || { code: 'INR', symbol: SYMBOLS.INR };
}

export function setCurrencyPref(code) {
    const pref = { code, symbol: SYMBOLS[code] || code };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
    } catch (err) {
        // Failed to set currency preference
    }
    return pref;
}

async function fetchRates(fetchFn = fetch) {
    const now = Date.now();

    // Short-circuit to manual/local fallback when enabled
    if (FORCE_FALLBACK_RATES) {
        const fallback = { ...DEFAULT_RATES, ...MANUAL_FALLBACK_RATES_PER_INR };
        cache = { ts: now, rates: fallback };
        saveRates(cache.rates);
        return cache.rates;
    }

    // Prevent multiple simultaneous fetches
    if (fetchLock) return fetchLock;

    fetchLock = (async () => {
        // 1) Backend
        try {
            const res = await fetchFn('/api/currency/rates', { credentials: 'include' });
            if (res.ok) {
                const rates = await res.json();
                cache = { ts: now, rates: { ...DEFAULT_RATES, ...rates } };
                saveRates(cache.rates);
                return cache.rates;
            }
        } catch (err) {
            // Backend fetch failed
        }

        // 2) Public providers
        for (const url of RATE_PROVIDERS) {
            try {
                const data = await fetchFrom(url, fetchFn);
                const normalized = normalizeRates(data);
                if (normalized) {
                    cache = { ts: now, rates: { ...DEFAULT_RATES, ...normalized } };
                    saveRates(cache.rates);
                    return cache.rates;
                }
            } catch (err) {
                // Provider fetch failed
            }
        }

        // 3) Storage fallback
        const stored = loadRates();
        if (stored && now - stored.ts < MAX_STALE_MS) {
            cache = stored;
            return cache.rates;
        }

        // 4) Absolute last-resort manual fallback (per-INR rates)
        if (Object.keys(MANUAL_FALLBACK_RATES_PER_INR).length > 0) {
            const fallback = { ...DEFAULT_RATES, ...MANUAL_FALLBACK_RATES_PER_INR };
            cache = { ts: now, rates: fallback };
            saveRates(cache.rates);
            logDebug('Using manual fallback FX rates');
            return cache.rates;
        }

        logDebug('Returning last known cache rates');
        return cache.rates;
    })();

    const result = await fetchLock;
    fetchLock = null;
    return result;
}

export async function getRates(fetchFn = fetch) {
    const now = Date.now();
    if (now - cache.ts < TTL_MS && cache.rates) return cache.rates;
    return fetchRates(fetchFn);
}

export async function convertINR(amountInINR, targetCode, fetchFn = fetch) {
    if (!targetCode || !SUPPORTED_CODES.includes(targetCode)) {
        logDebug('Invalid target currency code:', targetCode);
        return amountInINR || 0;
    }

    let rates = await getRates(fetchFn);
    if (!rates[targetCode]) {
        rates = await fetchRates(fetchFn);
    }

    const rate = rates[targetCode];
    const amount = amountInINR || 0;

    if (typeof rate !== 'number' || rate <= 0) {
        logDebug('Invalid exchange rate for', targetCode, ':', rate);
        return amount; // Fallback to original amount
    }

    return amount * rate;
}

export async function formatPriceINR(amountInINR, currencyCode, fetchFn = fetch) {
    try {
        const pref = getCurrencyPref();
        const code = currencyCode || pref.code;

        if (code === 'INR') {
            const amount = amountInINR || 0;
            return `${SYMBOLS.INR}${amount.toLocaleString('en-IN')}`;
        }

        const value = await convertINR(amountInINR, code, fetchFn);
        return new Intl.NumberFormat(
            LOCALES[code] || 'en-US',
            {
                style: 'currency',
                currency: CURRENCY_CODES[code] || 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(value);
    } catch (error) {
        logDebug('Error formatting price:', error);
        // Fallback to INR formatting
        const amount = amountInINR || 0;
        return `${SYMBOLS.INR}${amount.toLocaleString('en-IN')}`;
    }
}

export async function prefetchLatestRates(fetchFn = fetch) {
    await fetchRates(fetchFn);
}
