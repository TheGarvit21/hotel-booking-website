"use client"

import { motion } from "framer-motion"
import { memo, useEffect, useRef, useState } from "react"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import HotelCard from "../components/HotelCard"
import RecentlyViewed from "../components/RecentlyViewed"
import { getFeaturedHotelsWithFallback } from "../services/hotels"

// Constants
const FEATURED_HOTEL_LIMIT = 8
const MIN_RATING = 4.5
const SWIPER_BREAKPOINTS = {
  640: { slidesPerView: 2, spaceBetween: 24 },
  768: { slidesPerView: 3, spaceBetween: 28 },
  1024: { slidesPerView: 4, spaceBetween: 32 },
}
const FEATURES = [
  {
    icon: "🏨",
    title: "Premium Hotels",
    description: "Curated selection of India's finest luxury hotels and resorts",
  },
  {
    icon: "⭐",
    title: "Verified Reviews",
    description: "Authentic reviews from real guests to help you make informed decisions",
  },
  {
    icon: "🔒",
    title: "Secure Booking",
    description: "Your personal and payment information is always protected with us",
  },
]

const Home = memo(() => {
  const [hotelsList, setHotelsList] = useState([])
  const [featuredHotels, setFeaturedHotels] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const swiperPrevRef = useRef(null)
  const swiperNextRef = useRef(null)

  useEffect(() => {
    // Fetch hotels with error handling
    const fetchHotels = async () => {
      try {
        setIsLoading(true)
        
        // Try to get featured hotels from backend first
        const featuredResult = await getFeaturedHotelsWithFallback(FEATURED_HOTEL_LIMIT)
        const featuredArr = Array.isArray(featuredResult) ? featuredResult : []
        
        // If we got featured hotels from backend, use them
        if (featuredArr.length > 0) {
          setFeaturedHotels(featuredArr.slice(0, FEATURED_HOTEL_LIMIT))
          setHotelsList(featuredArr) // Use featured hotels as the main list for now
        } else {
          // Fallback to local storage
          const { getHotelsFromStorage } = await import("../data/hotels")
          const result = await getHotelsFromStorage()
          const hotelsArr = Array.isArray(result) ? result : []
          setHotelsList(hotelsArr)

          // Filter featured hotels with rating >= 4.5
          let featured = hotelsArr.filter((hotel) => hotel.rating >= MIN_RATING)
          // Fill with top-rated hotels if needed
          if (featured.length < FEATURED_HOTEL_LIMIT) {
            const additional = hotelsArr
              .filter((hotel) => !featured.includes(hotel))
              .sort((a, b) => b.rating - a.rating)
              .slice(0, FEATURED_HOTEL_LIMIT - featured.length)
            featured = [...featured, ...additional]
          }
          setFeaturedHotels(featured.slice(0, FEATURED_HOTEL_LIMIT))
        }
      } catch {
        setError("Failed to load hotels. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchHotels()
  }, [])

  return (
    <div>
      <section className="hero" aria-labelledby="hero-title" style={{ paddingBottom: "40px" }}>
        <div className="container">
          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Discover Incredible India
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            Experience luxury hotels across India's most beautiful destinations
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <button
              onClick={() => (window.location.href = "/hotels")}
              style={{
                background: "linear-gradient(135deg, #ff6b35, #f7931e)",
                color: "#ffffff",
                border: "none",
                padding: "16px 32px",
                fontSize: "18px",
                fontWeight: "600",
                borderRadius: "50px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 8px 25px rgba(255, 107, 53, 0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)"
                e.target.style.boxShadow = "0 12px 35px rgba(255, 107, 53, 0.4)"
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)"
                e.target.style.boxShadow = "0 8px 25px rgba(255, 107, 53, 0.3)"
              }}
            >
              Explore Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Recently Viewed Section */}
      <RecentlyViewed limit={FEATURED_HOTEL_LIMIT} />

      <section
        style={{ padding: "100px 0", backgroundColor: "var(--bg-dark)" }}
        aria-labelledby="featured-hotels-title"
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2
              id="featured-hotels-title"
              style={{
                fontSize: "48px",
                marginBottom: "24px",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Featured Hotels
            </h2>
            <p style={{ color: "var(--text-gray)", fontSize: "20px", maxWidth: "600px", margin: "0 auto" }}>
              Handpicked luxury accommodations across India's most sought-after destinations
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {isLoading ? (
              <div className="text-center" style={{ padding: "60px 0" }}>
                <p style={{ color: "var(--text-gray)" }}>Loading hotels...</p>
              </div>
            ) : error ? (
              <div className="text-center" style={{ padding: "60px 0" }}>
                <h3 style={{ marginBottom: "16px" }}>Error</h3>
                <p style={{ color: "var(--text-gray)" }}>{error}</p>
              </div>
            ) : (
              <div style={{ position: "relative", padding: "0 60px" }}>
                <div
                  ref={swiperPrevRef}
                  style={{
                    position: "absolute",
                    left: "0",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "48px",
                    height: "48px",
                    background: "rgba(255, 107, 53, 0.9)",
                    color: "#ffffff",
                    borderRadius: "50%",
                    display: featuredHotels.length > 1 ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 10,
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#ff6b35"
                    e.target.style.transform = "translateY(-50%) scale(1.1)"
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 107, 53, 0.9)"
                    e.target.style.transform = "translateY(-50%) scale(1)"
                  }}
                >
                  <span style={{ fontSize: "24px" }}>←</span>
                </div>
                <div
                  ref={swiperNextRef}
                  style={{
                    position: "absolute",
                    right: "0",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "48px",
                    height: "48px",
                    background: "rgba(255, 107, 53, 0.9)",
                    color: "#ffffff",
                    borderRadius: "50%",
                    display: featuredHotels.length > 1 ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 10,
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#ff6b35"
                    e.target.style.transform = "translateY(-50%) scale(1.1)"
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 107, 53, 0.9)"
                    e.target.style.transform = "translateY(-50%) scale(1)"
                  }}
                >
                  <span style={{ fontSize: "24px" }}>→</span>
                </div>
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  spaceBetween={32}
                  slidesPerView={1}
                  navigation={{
                    prevEl: swiperPrevRef.current,
                    nextEl: swiperNextRef.current,
                  }}
                  pagination={{
                    clickable: true,
                    dynamicBullets: true,
                  }}
                  autoplay={{
                    delay: 4000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }}
                  loop={featuredHotels.length > 4}
                  breakpoints={SWIPER_BREAKPOINTS}
                  className="featured-hotels-swiper"
                  role="region"
                  aria-label="Featured Hotels Carousel"
                  onBeforeInit={(swiper) => {
                    swiper.params.navigation.prevEl = swiperPrevRef.current
                    swiper.params.navigation.nextEl = swiperNextRef.current
                  }}
                >
                  {featuredHotels.length > 0 ? (
                    featuredHotels.map((hotel, index) => (
                      <SwiperSlide key={hotel.id}>
                        <HotelCard hotel={hotel} index={index} />
                      </SwiperSlide>
                    ))
                  ) : (
                    <div className="text-center" style={{ padding: "60px 0" }}>
                      <h3 style={{ marginBottom: "16px" }}>No featured hotels found</h3>
                      <p style={{ color: "var(--text-gray)" }}>
                        {hotelsList.length > 0 ? "Try again later or adjust your filters." : "No hotels available yet."}
                      </p>
                    </div>
                  )}
                </Swiper>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section style={{ padding: "100px 0", backgroundColor: "var(--bg-card)" }} aria-labelledby="why-choose-title">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2
              id="why-choose-title"
              style={{
                fontSize: "48px",
                marginBottom: "24px",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Why Choose LuxStay?
            </h2>
          </motion.div>

          <div className="grid grid-3" role="list">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card text-center"
                role="listitem"
              >
                <div style={{ fontSize: "64px", marginBottom: "24px" }} aria-hidden="true">
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: "28px",
                    marginBottom: "16px",
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ color: "var(--text-gray)", fontSize: "16px", lineHeight: "1.6" }}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
})

export default Home
