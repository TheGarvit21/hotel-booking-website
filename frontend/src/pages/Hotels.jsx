"use client"

import { motion } from "framer-motion"
import { gsap } from "gsap"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import { Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import CustomCalendar from "../components/CustomCalendar"
import CustomDropdown from "../components/CustomDropdown"
import HotelCard from "../components/HotelCard"
import { getHotelsWithFallback, searchHotels as searchHotelsAPI } from "../services/hotels"
import { getCurrentUserSync } from "../utils/auth"
import { getCurrencyPref } from "../utils/currency"

// Constants
const VIEW_KEY_PREFIX = "hotelsView:"
const SORT_KEY = "hotelsSortPref"
const DEFAULT_FILTERS = {
  minPrice: 0,
  maxPrice: 0,
  minRating: 0,
  location: "",
  city: "",
}
const CITY_MAP = {
  mumbai: "Mumbai",
  delhi: "New Delhi",
  bangalore: "Bangalore",
  chennai: "Chennai",
  hyderabad: "Hyderabad",
  kolkata: "Kolkata",
  pune: "Pune",
  jaipur: "Jaipur",
  goa: "Goa",
  ahmedabad: "Ahmedabad",
  kerala: "Kerala",
}

// Helper function
const normalizeCity = (cityParam) => {
  if (!cityParam) return ""
  const key = cityParam.trim().toLowerCase()
  return CITY_MAP[key] || cityParam
}

// Area to City mapping
const areaToCity = {
  "karol bagh": "New Delhi",
  "connaught place": "New Delhi",
  chanakyapuri: "New Delhi",
  "diplomatic enclave": "New Delhi",
  "man singh road": "New Delhi",
  "lodhi gardens": "New Delhi",
  "bhikaji cama place": "New Delhi",
  aerocity: "New Delhi",
  paharganj: "New Delhi",
  cp: "New Delhi",
  dlf: "New Delhi",
  gurgaon: "New Delhi",
  noida: "New Delhi",
  bandra: "Mumbai",
  andheri: "Mumbai",
  juhu: "Mumbai",
  powai: "Mumbai",
  worli: "Mumbai",
  colaba: "Mumbai",
  "marine drive mumbai": "Mumbai",
  "lower parel": "Mumbai",
  bkc: "Mumbai",
  "bandra kurla complex": "Mumbai",
  "nariman point": "Mumbai",
  fort: "Mumbai",
  churchgate: "Mumbai",
  dadar: "Mumbai",
  khar: "Mumbai",
  "santa cruz": "Mumbai",
  "vile parle": "Mumbai",
  goregaon: "Mumbai",
  malad: "Mumbai",
  kandivali: "Mumbai",
  whitefield: "Bangalore",
  koramangala: "Bangalore",
  indiranagar: "Bangalore",
  "mg road": "Bangalore",
  "brigade road": "Bangalore",
  "electronic city": "Bangalore",
  hebbal: "Bangalore",
  jayanagar: "Bangalore",
  "btm layout": "Bangalore",
  "jp nagar": "Bangalore",
  marathahalli: "Bangalore",
  sarjapur: "Bangalore",
  bellandur: "Bangalore",
  "hsr layout": "Bangalore",
  rajajinagar: "Bangalore",
  malleshwaram: "Bangalore",
  ulsoor: "Bangalore",
  "t nagar": "Chennai",
  adyar: "Chennai",
  velachery: "Chennai",
  omr: "Chennai",
  "old mahabalipuram road": "Chennai",
  "anna nagar": "Chennai",
  nungambakkam: "Chennai",
  egmore: "Chennai",
  mylapore: "Chennai",
  "besant nagar": "Chennai",
  guindy: "Chennai",
  porur: "Chennai",
  tambaram: "Chennai",
  chrompet: "Chennai",
  "hitech city": "Hyderabad",
  gachibowli: "Hyderabad",
  "jubilee hills": "Hyderabad",
  "banjara hills": "Hyderabad",
  secunderabad: "Hyderabad",
  kondapur: "Hyderabad",
  madhapur: "Hyderabad",
  kukatpally: "Hyderabad",
  ameerpet: "Hyderabad",
  begumpet: "Hyderabad",
  somajiguda: "Hyderabad",
  abids: "Hyderabad",
  "park street": "Kolkata",
  "salt lake": "Kolkata",
  ballygunge: "Kolkata",
  alipore: "Kolkata",
  howrah: "Kolkata",
  "new town": "Kolkata",
  rajarhat: "Kolkata",
  "sector v": "Kolkata",
  gariahat: "Kolkata",
  esplanade: "Kolkata",
  sealdah: "Kolkata",
  "koregaon park": "Pune",
  hinjewadi: "Pune",
  baner: "Pune",
  wakad: "Pune",
  "viman nagar": "Pune",
  kharadi: "Pune",
  magarpatta: "Pune",
  hadapsar: "Pune",
  aundh: "Pune",
  "shivaji nagar": "Pune",
  camp: "Pune",
  "pune station": "Pune",
  "calangute beach": "Goa",
  "baga beach": "Goa",
  "candolim beach": "Goa",
  "anjuna beach": "Goa",
  "vagator beach": "Goa",
  panaji: "Goa",
  margao: "Goa",
  "colva beach": "Goa",
  "benaulim beach": "Goa",
  "cavelossim beach": "Goa",
  "bambolim beach": "Goa",
  "arossim beach": "Goa",
  "majorda beach": "Goa",
  "sinquerim beach": "Goa",
  "city palace": "Jaipur",
  "amber fort": "Jaipur",
  "mi road": "Jaipur",
  "c scheme": "Jaipur",
  "malviya nagar": "Jaipur",
  "vaishali nagar": "Jaipur",
  mansarovar: "Jaipur",
  "tonk road": "Jaipur",
  airport: "Jaipur",
  sanganer: "Jaipur",
  gandhinagar: "Ahmedabad",
  ellisbridge: "Ahmedabad",
  vastrapur: "Ahmedabad",
  paldi: "Ahmedabad",
  "sg highway": "Ahmedabad",
  thaltej: "Ahmedabad",
  navrangpura: "Ahmedabad",
  satellite: "Ahmedabad",
  vejalpur: "Ahmedabad",
  "cg road": "Ahmedabad",
  "law garden": "Ahmedabad",
  "fort kochi": "Kerala",
  "marine drive kerala": "Kerala",
  munnar: "Kerala",
  alleppey: "Kerala",
  kumarakom: "Kerala",
  thekkady: "Kerala",
  kovalam: "Kerala",
  varkala: "Kerala",
  wayanad: "Kerala",
  backwaters: "Kerala",
}

// Function to get reasonable placeholder prices for each currency
const getPlaceholderPrices = (currencyCode) => {
  const placeholders = {
    INR: { min: "3500", max: "20000" },
    USD: { min: "40", max: "230" },
    EUR: { min: "35", max: "200" },
    GBP: { min: "30", max: "170" },
  }
  return placeholders[currencyCode] || placeholders.INR
}

const Hotels = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { city: routeCity } = useParams()
  const [hotels, setHotels] = useState([])
  const [filteredHotels, setFilteredHotels] = useState([])
  const [sortBy, setSortBy] = useState(() => {
    try {
      return localStorage.getItem(SORT_KEY) || "relevance"
    } catch (error) {
      console.error("Error reading sort preference:", error)
      return "relevance"
    }
  })
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    city: normalizeCity(routeCity || searchParams.get("city") || ""),
    location: searchParams.get("location") || "",
  }))
  const [userId, setUserId] = useState(() => getCurrentUserSync()?.id || null)
  const [viewMode, setViewMode] = useState(() => {
    try {
      const uid = getCurrentUserSync()?.id
      if (uid) {
        const saved = localStorage.getItem(VIEW_KEY_PREFIX + uid)
        return saved === "grid" || saved === "slider" ? saved : "grid"
      }
    } catch (error) {
      console.error("Error reading view preference:", error)
    }
    return "grid"
  })
  const [searchState, setSearchState] = useState(() => {
    const guestsParam = searchParams.get("guests")
    const guests = guestsParam ? Number.parseInt(guestsParam, 10) : 1
    return {
      checkIn: searchParams.get("checkIn") || "",
      checkOut: searchParams.get("checkOut") || "",
      guests: Number.isNaN(guests) ? 1 : guests,
    }
  })
  const [activeCalendar, setActiveCalendar] = useState(null)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [currentCurrency, setCurrentCurrency] = useState(() => getCurrencyPref())
  const [placeholderPrices, setPlaceholderPrices] = useState(() => {
    const currency = getCurrencyPref()
    return getPlaceholderPrices(currency.code)
  })

  // Autocomplete state
  const [areaSuggestions, setAreaSuggestions] = useState([])
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [areaInputFocused, setAreaInputFocused] = useState(false)

  const filtersRef = useRef(null)
  const swiperPrevRef = useRef(null)
  const swiperNextRef = useRef(null)

  // Helper Functions
  const availableCities = [...new Set(hotels.map((hotel) => hotel.city))].sort()
  const cityHotelCounts = availableCities.reduce((acc, city) => {
    acc[city] = hotels.filter((hotel) => hotel.city === city).length
    return acc
  }, {})

  const applySort = (list, sort) => {
    const arr = [...(Array.isArray(list) ? list : [])]
    switch (sort) {
      case "price-asc":
        return arr.sort((a, b) => a.price - b.price)
      case "price-desc":
        return arr.sort((a, b) => b.price - a.price)
      case "rating-desc":
        return arr.sort((a, b) => b.rating - a.rating)
      default:
        return arr
    }
  }

  // Data Fetching
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        // Build filters for API call
        const apiFilters = {}
        if (filters.city) apiFilters.city = filters.city
        if (filters.minPrice > 0) apiFilters.minPrice = filters.minPrice
        if (filters.maxPrice > 0) apiFilters.maxPrice = filters.maxPrice
        if (filters.minRating > 0) apiFilters.minRating = filters.minRating

        const allHotelsRaw = await getHotelsWithFallback(apiFilters)
        const allHotels = Array.isArray(allHotelsRaw) ? allHotelsRaw : []
        setHotels(allHotels)

        let searchResults = allHotels
        if (filters.location) {
          try {
            const searchResultsRaw = await searchHotelsAPI(filters.location, filters.city)
            searchResults = Array.isArray(searchResultsRaw?.data) ? searchResultsRaw.data : []
          } catch (searchError) {
            console.warn("API search failed, using local search:", searchError)
            // Fallback to local search
            const { searchHotels: localSearch } = await import("../data/hotels")
            const localResults = await localSearch(filters.location)
            searchResults = Array.isArray(localResults) ? localResults : []
          }
        }

        setFilteredHotels(applySort(searchResults, sortBy))
      } catch (error) {
        console.error("Error fetching hotels:", error)
        setFilteredHotels([])
      }
    }
    fetchHotels()
  }, [filters.location, filters.city, filters.minPrice, filters.maxPrice, filters.minRating, sortBy])

  // Filter Animation
  useEffect(() => {
    if (filtersRef.current) {
      gsap.fromTo(filtersRef.current, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
    }
  }, [])

  // Auth Change Handler
  useEffect(() => {
    const onAuthChange = (e) => {
      const uid = e?.detail?.user?.id || null
      setUserId(uid)
      try {
        const saved = uid ? localStorage.getItem(VIEW_KEY_PREFIX + uid) : null
        setViewMode(saved === "grid" || saved === "slider" ? saved : "grid")
      } catch (error) {
        console.error("Error handling auth change:", error)
        setViewMode("grid")
      }
    }
    window.addEventListener("auth:change", onAuthChange)
    return () => window.removeEventListener("auth:change", onAuthChange)
  }, [])

  // Persist View Mode
  useEffect(() => {
    try {
      if (userId && (viewMode === "grid" || viewMode === "slider")) {
        localStorage.setItem(VIEW_KEY_PREFIX + userId, viewMode)
      }
    } catch (error) {
      console.error("Error saving view mode:", error)
    }
  }, [viewMode, userId])

  // Price Formatting
  useEffect(() => {
    let mounted = true
    const updatePrices = async () => {
      try {
        const newCurrency = getCurrencyPref()
        if (mounted) {
          setCurrentCurrency(newCurrency)
          setPlaceholderPrices(getPlaceholderPrices(newCurrency.code))
        }
      } catch (error) {
        console.error("Error updating currency:", error)
      }
    }
    updatePrices()
    const onCurrency = () => {
      updatePrices()
    }
    window.addEventListener("currency:change", onCurrency)
    return () => {
      mounted = false
      window.removeEventListener("currency:change", onCurrency)
    }
  }, [])

  // Hotel Filtering - This is now handled in the main fetchHotels effect above
  // Keeping this for any additional client-side filtering if needed
  useEffect(() => {
    const filterHotels = async () => {
      try {
        let filtered = hotels
        
        // Apply additional client-side filters if needed
        filtered = filtered.filter((hotel) => {
          const matchesMinPrice = filters.minPrice === 0 || hotel.price >= filters.minPrice
          const matchesMaxPrice = filters.maxPrice === 0 || hotel.price <= filters.maxPrice
          const matchesPrice = matchesMinPrice && matchesMaxPrice
          const matchesRating = hotel.rating >= filters.minRating || filters.minRating === 0
          return matchesPrice && matchesRating
        })
        
        setFilteredHotels(applySort(filtered, sortBy))
      } catch (error) {
        console.error("Error filtering hotels:", error)
        setFilteredHotels([])
      }
    }
    filterHotels()
  }, [hotels, sortBy])

  // Scroll to Top
  // useEffect(() => {
  //   window.scrollTo({ top: 0, behavior: "smooth" })
  // }, [filters, searchParams, routeCity])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [searchParams, routeCity])

  // Event Handlers
  const getAreaSuggestions = (input) => {
    if (!input || input.length < 1) {
      return []
    }
    const searchTerm = input.toLowerCase().trim()
    const suggestions = []
    const seenAreas = new Set()

    const allAreas = [...new Set(hotels.map((hotel) => hotel.landmark).filter((landmark) => landmark))]
    const mappingAreas = Object.keys(areaToCity)
    const combinedAreas = [...new Set([...allAreas, ...mappingAreas])]

    const selectedCity = filters.city

    combinedAreas.forEach((area) => {
      const areaLower = area.toLowerCase()
      if (areaLower.includes(searchTerm) && !seenAreas.has(areaLower)) {
        const cityMatch = areaToCity[areaLower] || hotels.find((h) => h.landmark?.toLowerCase() === areaLower)?.city

        if (!selectedCity || cityMatch === selectedCity) {
          seenAreas.add(areaLower)
          suggestions.push({
            area: area,
            city: cityMatch || "",
            displayText: cityMatch ? `${area}, ${cityMatch}` : area,
          })
        }
      }
    })

    return suggestions
      .sort((a, b) => {
        const aStartsWith = a.area.toLowerCase().startsWith(searchTerm)
        const bStartsWith = b.area.toLowerCase().startsWith(searchTerm)
        if (aStartsWith && !bStartsWith) return -1
        if (!aStartsWith && bStartsWith) return 1
        return a.area.localeCompare(b.area)
      })
      .slice(0, 6)
  }

  const handleAreaInputChange = (e) => {
    const value = e.target.value
    setFilters((prev) => ({ ...prev, location: value }))
    const suggestions = getAreaSuggestions(value)
    setAreaSuggestions(suggestions)
    setShowAreaSuggestions(suggestions.length > 0)
    setSelectedSuggestionIndex(-1)
  }

  const selectAreaSuggestion = (suggestion) => {
    setFilters((prev) => ({
      ...prev,
      location: suggestion.area,
      city: suggestion.city || prev.city,
    }))
    setShowAreaSuggestions(false)
    setAreaSuggestions([])
    setSelectedSuggestionIndex(-1)
  }

  const handleAreaKeyDown = (e) => {
    if (!showAreaSuggestions || areaSuggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedSuggestionIndex((prev) => (prev < areaSuggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : areaSuggestions.length - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedSuggestionIndex >= 0) {
        selectAreaSuggestion(areaSuggestions[selectedSuggestionIndex])
      }
    } else if (e.key === "Escape") {
      setShowAreaSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target

    if (name === "location") {
      handleAreaInputChange(e)
      return
    }

    setValidationError("")

    if (!name.includes("Price") && !name.includes("Rating")) {
      setFilters((prev) => ({ ...prev, [name]: value }))
      return
    }

    const numValue = Number.parseFloat(value)
    if (value === "" || value === null || value === undefined) {
      setFilters((prev) => ({ ...prev, [name]: 0 }))
      return
    }

    if (isNaN(numValue)) {
      setValidationError("Please enter a valid number")
      return
    }

    if (name.includes("Price")) {
      if (numValue < 0) {
        setValidationError("Price cannot be negative")
        return
      }
      const maxLimits = {
        INR: 25000,
        USD: 300,
        EUR: 250,
        GBP: 220,
      }
      const maxLimit = maxLimits[currentCurrency.code] || 25000
      if (numValue > maxLimit) {
        setValidationError(`Price cannot exceed ${currentCurrency.symbol}${maxLimit.toLocaleString()}`)
        return
      }
    }

    if (name.includes("Rating")) {
      if (numValue < 0 || numValue > 5) {
        setValidationError("Rating must be between 0 and 5")
        return
      }
    }

    if (name === "minPrice" && filters.maxPrice > 0 && numValue > filters.maxPrice) {
      setValidationError("Minimum price cannot be higher than maximum price")
      return
    }

    setFilters((prev) => ({ ...prev, [name]: numValue }))
  }

  const clearPriceRange = () => {
    setFilters((prev) => ({ ...prev, minPrice: 0, maxPrice: 0 }))
    setValidationError("")
  }

  const validatePriceRelationship = (e) => {
    const { name, value } = e.target
    if (name === "maxPrice" && value) {
      const numValue = Number.parseFloat(value)
      if (!isNaN(numValue) && filters.minPrice > 0 && numValue < filters.minPrice) {
        setValidationError("Maximum price cannot be lower than minimum price")
      } else {
        setValidationError("")
      }
    }
  }

  const handleDateSelect = (field, date) => {
    setSearchState((prev) => ({ ...prev, [field]: date }))
    setActiveCalendar(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const cityOptions = [
    { value: "", label: "All Cities", description: "Show hotels from all cities", icon: "🌍" },
    ...availableCities.map((city) => ({
      value: city,
      label: city,
      description: `${cityHotelCounts[city]} hotel${cityHotelCounts[city] !== 1 ? "s" : ""} available`,
      icon: "🏙️",
    })),
  ]

  const guestOptions = [
    { value: 1, label: "1 Guest", description: "Single occupancy", icon: "👤" },
    { value: 2, label: "2 Guests", description: "Double occupancy", icon: "👥" },
    { value: 3, label: "3 Guests", description: "Triple occupancy", icon: "👨‍👩‍👦" },
    { value: 4, label: "4 Guests", description: "Family of four", icon: "👨‍👩‍👧‍👦" },
    { value: 5, label: "5 Guests", description: "Large family", icon: "👨‍👩‍👧‍👧‍👦" },
    { value: 6, label: "6 Guests", description: "Group booking", icon: "👥👥👥" },
    { value: 7, label: "6+ Guests", description: "Large group booking", icon: "👥👥" },
  ]

  const sortOptions = [
    { value: "relevance", label: "Relevance", description: "Best match for your search", icon: "🎯" },
    { value: "price-asc", label: "Price: Low to High", description: "Most affordable first", icon: "💰" },
    { value: "price-desc", label: "Price: High to Low", description: "Most expensive first", icon: "💎" },
    { value: "rating-desc", label: "Rating: High to Low", description: "Highest rated first", icon: "⭐" },
  ]

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setValidationError("")
  }

  return (
    <div style={{ padding: "40px 0", minHeight: "100vh", background: "#111827" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 20px" }}>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ position: "relative", zIndex: 10 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <h1
              style={{
                fontSize: "48px",
                fontFamily: "Playfair Display, serif",
                margin: 0,
                color: "#fff",
                fontWeight: "700",
                letterSpacing: "1px",
              }}
            >
              Find Your Perfect Stay
            </h1>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={resetFilters}
                style={{
                  padding: "14px 28px",
                  fontSize: "14px",
                  fontWeight: "700",
                  borderRadius: "25px",
                  border: "none",
                  background: "#20c997",
                  color: "#fff",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(32, 201, 151, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#1bb584"
                  e.target.style.transform = "translateY(-2px)"
                  e.target.style.boxShadow = "0 6px 20px rgba(32, 201, 151, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#20c997"
                  e.target.style.transform = "translateY(0)"
                  e.target.style.boxShadow = "0 4px 15px rgba(32, 201, 151, 0.3)"
                }}
              >
                RESET FILTERS
              </button>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  padding: "14px 28px",
                  fontSize: "14px",
                  fontWeight: "700",
                  borderRadius: "25px",
                  border: "none",
                  background: viewMode === "grid" ? "#ff6b4a" : "#fd7e14",
                  color: "#fff",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  transition: "all 0.3s ease",
                  boxShadow:
                    viewMode === "grid" ? "0 4px 15px rgba(255, 107, 74, 0.4)" : "0 4px 15px rgba(253, 126, 20, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)"
                  e.target.style.boxShadow = "0 6px 20px rgba(255, 107, 74, 0.5)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)"
                  e.target.style.boxShadow =
                    viewMode === "grid" ? "0 4px 15px rgba(255, 107, 74, 0.4)" : "0 4px 15px rgba(253, 126, 20, 0.3)"
                }}
              >
                GRID VIEW
              </button>
              <button
                onClick={() => setViewMode("slider")}
                style={{
                  padding: "14px 28px",
                  fontSize: "14px",
                  fontWeight: "700",
                  borderRadius: "25px",
                  border: "none",
                  background: viewMode === "slider" ? "#ffc107" : "#ffcd39",
                  color: viewMode === "slider" ? "#000" : "#333",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  transition: "all 0.3s ease",
                  boxShadow:
                    viewMode === "slider" ? "0 4px 15px rgba(255, 193, 7, 0.4)" : "0 4px 15px rgba(255, 205, 57, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)"
                  e.target.style.boxShadow = "0 6px 20px rgba(255, 193, 7, 0.5)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)"
                  e.target.style.boxShadow =
                    viewMode === "slider" ? "0 4px 15px rgba(255, 193, 7, 0.4)" : "0 4px 15px rgba(255, 205, 57, 0.3)"
                }}
              >
                SLIDER VIEW
              </button>
            </div>
          </div>

          <div
            ref={filtersRef}
            style={{
              marginBottom: "32px",
              padding: "40px",
              background: "rgba(26, 31, 58, 0.95)",
              border: "1px solid rgba(255, 107, 53, 0.2)",
              borderRadius: "20px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 107, 53, 0.1)",
              backdropFilter: "blur(20px)",
              position: "relative",
              zIndex: 100,
            }}
          >
            <h3
              style={{
                marginBottom: "32px",
                fontSize: "24px",
                fontWeight: "700",
                color: "#ffffff",
                letterSpacing: "0.5px",
                textAlign: "center",
              }}
            >
              Search & Location
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "24px",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", zIndex: 2000 }}>
                <label
                  style={{
                    fontWeight: "700",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    letterSpacing: "1.2px",
                    color: "#b8bcc8",
                    marginBottom: "12px",
                    display: "block",
                  }}
                >
                  CITY
                </label>
                <div
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  style={{
                    padding: "18px 24px",
                    fontSize: "16px",
                    fontWeight: "500",
                    borderRadius: "16px",
                    border: `2px solid ${showCityDropdown ? "#ff6b35" : "rgba(255, 107, 53, 0.3)"}`,
                    background: "rgba(26, 31, 58, 0.95)",
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "60px",
                    transition: "all 0.3s ease",
                    boxShadow: showCityDropdown ? "0 4px 20px rgba(255, 107, 53, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "18px" }}>
                      {cityOptions.find((opt) => opt.value === filters.city)?.icon || "🌍"}
                    </span>
                    {cityOptions.find((opt) => opt.value === filters.city)?.label || "All Cities"}
                  </span>
                  <span
                    style={{
                      transform: showCityDropdown ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                      fontSize: "12px",
                      color: "#ff6b35",
                    }}
                  >
                    ▼
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% - 4px)",
                    left: 0,
                    right: 0,
                    zIndex: 50000,
                  }}
                >
                  <CustomDropdown
                    isOpen={showCityDropdown}
                    onClose={() => setShowCityDropdown(false)}
                    value={filters.city}
                    onChange={(value) => {
                      setFilters((prev) => ({ ...prev, city: value }))
                      setShowCityDropdown(false)

                      // Update URL parameters
                      const currentParams = new URLSearchParams(searchParams)
                      if (value === "") {
                        // Remove city parameter when "All Cities" is selected
                        currentParams.delete("city")
                      } else {
                        // Set city parameter when specific city is selected
                        currentParams.set("city", value)
                      }

                      // Navigate to updated URL
                      const newSearch = currentParams.toString()
                      navigate(`/hotels${newSearch ? `?${newSearch}` : ""}`, { replace: true })
                    }}
                    options={cityOptions}
                  />
                </div>
              </div>

              <div style={{ position: "relative", zIndex: 1900 }}>
                <label
                  style={{
                    fontWeight: "700",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    letterSpacing: "1.2px",
                    color: "#b8bcc8",
                    marginBottom: "12px",
                    display: "block",
                  }}
                >
                  AREA
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "18px",
                      color: "#ff6b35",
                      zIndex: 2,
                    }}
                  >
                    🔍
                  </span>
                  <input
                    type="text"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    onKeyDown={handleAreaKeyDown}
                    onFocus={() => {
                      setAreaInputFocused(true)
                      if (filters.location.length >= 1) {
                        const suggestions = getAreaSuggestions(filters.location)
                        setAreaSuggestions(suggestions)
                        setShowAreaSuggestions(suggestions.length > 0)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowAreaSuggestions(false)
                        setAreaInputFocused(false)
                        setSelectedSuggestionIndex(-1)
                      }, 150)
                    }}
                    placeholder="Search by area, landmark or city"
                    style={{
                      padding: "18px 24px 18px 60px",
                      fontSize: "16px",
                      fontWeight: "500",
                      borderRadius: "16px",
                      border: `2px solid ${areaInputFocused || showAreaSuggestions ? "#ff6b35" : "rgba(255, 107, 53, 0.3)"}`,
                      background: "rgba(26, 31, 58, 0.98)",
                      color: "#ffffff",
                      width: "100%",
                      height: "60px",
                      transition: "all 0.3s ease",
                      boxShadow:
                        areaInputFocused || showAreaSuggestions
                          ? "0 4px 20px rgba(255, 107, 53, 0.3)"
                          : "0 2px 8px rgba(0, 0, 0, 0.1)",
                      backdropFilter: "blur(25px)",
                      outline: "none",
                    }}
                  />
                  {showAreaSuggestions && areaSuggestions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "rgba(26, 31, 58, 0.98)",
                        border: "2px solid rgba(255, 107, 53, 0.3)",
                        borderTop: "none",
                        borderRadius: "0 0 16px 16px",
                        backdropFilter: "blur(25px)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                        zIndex: 5000,
                        maxHeight: "300px",
                        overflowY: "auto",
                        marginTop: "-2px",
                      }}
                    >
                      {areaSuggestions.map((suggestion, index) => (
                        <div
                          key={`${suggestion.area}-${suggestion.city || "no-city"}-${index}`}
                          onClick={() => selectAreaSuggestion(suggestion)}
                          style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            borderBottom:
                              index < areaSuggestions.length - 1 ? "1px solid rgba(255, 107, 53, 0.1)" : "none",
                            background: selectedSuggestionIndex === index ? "rgba(255, 107, 53, 0.15)" : "transparent",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        >
                          <span
                            style={{
                              fontSize: "14px",
                              opacity: 0.7,
                            }}
                          >
                            📍
                          </span>
                          <div>
                            <div
                              style={{
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: "600",
                              }}
                            >
                              {suggestion.area}
                            </div>
                            {suggestion.city && (
                              <div
                                style={{
                                  color: "rgba(255, 255, 255, 0.6)",
                                  fontSize: "12px",
                                  fontWeight: "400",
                                }}
                              >
                                {suggestion.city}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ position: "relative", zIndex: 1800 }}>
                <label
                  style={{
                    fontWeight: "700",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    letterSpacing: "1.2px",
                    color: "#b8bcc8",
                    marginBottom: "12px",
                    display: "block",
                  }}
                >
                  CHECK-IN
                </label>
                <div
                  onClick={() => setActiveCalendar(activeCalendar === "checkIn" ? null : "checkIn")}
                  style={{
                    padding: "18px 24px",
                    fontSize: "16px",
                    fontWeight: "500",
                    borderRadius: "16px",
                    border: `2px solid ${activeCalendar === "checkIn" ? "#ff6b35" : "rgba(255, 107, 53, 0.3)"}`,
                    background: "rgba(26, 31, 58, 0.95)",
                    color: searchState.checkIn ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    height: "60px",
                    transition: "all 0.3s ease",
                    boxShadow:
                      activeCalendar === "checkIn"
                        ? "0 4px 20px rgba(255, 107, 53, 0.3)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>📅</span>
                  {searchState.checkIn ? formatDate(searchState.checkIn) : "Select check-in date"}
                </div>
              </div>

              <div style={{ position: "relative", zIndex: 1700 }}>
                <label
                  style={{
                    fontWeight: "700",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    letterSpacing: "1.2px",
                    color: "#b8bcc8",
                    marginBottom: "12px",
                    display: "block",
                  }}
                >
                  CHECK-OUT
                </label>
                <div
                  onClick={() => setActiveCalendar(activeCalendar === "checkOut" ? null : "checkOut")}
                  style={{
                    padding: "18px 24px",
                    fontSize: "16px",
                    fontWeight: "500",
                    borderRadius: "16px",
                    border: `2px solid ${activeCalendar === "checkOut" ? "#ff6b35" : "rgba(255, 107, 53, 0.3)"}`,
                    background: "rgba(26, 31, 58, 0.95)",
                    color: searchState.checkOut ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    height: "60px",
                    transition: "all 0.3s ease",
                    boxShadow:
                      activeCalendar === "checkOut"
                        ? "0 4px 20px rgba(255, 107, 53, 0.3)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>📅</span>
                  {searchState.checkOut ? formatDate(searchState.checkOut) : "Select check-out date"}
                </div>
              </div>

              <div style={{ position: "relative", zIndex: 1600 }}>
                <label
                  style={{
                    fontWeight: "700",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    letterSpacing: "1.2px",
                    color: "#b8bcc8",
                    marginBottom: "12px",
                    display: "block",
                  }}
                >
                  NO. OF GUESTS
                </label>
                <div
                  onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
                  style={{
                    padding: "18px 24px",
                    fontSize: "16px",
                    fontWeight: "500",
                    borderRadius: "16px",
                    border: `2px solid ${showGuestsDropdown ? "#ff6b35" : "rgba(255, 107, 53, 0.3)"}`,
                    background: "rgba(26, 31, 58, 0.95)",
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "60px",
                    transition: "all 0.3s ease",
                    boxShadow: showGuestsDropdown
                      ? "0 4px 20px rgba(255, 107, 53, 0.3)"
                      : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "18px" }}>
                      {guestOptions.find((opt) => opt.value === searchState.guests)?.icon || "👤"}
                    </span>
                    {guestOptions.find((opt) => opt.value === searchState.guests)?.label || "1 Guest"}
                  </span>
                  <span
                    style={{
                      transform: showGuestsDropdown ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                      fontSize: "12px",
                      color: "#ff6b35",
                    }}
                  >
                    ▼
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% - 4px)",
                    left: 0,
                    right: 0,
                    zIndex: 50000,
                  }}
                >
                  <CustomDropdown
                    isOpen={showGuestsDropdown}
                    onClose={() => setShowGuestsDropdown(false)}
                    value={searchState.guests}
                    onChange={(value) => {
                      setSearchState((prev) => ({ ...prev, guests: value }))
                      setShowGuestsDropdown(false)
                    }}
                    options={guestOptions}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginBottom: "32px",
              padding: "32px",
              background: "linear-gradient(135deg, rgba(26, 31, 58, 0.98) 0%, rgba(17, 24, 47, 0.98) 100%)",
              border: "1px solid rgba(255, 107, 53, 0.15)",
              borderRadius: "24px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4), 0 8px 20px rgba(255, 107, 53, 0.1)",
              backdropFilter: "blur(30px)",
              position: "relative",
              zIndex: 90,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-50%",
                right: "-20%",
                width: "300px",
                height: "300px",
                background: "radial-gradient(circle, rgba(255, 107, 53, 0.1) 0%, transparent 70%)",
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            ></div>
            <div
              style={{
                position: "absolute",
                bottom: "-50%",
                left: "-20%",
                width: "200px",
                height: "200px",
                background: "radial-gradient(circle, rgba(32, 201, 151, 0.08) 0%, transparent 70%)",
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            ></div>

            <h3
              style={{
                marginBottom: "40px",
                fontSize: "28px",
                fontWeight: "800",
                color: "#ffffff",
                letterSpacing: "0.5px",
                textAlign: "center",
                background: "linear-gradient(135deg, #ffffff 0%, rgba(255, 107, 53, 0.8) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Price & Rating
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "40px",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div>
                <label
                  style={{
                    fontWeight: "700",
                    textTransform: "uppercase",
                    fontSize: "13px",
                    letterSpacing: "1.2px",
                    color: "#ffffff",
                    marginBottom: "20px",
                    display: "block",
                    opacity: 0.9,
                  }}
                >
                  💰 Price Range
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "end",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.7)",
                        marginBottom: "8px",
                        display: "block",
                        fontWeight: "500",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Min
                    </label>
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#ff6b35",
                          zIndex: 2,
                        }}
                      >
                        {currentCurrency.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={filters.minPrice === 0 ? "" : filters.minPrice}
                        name="minPrice"
                        onChange={handleFilterChange}
                        placeholder={placeholderPrices.min}
                        style={{
                          width: "100%",
                          padding: "14px 16px 14px 36px",
                          border: "2px solid rgba(255, 107, 53, 0.2)",
                          borderRadius: "12px",
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#ffffff",
                          background: "rgba(255, 255, 255, 0.05)",
                          transition: "all 0.3s ease",
                          backdropFilter: "blur(10px)",
                          outline: "none",
                          WebkitAppearance: "none",
                          MozAppearance: "textfield",
                          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#ff6b35"
                          e.target.style.boxShadow =
                            "0 0 0 3px rgba(255, 107, 53, 0.12), 0 6px 20px rgba(255, 107, 53, 0.15)"
                          e.target.style.background = "rgba(255, 255, 255, 0.08)"
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "rgba(255, 107, 53, 0.2)"
                          e.target.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.1)"
                          e.target.style.background = "rgba(255, 255, 255, 0.05)"
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "2px",
                        background: "linear-gradient(90deg, #ff6b35 0%, #20c997 100%)",
                        borderRadius: "1px",
                      }}
                    ></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.7)",
                        marginBottom: "8px",
                        display: "block",
                        fontWeight: "500",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Max
                    </label>
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#20c997",
                          zIndex: 2,
                        }}
                      >
                        {currentCurrency.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={filters.maxPrice === 0 ? "" : filters.maxPrice}
                        name="maxPrice"
                        onChange={handleFilterChange}
                        placeholder={placeholderPrices.max}
                        style={{
                          width: "100%",
                          padding: "14px 16px 14px 36px",
                          border: "2px solid rgba(32, 201, 151, 0.2)",
                          borderRadius: "12px",
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#ffffff",
                          background: "rgba(255, 255, 255, 0.05)",
                          transition: "all 0.3s ease",
                          backdropFilter: "blur(10px)",
                          outline: "none",
                          WebkitAppearance: "none",
                          MozAppearance: "textfield",
                          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#20c997"
                          e.target.style.boxShadow =
                            "0 0 0 3px rgba(32, 201, 151, 0.12), 0 6px 20px rgba(32, 201, 151, 0.15)"
                          e.target.style.background = "rgba(255, 255, 255, 0.08)"
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "rgba(32, 201, 151, 0.2)"
                          e.target.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.1)"
                          e.target.style.background = "rgba(255, 255, 255, 0.05)"
                          validatePriceRelationship(e)
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    background: "linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(32, 201, 151, 0.08) 100%)",
                    border: "1px solid rgba(255, 107, 53, 0.2)",
                    borderRadius: "12px",
                    marginBottom: validationError ? "16px" : "0px",
                    backdropFilter: "blur(15px)",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "rgba(255, 255, 255, 0.6)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Selected Range
                    </span>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#ffffff",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {filters.minPrice === 0 && filters.maxPrice === 0
                        ? "Any Price"
                        : filters.minPrice === 0 && filters.maxPrice > 0
                          ? `Up to ${currentCurrency.symbol}${filters.maxPrice.toLocaleString()}`
                          : filters.maxPrice === 0 && filters.minPrice > 0
                            ? `From ${currentCurrency.symbol}${filters.minPrice.toLocaleString()}`
                            : `${currentCurrency.symbol}${filters.minPrice.toLocaleString()} - ${currentCurrency.symbol}${filters.maxPrice.toLocaleString()}`}
                    </span>
                  </div>
                  <button
                    onClick={clearPriceRange}
                    style={{
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: "600",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 107, 53, 0.3)",
                      background: "rgba(255, 107, 53, 0.1)",
                      color: "#ff6b35",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(255, 107, 53, 0.2)"
                      e.target.style.color = "#ffffff"
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(255, 107, 53, 0.1)"
                      e.target.style.color = "#ff6b35"
                    }}
                  >
                    Clear
                  </button>
                </div>
                {validationError && (
                  <div
                    style={{
                      padding: "12px 20px",
                      marginBottom: "20px",
                      background: "rgba(220, 53, 69, 0.15)",
                      border: "2px solid rgba(220, 53, 69, 0.3)",
                      borderRadius: "12px",
                      backdropFilter: "blur(20px)",
                      boxShadow: "0 4px 16px rgba(220, 53, 69, 0.2)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>⚠️</span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#ffffff",
                          letterSpacing: "0.3px",
                        }}
                      >
                        {validationError}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    fontWeight: "700",
                    textTransform: "uppercase",
                    fontSize: "13px",
                    letterSpacing: "1.2px",
                    color: "#ffffff",
                    marginBottom: "20px",
                    display: "block",
                    opacity: 0.9,
                  }}
                >
                  ⭐ Minimum Rating
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  {[
                    { value: 0, label: "Any", stars: "🏨", color: "#6c757d" },
                    { value: 3, label: "3+", stars: "⭐⭐⭐", color: "#ffc107" },
                    { value: 4, label: "4+", stars: "⭐⭐⭐⭐", color: "#fd7e14" },
                    { value: 5, label: "5★", stars: "⭐⭐⭐⭐⭐", color: "#dc3545" },
                  ].map((rating) => (
                    <button
                      key={rating.value}
                      onClick={() => setFilters((prev) => ({ ...prev, minRating: rating.value }))}
                      style={{
                        padding: "14px 8px",
                        fontSize: "13px",
                        fontWeight: "700",
                        borderRadius: "12px",
                        border:
                          filters.minRating === rating.value
                            ? `2px solid ${rating.color}`
                            : "2px solid rgba(255, 255, 255, 0.15)",
                        background:
                          filters.minRating === rating.value
                            ? `linear-gradient(135deg, ${rating.color}20, ${rating.color}10)`
                            : "rgba(255, 255, 255, 0.05)",
                        color: filters.minRating === rating.value ? rating.color : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        backdropFilter: "blur(10px)",
                        transform: filters.minRating === rating.value ? "scale(1.05)" : "scale(1)",
                        boxShadow:
                          filters.minRating === rating.value
                            ? `0 6px 20px ${rating.color}40`
                            : "0 2px 8px rgba(0, 0, 0, 0.1)",
                      }}
                      onMouseEnter={(e) => {
                        if (filters.minRating !== rating.value) {
                          e.target.style.borderColor = rating.color
                          e.target.style.background = `${rating.color}15`
                          e.target.style.transform = "scale(1.02)"
                          e.target.style.color = rating.color
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filters.minRating !== rating.value) {
                          e.target.style.borderColor = "rgba(255, 255, 255, 0.15)"
                          e.target.style.background = "rgba(255, 255, 255, 0.05)"
                          e.target.style.transform = "scale(1)"
                          e.target.style.color = "#ffffff"
                        }
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          lineHeight: 1,
                          opacity: 0.8,
                        }}
                      >
                        {rating.stars}
                      </span>
                      <span
                        style={{
                          fontWeight: "800",
                          textTransform: "uppercase",
                          fontSize: "12px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {rating.label}
                      </span>
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "14px 18px",
                    background:
                      filters.minRating === 0
                        ? "rgba(108, 117, 125, 0.15)"
                        : filters.minRating === 3
                          ? "rgba(255, 193, 7, 0.15)"
                          : filters.minRating === 4
                            ? "rgba(253, 126, 20, 0.15)"
                            : "rgba(220, 53, 69, 0.15)",
                    border: `1px solid ${filters.minRating === 0
                        ? "rgba(108, 117, 125, 0.3)"
                        : filters.minRating === 3
                          ? "rgba(255, 193, 7, 0.3)"
                          : filters.minRating === 4
                            ? "rgba(253, 126, 20, 0.3)"
                            : "rgba(220, 53, 69, 0.3)"
                      }`,
                    borderRadius: "10px",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#ffffff",
                      textAlign: "center",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {filters.minRating === 0 ? "🏨 All ratings accepted" : `⭐ ${filters.minRating}+ star hotels`}
                  </span>
                </div>
              </div>

              <div style={{ position: "relative", zIndex: 1500 }}>
                <label
                  style={{
                    fontWeight: "700",
                    textTransform: "uppercase",
                    fontSize: "13px",
                    letterSpacing: "1.2px",
                    color: "#ffffff",
                    marginBottom: "12px",
                    display: "block",
                    opacity: 0.9,
                  }}
                >
                  📊 Sort By
                </label>
                <div
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  style={{
                    padding: "16px 20px",
                    fontSize: "15px",
                    fontWeight: "600",
                    borderRadius: "12px",
                    border: `2px solid ${showSortDropdown ? "#ff6b35" : "rgba(255, 107, 53, 0.2)"}`,
                    background: showSortDropdown ? "rgba(255, 107, 53, 0.08)" : "rgba(255, 255, 255, 0.05)",
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "56px",
                    transition: "all 0.3s ease",
                    boxShadow: showSortDropdown
                      ? "0 6px 20px rgba(255, 107, 53, 0.2)"
                      : "0 3px 10px rgba(0, 0, 0, 0.1)",
                    backdropFilter: "blur(15px)",
                  }}
                  onMouseEnter={(e) => {
                    if (!showSortDropdown) {
                      e.target.style.borderColor = "rgba(255, 107, 53, 0.4)"
                      e.target.style.background = "rgba(255, 255, 255, 0.08)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showSortDropdown) {
                      e.target.style.borderColor = "rgba(255, 107, 53, 0.2)"
                      e.target.style.background = "rgba(255, 255, 255, 0.05)"
                    }
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    <span style={{ fontSize: "16px", opacity: 0.8 }}>
                      {sortOptions.find((opt) => opt.value === sortBy)?.icon || "📊"}
                    </span>
                    <span style={{ letterSpacing: "0.3px" }}>
                      {sortOptions.find((opt) => opt.value === sortBy)?.label || "Relevance"}
                    </span>
                  </span>
                  <span
                    style={{
                      transform: showSortDropdown ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                      fontSize: "12px",
                      color: "#ff6b35",
                      opacity: 0.8,
                    }}
                  >
                    ▼
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 50000,
                    marginTop: "0px !important",
                  }}
                >
                  <CustomDropdown
                    isOpen={showSortDropdown}
                    onClose={() => setShowSortDropdown(false)}
                    value={sortBy}
                    onChange={(value) => {
                      setSortBy(value)
                      setShowSortDropdown(false)
                    }}
                    options={sortOptions}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "40px",
                textAlign: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              <button
                onClick={() => {
                  setFilters({
                    city: "",
                    location: "",
                    minPrice: 0,
                    maxPrice: 0,
                    minRating: 0,
                  })
                  setValidationError("")
                  setSearchState({
                    checkIn: "",
                    checkOut: "",
                    guests: 1,
                  })
                  setSortBy("relevance")
                }}
                style={{
                  padding: "14px 28px",
                  fontSize: "14px",
                  fontWeight: "700",
                  borderRadius: "12px",
                  border: "2px solid rgba(255, 107, 53, 0.3)",
                  background: "linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%)",
                  color: "#ff6b35",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  backdropFilter: "blur(15px)",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "linear-gradient(135deg, #ff6b35 0%, #ff8a6b 100%)"
                  e.target.style.color = "white"
                  e.target.style.borderColor = "#ff6b35"
                  e.target.style.transform = "translateY(-2px)"
                  e.target.style.boxShadow = "0 8px 25px rgba(255, 107, 53, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.background =
                    "linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%)"
                  e.target.style.color = "#ff6b35"
                  e.target.style.borderColor = "rgba(255, 107, 53, 0.3)"
                  e.target.style.transform = "translateY(0)"
                  e.target.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.1)"
                }}
              >
                <span style={{ fontSize: "16px" }}>🔄</span>
                Clear All Filters
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ marginBottom: "32px", position: "relative", zIndex: 1 }}
        >
          <h2
            style={{ fontFamily: "Playfair Display, serif", fontSize: "32px", marginBottom: "16px", color: "#ffffff" }}
          >
            {filteredHotels.length} Hotels Found
            {filters.city && ` in ${filters.city}`}
            {filters.location && !filters.city && ` matching "${filters.location}"`}
          </h2>
        </motion.div>

        <CustomCalendar
          isOpen={activeCalendar === "checkIn"}
          onClose={() => setActiveCalendar(null)}
          onDateSelect={(date) => handleDateSelect("checkIn", date)}
          selectedDate={searchState.checkIn}
          excludeDate={searchState.checkOut}
        />

        <CustomCalendar
          isOpen={activeCalendar === "checkOut"}
          onClose={() => setActiveCalendar(null)}
          onDateSelect={(date) => handleDateSelect("checkOut", date)}
          selectedDate={searchState.checkOut}
          minDate={searchState.checkIn}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {filteredHotels.length === 0 ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <h3
                style={{
                  marginBottom: "16px",
                  fontSize: "28px",
                  fontFamily: "Playfair Display, serif",
                  color: "#ffffff",
                }}
              >
                No hotels found
              </h3>
              <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "18px" }}>
                Try adjusting your filters or search criteria
              </p>
            </div>
          ) : viewMode === "slider" ? (
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
                  display: filteredHotels.length > 1 ? "flex" : "none",
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
                  display: filteredHotels.length > 1 ? "flex" : "none",
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
                modules={[Navigation, Pagination]}
                spaceBetween={24}
                slidesPerView={Math.min(filteredHotels.length, 4)}
                navigation={{
                  prevEl: swiperPrevRef.current,
                  nextEl: swiperNextRef.current,
                }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                  dynamicMainBullets: 3,
                  bulletClass: "swiper-bullet",
                  bulletActiveClass: "swiper-bullet-active",
                  renderBullet: (index, className) => {
                    return `<span class="${className}" style="
                      width: 10px;
                      height: 10px;
                      background: rgba(255, 107, 53, 0.5);
                      border-radius: 50%;
                      display: inline-block;
                      margin: 0 4px;
                      cursor: pointer;
                      transition: all 0.3s ease;
                    "></span>`
                  },
                }}
                onBeforeInit={(swiper) => {
                  swiper.params.navigation.prevEl = swiperPrevRef.current
                  swiper.params.navigation.nextEl = swiperNextRef.current
                }}
                breakpoints={{
                  320: { slidesPerView: 1 },
                  640: { slidesPerView: Math.min(filteredHotels.length, 2) },
                  1024: { slidesPerView: Math.min(filteredHotels.length, 3) },
                  1280: { slidesPerView: Math.min(filteredHotels.length, 4) },
                }}
                style={{
                  padding: "16px 0",
                  "--swiper-pagination-bottom": "0px",
                  "--swiper-pagination-bullet-inactive-color": "rgba(255, 107, 53, 0.3)",
                  "--swiper-pagination-bullet-inactive-opacity": "1",
                  "--swiper-pagination-bullet-size": "10px",
                  "--swiper-pagination-bullet-horizontal-gap": "4px",
                }}
              >
                {filteredHotels.map((hotel, index) => (
                  <SwiperSlide key={`${hotel.id}-${index}`}>
                    <HotelCard
                      hotel={hotel}
                      currency={currentCurrency}
                      checkIn={searchState.checkIn}
                      checkOut={searchState.checkOut}
                      guests={searchState.guests}
                      style={{
                        width: "100%",
                        maxWidth: "360px",
                        margin: "0 auto",
                      }}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "24px",
              }}
            >
              {filteredHotels.map((hotel, index) => (
                <HotelCard
                  key={`${hotel.id}-${index}`}
                  hotel={hotel}
                  currency={currentCurrency}
                  checkIn={searchState.checkIn}
                  checkOut={searchState.checkOut}
                  guests={searchState.guests}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Hotels
