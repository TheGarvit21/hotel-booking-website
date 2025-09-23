import { useEffect, useState } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { getHotelsFromStorage } from '../data/hotels';
import { getCurrentUserSync } from '../utils/auth';
import HotelCard from './HotelCard';

const VIEW_KEY_PREFIX = 'recentlyViewedView:';

const RecentlyViewed = ({ limit = 8 }) => {
    const [items, setItems] = useState([]);
    const [userId, setUserId] = useState(() => getCurrentUserSync()?.id || null);
    const [viewMode, setViewMode] = useState(() => {
        try {
            const uid = getCurrentUserSync()?.id;
            if (uid) {
                const saved = localStorage.getItem(VIEW_KEY_PREFIX + uid);
                if (saved === 'grid' || saved === 'slider') return saved;
            }
        } catch {
            // ignore localStorage access errors
        }
        return 'grid';
    }); // 'grid' | 'slider'

    useEffect(() => {
        let mounted = true;
        const load = async (uid) => {
            if (!uid) {
                if (mounted) setItems([]);
                return;
            }
            const hotels = await getHotelsFromStorage();
            const key = `recentlyViewedHotels:${uid}`;
            // One-time migration: move any global list to user-scoped key
            try {
                const legacy = JSON.parse(localStorage.getItem('recentlyViewedHotels') || '[]');
                const currentScoped = JSON.parse(localStorage.getItem(key) || '[]');
                if (Array.isArray(legacy) && legacy.length && (!Array.isArray(currentScoped) || currentScoped.length === 0)) {
                    localStorage.setItem(key, JSON.stringify(legacy.slice(0, 12)));
                    localStorage.removeItem('recentlyViewedHotels');
                }
            } catch {
                // ignore migration errors
            }
            const seen = JSON.parse(localStorage.getItem(key) || '[]');
            const mapped = seen
                .map((s) => hotels.find((h) => h.id === s.id) || s)
                .slice(0, limit);
            if (mounted) setItems(mapped);
        };

        // initial load
        load(userId);

        const onAuthChange = (e) => {
            const uid = e?.detail?.user?.id || null;
            setUserId(uid);
            load(uid);
            // restore saved view mode for this user
            try {
                if (uid) {
                    const saved = localStorage.getItem(VIEW_KEY_PREFIX + uid);
                    if (saved === 'grid' || saved === 'slider') setViewMode(saved);
                }
            } catch {
                // ignore storage errors
            }
        };
        window.addEventListener('auth:change', onAuthChange);
        return () => {
            mounted = false;
            window.removeEventListener('auth:change', onAuthChange);
        };
    }, [limit, userId]);

    // On user change, read persisted view preference
    useEffect(() => {
        try {
            if (userId) {
                const saved = localStorage.getItem(VIEW_KEY_PREFIX + userId);
                if (saved === 'grid' || saved === 'slider') setViewMode(saved);
            }
        } catch {
            // ignore storage errors
        }
    }, [userId]);

    // Persist when viewMode changes
    useEffect(() => {
        try {
            if (userId && (viewMode === 'grid' || viewMode === 'slider')) {
                localStorage.setItem(VIEW_KEY_PREFIX + userId, viewMode);
            }
        } catch {
            // ignore storage errors
        }
    }, [viewMode, userId]);

    // Hide when logged out or no items
    if (!userId || !items.length) return null;

    return (
        <section style={{ padding: '80px 0' }}>
            <div className="container">
                <div className="mb-12" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="text-left">
                        <h2 style={{ fontSize: '40px', marginBottom: '8px', fontFamily: 'Playfair Display, serif' }}>Recently Viewed</h2>
                        <p style={{ color: 'var(--text-gray)' }}>Pick up where you left off</p>
                    </div>
                    <div className="view-toggle" aria-label="View toggle" role="group" style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                            type="button"
                            aria-pressed={viewMode === 'grid'}
                            onClick={() => setViewMode('grid')}
                            className="btn btn-secondary"
                            style={{ padding: '8px 12px', fontSize: '14px', opacity: viewMode === 'grid' ? 1 : 0.8 }}
                        >
                            Grid
                        </button>
                        <button
                            type="button"
                            aria-pressed={viewMode === 'slider'}
                            onClick={() => setViewMode('slider')}
                            className="btn btn-secondary"
                            style={{ padding: '8px 12px', fontSize: '14px', opacity: viewMode === 'slider' ? 1 : 0.8 }}
                        >
                            Slider
                        </button>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    <div className="grid grid-4 grid-md-3 grid-sm-2">
                        {items.slice(0, Math.max(1, items.length)).map((hotel, idx) => (
                            <HotelCard key={hotel.id || hotel.name + idx} hotel={hotel} index={idx} />
                        ))}
                    </div>
                ) : (
                    <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        spaceBetween={24}
                        slidesPerView={1}
                        navigation
                        pagination={{ clickable: true, dynamicBullets: true }}
                        autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                        loop={items.length > 4}
                        breakpoints={{
                            640: { slidesPerView: 2, spaceBetween: 24 },
                            768: { slidesPerView: 3, spaceBetween: 28 },
                            1024: { slidesPerView: 4, spaceBetween: 32 },
                        }}
                    >
                        {items.map((hotel, idx) => (
                            <SwiperSlide key={hotel.id || hotel.name + idx}>
                                <HotelCard hotel={hotel} index={idx} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                )}
            </div>
        </section>
    );
};

export default RecentlyViewed;
