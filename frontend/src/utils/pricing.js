/**
 * Pricing utilities: pure functions for consistent price calculations.
 */

/**
 * Calculate price breakdown.
 * @param {number} nightly - price per night (INR)
 * @param {string} checkIn - YYYY-MM-DD
 * @param {string} checkOut - YYYY-MM-DD
 * @param {object} opts - options { serviceRate=0.10, taxRate=0.12, coupon=null }
 * @returns {{ nights:number, base:number, service:number, taxes:number, discount:number, total:number }}
 */
export function calcPrice(nightly, checkIn, checkOut, opts = {}) {
    const { serviceRate = 0.10, taxRate = 0.12, coupon = null } = opts;
    if (!nightly || !checkIn || !checkOut) return zero();
    const ci = new Date(checkIn + 'T00:00:00');
    const co = new Date(checkOut + 'T00:00:00');
    const nights = Math.max(0, Math.ceil((co - ci) / (1000 * 60 * 60 * 24)));
    if (nights <= 0) return zero();
    const base = nights * nightly;
    const preDiscount = base;
    const discount = coupon?.type === 'percent' ? Math.round(preDiscount * (coupon.value / 100))
        : coupon?.type === 'flat' ? Math.min(preDiscount, coupon.value)
            : 0;
    const discountedBase = Math.max(0, preDiscount - discount);
    const service = Math.round(discountedBase * serviceRate);
    const taxes = Math.round(discountedBase * taxRate);
    const total = discountedBase + service + taxes;
    return { nights, base: discountedBase, service, taxes, discount, total };
}

function zero() {
    return { nights: 0, base: 0, service: 0, taxes: 0, discount: 0, total: 0 };
}
