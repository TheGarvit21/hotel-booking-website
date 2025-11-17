import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/useToast";
import { getHotelsWithFallback, createHotel, updateHotel, deleteHotel } from "../services/hotels";
import {
    addUser,
    deleteUser,
    getCurrentUserSync,
    getUsers,
    getUserStats,
    searchUsers,
    setUserStatus,
    updateUser,
} from "../utils/auth";
import { cancelBooking, getBookings, updateBookingStatus } from "../utils/bookings";
import { cleanupSampleData } from "../utils/dataCleanup";
import { createBookingCancellationNotification } from "../utils/notifications";
import AdminChat from "../components/AdminChat";
import "./AdminDashboard.css";

// Constants
const CITY_OPTIONS = [
    'Goa', 'Ahmedabad', 'Bangalore', 'Chennai', 'Hyderabad', 'Jaipur', 'Kolkata', 'Mumbai', 'New Delhi', 'Pune'
];

const STATUS_CLASSES = {
    confirmed: "status-success",
    pending: "status-warning",
    cancelled: "status-error",
};

const ACTIVITY_ICONS = {
    booking: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
        </svg>
    ),
    user: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
    ),
    system: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
    ),
};

const VALID_CURRENCIES = ["USD", "EUR", "GBP", "INR"];
const CURRENCY_SYMBOLS = { USD: "$", EUR: "€", GBP: "£", INR: "₹" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function AdminDashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalBookings: 0,
        revenue: 0,
        activeHotels: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        monthlyRevenue: 0,
    });
    const [bookingsData, setBookingsData] = useState([]);
    const [hotelsData, setHotelsData] = useState([]);
    const [usersData, setUsersData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [bookingFilter, setBookingFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [userFormData, setUserFormData] = useState({ name: "", email: "", status: "active" });
    const [userStats, setUserStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        banned: 0,
        newThisMonth: 0,
        growthRate: 0,
    });
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [userFilter, setUserFilter] = useState("all");
    const [showUserModal, setShowUserModal] = useState(false);
    const [showHotelModal, setShowHotelModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [analyticsData, setAnalyticsData] = useState({
        monthlyBookings: [],
        revenueByCity: [],
        topHotels: [],
        bookingTrends: [],
    });
    const [newUser, setNewUser] = useState({ name: "", email: "", status: "active" });
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [hotelFormData, setHotelFormData] = useState({
        name: "",
        city: "",
        state: "",
        location: "",
        rating: 5,
        price: "",
        amenities: [],
        description: "",
        status: "active",
        rooms: 0,
        images: [],
    });
    const [newHotel, setNewHotel] = useState({
        name: "",
        city: "",
        state: "",
        location: "",
        rating: 5,
        price: "",
        amenities: [],
        description: "",
        status: "active",
        rooms: 0,
        images: [],
    });

    // Helper Functions
    const getUserName = useCallback(
        (userId) => {
            const user = usersData.find((u) => String(u.id) === String(userId));
            return user ? user.name : `Unknown User (${userId})`;
        },
        [usersData],
    );

    const canCancelBooking = useCallback((booking) => {
        const now = new Date();
        const checkInDate = new Date(booking.checkIn + "T14:00:00");
        const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
        return {
            canCancel: hoursUntilCheckIn >= 24,
            hoursRemaining: Math.max(0, hoursUntilCheckIn),
            reason: hoursUntilCheckIn < 24 ? "Cancellations are only allowed 24 hours before check-in" : null,
        };
    }, []);

    const notifyUserCancellation = useCallback(
        (booking) => {
            const user = usersData.find((u) => u.id === booking.userId);
            if (!user) {
                return false;
            }
            try {
                const notification = createBookingCancellationNotification(
                    user.id,
                    {
                        id: booking.id,
                        hotelName: booking.hotelName,
                        totalPrice: booking.totalPrice || 0,
                        currency: booking.currency || "INR",
                        checkIn: booking.checkIn,
                        checkOut: booking.checkOut,
                    },
                    "admin",
                );
                return true;
            } catch (error) {
                return false;
            }
        },
        [usersData],
    );

    const formatCurrency = (amount, currency) => {
        if (!amount || !VALID_CURRENCIES.includes(currency)) {
            return `${CURRENCY_SYMBOLS.INR}0`;
        }
        try {
            return new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: currency,
                maximumFractionDigits: 2,
            }).format(amount);
        } catch (error) {
            return `${CURRENCY_SYMBOLS[currency]}${Number(amount).toLocaleString("en-IN")}`;
        }
    };

    const generateAnalytics = useCallback((bookings, hotels) => {
        const monthlyBookings = MONTHS.map((month, index) => ({
            month,
            bookings: bookings.filter((b) => new Date(b.bookingDate).getMonth() === index).length,
        }));

        const revenueByCity = hotels.reduce((acc, hotel) => {
            const cityBookings = bookings.filter((b) => b.hotelId === hotel.id);
            const revenue = cityBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
            if (revenue > 0) {
                acc.push({ city: hotel.city, revenue });
            }
            return acc;
        }, []);

        const topHotels = hotels
            .map((hotel) => ({
                hotel: hotel.name,
                bookings: bookings.filter((b) => b.hotelId === hotel.id).length,
            }))
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 5);

        return { monthlyBookings, revenueByCity, topHotels, bookingTrends: [] };
    }, []);

    const generateSampleUsers = useCallback((bookings) => {
        let realUsers = getUsers();
        // Ensure realUsers is an array
        if (!Array.isArray(realUsers)) {
            return [];
        }
        return realUsers.map((user) => ({
            id: user.id,
            name: user.name || user.email.split("@")[0],
            email: user.email,
            joinDate: user.createdAt || new Date().toISOString(),
            bookings: bookings.filter((b) => b.userId === user.id).length,
            status: user.status || "active",
            updatedAt: user.updatedAt,
        }));
    }, []);

    // Data Loading
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const hotels = await getHotelsWithFallback();
            const allBookings = getBookings();
            const currentUser = getCurrentUserSync?.() || null;
            let realUsers = getUsers();
            // Ensure realUsers is an array
            if (!Array.isArray(realUsers)) {
                realUsers = [];
            }

            if (currentUser && !realUsers.some((u) => String(u.id) === String(currentUser.id))) {
                realUsers = [...realUsers, currentUser];
                localStorage.setItem("users", JSON.stringify(realUsers));
            }

            const users = generateSampleUsers(allBookings);
            const realUserIds = users.map((u) => u.id);
            const realBookings = allBookings.filter((booking) => realUserIds.includes(booking.userId));

            const totalRevenue = realBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
            const confirmedBookings = realBookings.filter((b) => b.status === "confirmed").length;
            const pendingBookings = realBookings.filter((b) => b.status === "pending").length;
            const cancelledBookings = realBookings.filter((b) => b.status === "cancelled").length;
            const currentMonth = new Date().getMonth();
            const monthlyRevenue = realBookings
                .filter((b) => new Date(b.bookingDate).getMonth() === currentMonth)
                .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

            // Ensure hotels have proper IDs
            const hotelsWithIds = hotels.map(hotel => ({
                ...hotel,
                id: hotel.id || hotel._id || `temp-${Date.now()}-${Math.random()}`
            }));
            setHotelsData(hotelsWithIds);
            setUsersData(users);
            setFilteredUsers(users);
            setBookingsData(realBookings);
            setFilteredBookings(realBookings);
            setUserStats(getUserStats());
            setStats({
                totalUsers: users.length,
                totalBookings: realBookings.length,
                revenue: totalRevenue,
                activeHotels: hotels.length,
                pendingBookings,
                confirmedBookings,
                cancelledBookings,
                monthlyRevenue,
            });

            const analytics = generateAnalytics(realBookings, hotels);
            setAnalyticsData(analytics);

            const activity = realBookings
                .slice(-5)
                .reverse()
                .map((booking, index) => {
                    const hotel = hotels.find((h) => h.id === booking.hotelId);
                    const userName = getUserName(booking.userId);
                    return {
                        id: index + 1,
                        type: "booking",
                        user: userName,
                        action: `Booked ${hotel?.name || booking.hotelName || "Hotel"} for ${booking.checkIn} to ${booking.checkOut}`,
                        time: new Date(booking.bookingDate).toLocaleDateString(),
                        status: booking.status === "confirmed" ? "success" : booking.status === "pending" ? "warning" : "error",
                    };
                });

            setRecentActivity(
                activity.length > 0
                    ? activity
                    : [
                        {
                            id: 1,
                            type: "system",
                            user: "System",
                            action: "No recent activity",
                            time: new Date().toLocaleDateString(),
                            status: "info",
                        },
                    ],
            );
        } catch (error) {
            if (typeof toast === "function") {
                toast({ title: "Failed to load dashboard data", variant: "destructive" });
            }
        } finally {
            setLoading(false);
        }
    }, [generateSampleUsers, generateAnalytics, getUserName, toast]);

    // User Management
    const handleAddUser = useCallback(async () => {
        try {
            if (!newUser.name || !newUser.email) {
                toast.error("Please fill in all required fields");
                return;
            }
            const existingUser = usersData.find((user) => user.email.toLowerCase() === newUser.email.toLowerCase());
            if (existingUser) {
                toast.error("User already exists with this email address");
                return;
            }
            await addUser({
                name: newUser.name.trim(),
                email: newUser.email.trim().toLowerCase(),
                password: "TempPass123!",
                status: newUser.status,
                mustChangePassword: true,
            });
            await loadData();
            setShowUserModal(false);
            setNewUser({ name: "", email: "", status: "active" });
            toast.success("User added successfully! They will need to set their password on first login.");
        } catch (error) {
            toast.error(error.message || "Failed to add user. Please try again.");
        }
    }, [newUser, usersData, loadData, toast]);

    const handleEditUser = useCallback(async () => {
        try {
            if (!userFormData.name || !userFormData.email) {
                toast.error("Please fill in all required fields");
                return;
            }
            const existingUser = usersData.find(
                (user) => user.email.toLowerCase() === userFormData.email.toLowerCase() && user.id !== selectedUser.id,
            );
            if (existingUser) {
                toast.error("Another user already exists with this email address");
                return;
            }
            await updateUser(selectedUser.id, {
                name: userFormData.name.trim(),
                email: userFormData.email.trim().toLowerCase(),
                status: userFormData.status,
            });
            await loadData();
            setShowUserModal(false);
            setSelectedUser(null);
            setUserFormData({ name: "", email: "", status: "active" });
            toast.success("User updated successfully!");
        } catch (error) {
            toast.error(error.message || "Failed to update user. Please try again.");
        }
    }, [userFormData, selectedUser, usersData, loadData, toast]);

    const handleDeleteUser = useCallback(
        async (userId) => {
            if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
                return;
            }
            try {
                await deleteUser(userId);
                await loadData();
                toast.success("User deleted successfully!");
            } catch (error) {
                toast.error(error.message || "Failed to delete user. Please try again.");
            }
        },
        [loadData, toast],
    );

    const handleToggleUserStatus = useCallback(
        async (userId) => {
            try {
                const user = usersData.find((u) => u.id === userId);
                if (!user) return;
                const nextStatus = user.status === "active" ? "banned" : "active";
                await setUserStatus(userId, nextStatus);
                await loadData();
                toast.success(`User ${nextStatus === "banned" ? "banned" : "activated"} successfully`);
            } catch (error) {
                toast.error(error.message || "Failed to update user status. Please try again.");
            }
        },
        [usersData, loadData, toast],
    );

    const openEditUserModal = useCallback((user) => {
        setSelectedUser(user);
        setUserFormData({
            name: user.name,
            email: user.email,
            status: user.status,
        });
        setShowUserModal(true);
    }, []);

    const openAddUserModal = useCallback(() => {
        setSelectedUser(null);
        setUserFormData({ name: "", email: "", status: "active" });
        setNewUser({ name: "", email: "", status: "active" });
        setShowUserModal(true);
    }, []);

    const handleBookingStatusChange = useCallback(
        async (bookingId, newStatus) => {
            try {
                await updateBookingStatus(bookingId, newStatus);
                await loadData();
                setSelectedBooking(null);
                toast.success(`Booking status updated to ${newStatus}`);
            } catch (error) {
                toast.error(error.message || "Failed to update booking status. Please try again.");
            }
        },
        [loadData, toast],
    );

    const performCancellation = useCallback(
        async (booking, isLateCancellation) => {
            try {
                await cancelBooking(booking.id);
                const notified = notifyUserCancellation(booking);
                if (notified) {
                    window.dispatchEvent(
                        new CustomEvent("booking:cancelled", {
                            detail: {
                                bookingId: booking.id,
                                userId: booking.userId,
                                notification: notified,
                            },
                        }),
                    );
                }
                const activity = JSON.parse(localStorage.getItem("adminActivity") || "[]");
                activity.unshift({
                    id: Date.now(),
                    type: "booking",
                    user: "Admin",
                    action: `Cancelled booking for ${getUserName(booking.userId)} at ${booking.hotelName}${isLateCancellation ? " (Late Cancellation)" : ""}`,
                    time: new Date().toLocaleDateString(),
                    status: "error",
                });
                localStorage.setItem("adminActivity", JSON.stringify(activity.slice(0, 10)));
                await loadData();
                setSelectedBooking(null);
                toast.success(
                    notified
                        ? "Booking cancelled successfully. User has been notified and will receive their refund within 24 hours."
                        : "Booking cancelled but user notification failed. Please contact them directly about the refund.",
                );
            } catch (error) {
                toast.error(error.message || "Failed to cancel booking. Please try again.");
            }
        },
        [notifyUserCancellation, getUserName, loadData, toast],
    );

    const handleCancelBooking = useCallback(
        async (bookingId) => {
            const booking = bookingsData.find((b) => b.id === bookingId);
            if (!booking) return;
            const cancellationCheck = canCancelBooking(booking);
            const userName = getUserName(booking.userId);
            if (!cancellationCheck.canCancel) {
                if (
                    !window.confirm(
                        `This booking is within 24 hours of check-in (${cancellationCheck.hoursRemaining.toFixed(1)} hours remaining). ` +
                        `Cancelling may result in penalties for the guest. Are you sure you want to proceed?`,
                    )
                ) {
                    return;
                }
                performCancellation(booking, true);
            } else {
                if (!window.confirm(`Are you sure you want to cancel this booking for ${userName}?`)) {
                    return;
                }
                performCancellation(booking, false);
            }
        },
        [bookingsData, canCancelBooking, getUserName, performCancellation],
    );

    // Effects
    useEffect(() => {
        cleanupSampleData();
        loadData();
        // Only run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let filtered = bookingsData;
        if (bookingFilter !== "all") {
            filtered = filtered.filter((booking) => booking.status === bookingFilter);
        }
        if (searchTerm) {
            filtered = filtered.filter((booking) => {
                const userName = getUserName(booking.userId);
                return (
                    userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    booking.guestEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    booking.id?.toString().includes(searchTerm) ||
                    booking.hotelName?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }
        setFilteredBookings(filtered);
    }, [bookingsData, bookingFilter, searchTerm, getUserName]);

    useEffect(() => {
        let filtered = usersData;
        if (userFilter !== "all") {
            filtered = filtered.filter((user) => user.status === userFilter);
        }
        if (userSearchTerm) {
            filtered = searchUsers(userSearchTerm);
            if (userFilter !== "all") {
                filtered = filtered.filter((user) => user.status === userFilter);
            }
        }
        setFilteredUsers(filtered);
    }, [usersData, userFilter, userSearchTerm]);

    const getStatusBadge = useCallback((status) => {
        return <span className={`status-badge ${STATUS_CLASSES[status] || ""}`}>{status}</span>;
    }, []);

    const getActivityIcon = useCallback((type) => {
        return ACTIVITY_ICONS[type] || ACTIVITY_ICONS.booking;
    }, []);

    // Hotel Management
    const handleCloseHotelModal = () => {
        setShowHotelModal(false);
        setSelectedHotel(null);
        setHotelFormData({
            name: "",
            city: "",
            state: "",
            location: "",
            rating: 5,
            price: "",
            amenities: [],
            description: "",
            status: "active",
            rooms: 0,
            images: [],
        });
    };

    const handleHotelSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const hotelData = selectedHotel ? hotelFormData : newHotel;
            // Validate required fields
            if (!hotelData.name || hotelData.name.trim().length < 2) {
                toast?.error("Hotel name must be at least 2 characters.");
                setLoading(false);
                return;
            }
            if (!hotelData.location || hotelData.location.trim().length < 5) {
                toast?.error("Location must be at least 5 characters.");
                setLoading(false);
                return;
            }
            if (!hotelData.city || hotelData.city.trim().length < 2) {
                toast?.error("City must be at least 2 characters.");
                setLoading(false);
                return;
            }
            if (!hotelData.state || hotelData.state.trim().length < 2) {
                toast?.error("State must be at least 2 characters.");
                setLoading(false);
                return;
            }
            if (!hotelData.price || isNaN(Number(hotelData.price)) || Number(hotelData.price) < 0) {
                toast?.error("Price must be a positive number.");
                setLoading(false);
                return;
            }
            // Prepare hotel data with all required fields
            const preparedHotelData = {
                name: hotelData.name.trim(),
                location: hotelData.location.trim(),
                city: hotelData.city.trim(),
                state: hotelData.state.trim(),
                rating: Number(hotelData.rating) || 4.0,
                price: Number(hotelData.price) || 0,
                amenities: Array.isArray(hotelData.amenities) ? hotelData.amenities : [],
                status: hotelData.status,
                rooms: Number(hotelData.rooms) || 0,
                images: hotelData.images || [],
            };
            // If creating a new hotel, assign a random image
            if (!selectedHotel) {
                const hotelImages = [
                    `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
                    `https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
                    `https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
                    `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
                    `https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
                    `https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
                    `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop&crop=center&auto=format&q=80`
                ];
                if (!preparedHotelData.images || preparedHotelData.images.length === 0) {
                    const randomIndex = Math.floor(Math.random() * hotelImages.length);
                    preparedHotelData.images = [hotelImages[randomIndex]];
                }
            }
            if (selectedHotel) {
                // Edit hotel
                const hotelId = selectedHotel.id || selectedHotel._id;
                if (!hotelId) {
                    toast?.error('Hotel ID not found for editing');
                    setLoading(false);
                    return;
                }
                const response = await updateHotel(hotelId, preparedHotelData);
                if (response && response.success) {
                    toast?.success("Hotel updated successfully!");
                    setHotelsData(prevHotels =>
                        prevHotels.map(hotel =>
                            (hotel.id === hotelId || hotel._id === hotelId)
                                ? { ...hotel, ...preparedHotelData }
                                : hotel
                        )
                    );
                    await loadData();
                } else {
                    toast?.error(response?.message || "Failed to update hotel");
                    setLoading(false);
                    return;
                }
            } else {
                // Add hotel
                const response = await createHotel(preparedHotelData);
                if (response && response.success) {
                    setNewHotel({ name: '', city: '', state: '', location: '', rating: 5, price: '', amenities: [], status: 'active', rooms: 0, images: [] });
                    toast?.success("Hotel added successfully!");
                    await loadData();
                } else {
                    toast?.error(response?.message || "Failed to create hotel");
                    setLoading(false);
                    return;
                }
            }
            handleCloseHotelModal();
        } catch (error) {
            if (toast && typeof toast.error === 'function') {
                toast.error(error.message || "Error saving hotel");
            }
        } finally {
            setLoading(false);
        }
    };

    // Render
    if (loading) {
        return (
            <div className="admin-dashboard loading">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="admin-header-content">
                    <div className="admin-header-left">
                        <h1 className="admin-header-title">Admin Dashboard</h1>
                        <p className="admin-header-subtitle">Welcome back, Administrator</p>
                    </div>
                    <div className="admin-header-right">
                        <button className="admin-profile-btn">
                            <div className="admin-avatar">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>
                            <span>Admin</span>
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem("adminLoggedIn");
                                navigate("/admin");
                            }}
                            className="btn btn-secondary admin-logout-btn"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 16l5-5-5-5z" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <nav className="admin-nav">
                <div className="admin-nav-content">
                    {["overview", "bookings", "users", "hotels", "analytics", "chat"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`admin-nav-tab ${activeTab === tab ? "active" : ""}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </nav>

            <main className="admin-main">
                <div className="admin-content">
                    {activeTab === "overview" && (
                        <>
                            <div className="admin-stats-grid">
                                <div className="admin-stat-card">
                                    <div className="admin-stat-icon primary">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                        </svg>
                                    </div>
                                    <div className="admin-stat-content">
                                        <h3 className="admin-stat-number">{stats.totalUsers.toLocaleString()}</h3>
                                        <p className="admin-stat-label">Total Users</p>
                                        <span className="admin-stat-change positive">+12% this month</span>
                                    </div>
                                </div>

                                <div className="admin-stat-card">
                                    <div className="admin-stat-icon accent">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                                        </svg>
                                    </div>
                                    <div className="admin-stat-content">
                                        <h3 className="admin-stat-number">{stats.totalBookings.toLocaleString()}</h3>
                                        <p className="admin-stat-label">Total Bookings</p>
                                        <span className="admin-stat-change positive">+8% this week</span>
                                    </div>
                                </div>

                                <div className="admin-stat-card">
                                    <div className="admin-stat-icon secondary">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                                        </svg>
                                    </div>
                                    <div className="admin-stat-content">
                                        <h3 className="admin-stat-number">{formatCurrency(stats.revenue, "INR")}</h3>
                                        <p className="admin-stat-label">Total Revenue</p>
                                        <span className="admin-stat-change neutral">View bookings for details</span>
                                    </div>
                                </div>

                                <div className="admin-stat-card">
                                    <div className="admin-stat-icon warning">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </div>
                                    <div className="admin-stat-content">
                                        <h3 className="admin-stat-number">{stats.activeHotels}</h3>
                                        <p className="admin-stat-label">Active Hotels</p>
                                        <span className="admin-stat-change neutral">Available properties</span>
                                    </div>
                                </div>
                            </div>

                            <div className="admin-section">
                                <div className="admin-section-header">
                                    <h2 className="admin-section-title">Recent Activity</h2>
                                    <button className="btn btn-accent" onClick={() => setActiveTab("bookings")}>
                                        View All Bookings
                                    </button>
                                </div>

                                <div className="admin-activity-list">
                                    {recentActivity.map((activity) => (
                                        <div key={activity.id} className="admin-activity-item">
                                            <div className={`admin-activity-icon ${activity.status}`}>{getActivityIcon(activity.type)}</div>
                                            <div className="admin-activity-content">
                                                <div className="admin-activity-main">
                                                    <span className="admin-activity-user">{activity.user}</span>
                                                    <span className="admin-activity-action">{activity.action}</span>
                                                </div>
                                                <span className="admin-activity-time">{activity.time}</span>
                                            </div>
                                            <div className={`admin-activity-status ${activity.status}`}>
                                                <div className="status-dot"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="admin-section">
                                <div className="admin-section-header">
                                    <h2 className="admin-section-title">Quick Actions</h2>
                                </div>

                                <div className="admin-actions-grid">
                                    <button className="admin-action-card" onClick={openAddUserModal}>
                                        <div className="admin-action-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                            </svg>
                                        </div>
                                        <div className="admin-action-content">
                                            <h3>Add New User</h3>
                                            <p>Create a new user account</p>
                                        </div>
                                    </button>

                                    <button className="admin-action-card" onClick={() => setActiveTab("bookings")}>
                                        <div className="admin-action-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                                            </svg>
                                        </div>
                                        <div className="admin-action-content">
                                            <h3>Manage Bookings</h3>
                                            <p>View and edit bookings</p>
                                        </div>
                                    </button>

                                    <button className="admin-action-card" onClick={() => setActiveTab("analytics")}>
                                        <div className="admin-action-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                                            </svg>
                                        </div>
                                        <div className="admin-action-content">
                                            <h3>View Analytics</h3>
                                            <p>Detailed reports & insights</p>
                                        </div>
                                    </button>

                                    <button className="admin-action-card" onClick={() => setShowHotelModal(true)}>
                                        <div className="admin-action-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                            </svg>
                                        </div>
                                        <div className="admin-action-content">
                                            <h3>Add Hotels</h3>
                                            <p>Add or modify properties</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === "bookings" && (
                        <div className="bookings-management">
                            <div className="bookings-header">
                                <h2>Bookings Management</h2>
                                <div className="bookings-controls">
                                    <input
                                        type="text"
                                        placeholder="Search bookings..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                    <select
                                        value={bookingFilter}
                                        onChange={(e) => setBookingFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Bookings</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="pending">Pending</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bookings-stats">
                                <div className="booking-stat">
                                    <span className="stat-number">{stats.confirmedBookings}</span>
                                    <span className="stat-label">Confirmed</span>
                                </div>
                                <div className="booking-stat">
                                    <span className="stat-number">{stats.pendingBookings}</span>
                                    <span className="stat-label">Pending</span>
                                </div>
                                <div className="booking-stat">
                                    <span className="stat-number">{stats.cancelledBookings}</span>
                                    <span className="stat-label">Cancelled</span>
                                </div>
                            </div>

                            <div className="bookings-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Booking ID</th>
                                            <th>Guest Name</th>
                                            <th>Hotel</th>
                                            <th>Check-in</th>
                                            <th>Check-out</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBookings.map((booking) => {
                                            const hotel = hotelsData.find((h) => h.id === booking.hotelId);
                                            const userName = getUserName(booking.userId);
                                            const cancellationStatus = canCancelBooking(booking);
                                            return (
                                                <tr key={booking.id}>
                                                    <td>{booking.id}</td>
                                                    <td>{userName}</td>
                                                    <td>{hotel?.name || booking.hotelName || "Unknown Hotel"}</td>
                                                    <td>{booking.checkIn}</td>
                                                    <td>{booking.checkOut}</td>
                                                    <td>{formatCurrency(booking.totalPrice || 0, booking.currency || "INR")}</td>
                                                    <td>{getStatusBadge(booking.status)}</td>
                                                    <td>
                                                        <button
                                                            className="btn-action"
                                                            onClick={() =>
                                                                setSelectedBooking({
                                                                    ...booking,
                                                                    userName,
                                                                    cancellationStatus,
                                                                })
                                                            }
                                                        >
                                                            Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "users" && (
                        <div className="users-management">
                            <div className="users-header">
                                <h2>Users Management</h2>
                                <div className="users-controls">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                    <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="filter-select">
                                        <option value="all">All Users</option>
                                        <option value="active">Active</option>
                                        <option value="banned">Banned</option>
                                    </select>
                                    <button className="btn btn-primary" onClick={openAddUserModal}>
                                        Add New User
                                    </button>
                                </div>
                            </div>

                            <div className="users-stats">
                                <div className="user-stat">
                                    <span className="stat-number">{userStats.total}</span>
                                    <span className="stat-label">Total Users</span>
                                </div>
                                <div className="user-stat">
                                    <span className="stat-number">{userStats.active}</span>
                                    <span className="stat-label">Active</span>
                                </div>
                                <div className="user-stat">
                                    <span className="stat-number">{userStats.banned}</span>
                                    <span className="stat-label">Banned</span>
                                </div>
                                <div className="user-stat">
                                    <span className="stat-number">{userStats.newThisMonth}</span>
                                    <span className="stat-label">New This Month</span>
                                </div>
                                <div className="user-stat">
                                    <span className="stat-number">
                                        {userStats.growthRate >= 0 ? "+" : ""}
                                        {userStats.growthRate}%
                                    </span>
                                    <span className="stat-label">Growth Rate</span>
                                </div>
                            </div>

                            <div className="users-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Join Date</th>
                                            <th>Bookings</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id}>
                                                <td>{user.id}</td>
                                                <td>{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>{new Date(user.joinDate).toLocaleDateString()}</td>
                                                <td>{user.bookings}</td>
                                                <td>
                                                    <span
                                                        className={`status-badge ${user.status === "active" ? "status-success" : "status-error"}`}
                                                        style={{ cursor: "pointer" }}
                                                        onClick={() => handleToggleUserStatus(user.id)}
                                                        title={`Click to ${user.status === "active" ? "ban" : "activate"} user`}
                                                    >
                                                        {user.status || "active"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn-action" onClick={() => openEditUserModal(user)}>
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn-action btn-danger"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        style={{ marginLeft: "8px" }}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {filteredUsers.length === 0 && (
                                    <div className="empty-state">
                                        <p>No users found matching your criteria.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "analytics" && (
                        <div className="analytics-section">
                            <h2>Analytics & Reports</h2>
                            <div className="analytics-grid">
                                <div className="analytics-card">
                                    <h3>Monthly Bookings</h3>
                                    <div className="chart-container">
                                        {analyticsData.monthlyBookings.map((month, index) => (
                                            <div key={index} className="chart-bar">
                                                <div
                                                    className="bar"
                                                    style={{
                                                        height: `${(month.bookings / Math.max(...analyticsData.monthlyBookings.map((m) => m.bookings), 1)) * 100}%`,
                                                    }}
                                                ></div>
                                                <span className="bar-label">{month.month}</span>
                                                <span className="bar-value">{month.bookings}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="analytics-card">
                                    <h3>Revenue by City</h3>
                                    <div className="revenue-list">
                                        {analyticsData.revenueByCity.map((city, index) => (
                                            <div key={index} className="revenue-item">
                                                <span className="city-name">{city.city}</span>
                                                <span className="city-revenue">{formatCurrency(city.revenue, "INR")}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="analytics-card">
                                    <h3>Top Hotels</h3>
                                    <div className="hotels-list">
                                        {analyticsData.topHotels.map((hotel, index) => (
                                            <div key={index} className="hotel-item">
                                                <span className="hotel-name">{hotel.hotel}</span>
                                                <span className="hotel-bookings">{hotel.bookings} bookings</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="analytics-card">
                                    <h3>Quick Stats</h3>
                                    <div className="quick-stats">
                                        <div className="quick-stat">
                                            <span className="stat-value">{formatCurrency(stats.monthlyRevenue, "INR")}</span>
                                            <span className="stat-name">This Month Revenue</span>
                                        </div>
                                        <div className="quick-stat">
                                            <span className="stat-value">
                                                {stats.totalBookings > 0
                                                    ? ((stats.confirmedBookings / stats.totalBookings) * 100).toFixed(1)
                                                    : 0}
                                                %
                                            </span>
                                            <span className="stat-name">Booking Success Rate</span>
                                        </div>
                                        <div className="quick-stat">
                                            <span className="stat-value">
                                                {stats.totalBookings > 0
                                                    ? formatCurrency(stats.revenue / stats.totalBookings, "INR")
                                                    : formatCurrency(0, "INR")}
                                            </span>
                                            <span className="stat-name">Avg. Booking Value</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "chat" && (
                        <div className="admin-section" style={{ padding: 0, background: 'transparent' }}>
                            <AdminChat />
                        </div>
                    )}

                    {activeTab === "hotels" && (
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <h2 className="admin-section-title">Manage Hotels</h2>
                                <button className="btn btn-primary" onClick={() => { setShowHotelModal(true); setSelectedHotel(null); setNewHotel({ name: '', city: '', state: '', location: '', rating: 5, price: '', amenities: [], status: 'active', rooms: 0, images: [] }); }}>Add Hotel</button>
                            </div>
                            <div className="hotel-table-wrapper" style={{ overflowX: 'auto', background: '#181f2f', borderRadius: 16, boxShadow: '0 4px 24px rgba(32,201,151,0.08)', padding: 24 }}>
                                <table className="hotel-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(32,201,151,0.08)' }}>
                                            <th style={{ padding: '16px 12px', color: '#20c997', fontWeight: 700, fontSize: 16 }}>Name</th>
                                            <th style={{ padding: '16px 12px', color: '#20c997', fontWeight: 700, fontSize: 16 }}>City</th>
                                            <th style={{ padding: '16px 12px', color: '#20c997', fontWeight: 700, fontSize: 16 }}>Location</th>
                                            <th style={{ padding: '16px 12px', color: '#20c997', fontWeight: 700, fontSize: 16 }}>Rating</th>
                                            <th style={{ padding: '16px 12px', color: '#20c997', fontWeight: 700, fontSize: 16 }}>Price</th>
                                            <th style={{ padding: '16px 12px', color: '#20c997', fontWeight: 700, fontSize: 16 }}>Status</th>
                                            <th style={{ padding: '16px 12px', color: '#20c997', fontWeight: 700, fontSize: 16 }}>Amenities</th>
                                            <th style={{ padding: '16px 12px', color: '#20c997', fontWeight: 700, fontSize: 16 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hotelsData.map((hotel, index) => (
                                            <tr key={hotel.id || hotel._id || `hotel-${index}`} style={{ background: '#232b47', borderRadius: 12, boxShadow: '0 2px 8px rgba(32,201,151,0.04)' }}>
                                                <td style={{ padding: '14px 12px', color: '#fff', fontWeight: 600 }}>{hotel.name}</td>
                                                <td style={{ padding: '14px 12px', color: '#fff', fontWeight: 500 }}>{hotel.city}</td>
                                                <td style={{ padding: '14px 12px', color: '#fff', fontWeight: 500 }}>{hotel.location}</td>
                                                <td style={{ padding: '14px 12px', color: '#ffd700', fontWeight: 700 }}>{hotel.rating}</td>
                                                <td style={{ padding: '14px 12px', color: '#20c997', fontWeight: 700 }}>{formatCurrency(hotel.price, "INR")}</td>
                                                <td style={{ padding: '14px 12px', color: hotel.status === 'active' ? '#20c997' : '#ff6b35', fontWeight: 700 }}>{hotel.status}</td>
                                                <td style={{ padding: '14px 12px', color: '#b8bcc8', fontWeight: 400, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(hotel.amenities || []).join(', ')}</td>
                                                <td style={{ padding: '14px 12px' }}>
                                                    <button className="btn btn-action" style={{ marginRight: 8, background: '#20c997', color: '#fff', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }} onClick={() => { setShowHotelModal(true); setSelectedHotel(hotel); setHotelFormData({ ...hotel }); }}>Edit</button>
                                                    <button className="btn btn-action btn-danger" style={{ background: '#ff6b35', color: '#fff', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }} onClick={async () => { 
                                                        if (window.confirm('Delete this hotel?')) { 
                                                            setLoading(true); 
                                                            try { 
                                                                const hotelId = hotel.id || hotel._id; 
                                                                if (!hotelId) { 
                                                                    throw new Error('Hotel ID not found'); 
                                                                } 
                                                                const response = await deleteHotel(hotelId); 
                                                                if (response && response.success) { 
                                                                    await loadData(); 
                                                                    if (toast && typeof toast.success === 'function') toast.success("Hotel deleted successfully!"); 
                                                                } else { 
                                                                    throw new Error(response?.message || "Failed to delete hotel"); 
                                                                } 
                                                            } catch (error) {
                                                                if (toast && typeof toast.error === 'function') toast.error(error.message || "Error deleting hotel");
                                                            } finally {
                                                                setLoading(false); 
                                                            } 
                                                        } 
                                                    }}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {selectedBooking && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Edit Booking #{selectedBooking.id}</h3>
                            <button onClick={() => setSelectedBooking(null)} className="close-btn">
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                <strong>Guest:</strong> {selectedBooking.userName}
                            </p>
                            <p>
                                <strong>User ID:</strong> {selectedBooking.userId}
                            </p>
                            <p>
                                <strong>Hotel:</strong>{" "}
                                {hotelsData.find((h) => h.id === selectedBooking.hotelId)?.name || selectedBooking.hotelName}
                            </p>
                                                        <p>
                                                                <strong>Check-in:</strong> {(() => {
                                                                    if (!selectedBooking.checkIn || typeof selectedBooking.checkIn !== 'string') return 'Invalid Date';
                                                                    let date = new Date(selectedBooking.checkIn.includes('T') ? selectedBooking.checkIn : selectedBooking.checkIn + 'T00:00:00');
                                                                    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
                                                                })()}
                                                        </p>
                                                        <p>
                                                                <strong>Check-out:</strong> {(() => {
                                                                    if (!selectedBooking.checkOut || typeof selectedBooking.checkOut !== 'string') return 'Invalid Date';
                                                                    let date = new Date(selectedBooking.checkOut.includes('T') ? selectedBooking.checkOut : selectedBooking.checkOut + 'T00:00:00');
                                                                    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
                                                                })()}
                                                        </p>
                                                        <p>
                                                                <strong>Guests:</strong> {
                                                                    typeof selectedBooking.guests === 'object' || selectedBooking.guests == null
                                                                        ? '1 guest'
                                                                        : selectedBooking.guests === '6+'
                                                                            ? '6+ guests'
                                                                            : `${selectedBooking.guests} guest${Number(selectedBooking.guests) > 1 ? 's' : ''}`
                                                                }
                                                        </p>
                                                        <p>
                                                                <strong>Amount:</strong>{" "}
                                                                {(() => {
                                                                    const amt = Number(selectedBooking.totalPrice);
                                                                    return Number.isFinite(amt) && amt > 0
                                                                        ? formatCurrency(amt, selectedBooking.currency || 'INR')
                                                                        : '₹0';
                                                                })()}
                                                        </p>
                            <p>
                                <strong>Current Status:</strong> {getStatusBadge(selectedBooking.status)}
                            </p>
                            <p>
                                <strong>Booking Date:</strong> {new Date(selectedBooking.bookingDate).toLocaleDateString()}
                            </p>
                            {!selectedBooking.cancellationStatus?.canCancel && (
                                <div className="warning-message">
                                    <strong>⚠️ Warning:</strong> This booking is within 24 hours of check-in (
                                    {selectedBooking.cancellationStatus?.hoursRemaining.toFixed(1)} hours remaining). Cancellation may
                                    result in penalties for the guest.
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn btn-success"
                                onClick={() => handleBookingStatusChange(selectedBooking.id, "confirmed")}
                                disabled={selectedBooking.status === "confirmed"}
                            >
                                Confirm
                            </button>
                            <button
                                className="btn btn-warning"
                                onClick={() => handleBookingStatusChange(selectedBooking.id, "pending")}
                                disabled={selectedBooking.status === "pending"}
                            >
                                Set Pending
                            </button>
                            <button className="btn btn-danger" onClick={() => handleCancelBooking(selectedBooking.id)}>
                                {selectedBooking.cancellationStatus?.canCancel ? "Cancel Booking" : "Force Cancel (24hr violation)"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUserModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{selectedUser ? "Edit User" : "Add New User"}</h3>
                            <button onClick={() => setShowUserModal(false)} className="close-btn">
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="user-form">
                                <div className="form-group">
                                    <label htmlFor="userName">Name *</label>
                                    <input
                                        type="text"
                                        id="userName"
                                        value={selectedUser ? userFormData.name : newUser.name}
                                        onChange={(e) =>
                                            selectedUser
                                                ? setUserFormData({ ...userFormData, name: e.target.value })
                                                : setNewUser({ ...newUser, name: e.target.value })
                                        }
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="userEmail">Email *</label>
                                    <input
                                        type="email"
                                        id="userEmail"
                                        value={selectedUser ? userFormData.email : newUser.email}
                                        onChange={(e) =>
                                            selectedUser
                                                ? setUserFormData({ ...userFormData, email: e.target.value })
                                                : setNewUser({ ...newUser, email: e.target.value })
                                        }
                                        placeholder="Enter email address"
                                        required
                                    />
                                </div>
                                {!selectedUser && (
                                    <div className="form-info security-notice">
                                        <p>
                                            🔒 <strong>Security Notice:</strong> New users will be created with a temporary password and will
                                            be required to set their own password on first login.
                                        </p>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label htmlFor="userStatus">Status</label>
                                    <div className="custom-select">
                                        <select
                                            id="userStatus"
                                            value={selectedUser ? userFormData.status : newUser.status}
                                            onChange={(e) =>
                                                selectedUser
                                                    ? setUserFormData({ ...userFormData, status: e.target.value })
                                                    : setNewUser({ ...newUser, status: e.target.value })
                                            }
                                        >
                                            <option value="active">Active</option>
                                            <option value="banned">Banned</option>
                                        </select>
                                    </div>
                                </div>
                                {selectedUser && (
                                    <div className="form-info">
                                        <p>
                                            <strong>User ID:</strong> {selectedUser.id}
                                        </p>
                                        <p>
                                            <strong>Joined:</strong> {new Date(selectedUser.joinDate).toLocaleDateString()}
                                        </p>
                                        <p>
                                            <strong>Total Bookings:</strong> {selectedUser.bookings}
                                        </p>
                                        {selectedUser.updatedAt && (
                                            <p>
                                                <strong>Last Updated:</strong> {new Date(selectedUser.updatedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={selectedUser ? handleEditUser : handleAddUser}>
                                {selectedUser ? "Update User" : "Add User"}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showHotelModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 700, width: '100%' }}>
                        <div className="modal-header">
                            <h3>{selectedHotel ? 'Edit Hotel' : 'Add Hotel'}</h3>
                            <button onClick={handleCloseHotelModal} className="close-btn">×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleHotelSubmit} className="hotel-form">
                                <div className="form-group">
                                    <label htmlFor="hotelName">Hotel Name</label>
                                    <input id="hotelName" type="text" value={selectedHotel ? hotelFormData.name : newHotel.name} onChange={e => selectedHotel ? setHotelFormData({ ...hotelFormData, name: e.target.value }) : setNewHotel({ ...newHotel, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="hotelCity">City</label>
                                    <select id="hotelCity" value={selectedHotel ? hotelFormData.city : newHotel.city} onChange={e => selectedHotel ? setHotelFormData({ ...hotelFormData, city: e.target.value }) : setNewHotel({ ...newHotel, city: e.target.value })} required>
                                        <option value="">Select City</option>
                                        {CITY_OPTIONS.map(city => <option key={city} value={city}>{city}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="hotelState">State</label>
                                    <input id="hotelState" type="text" value={selectedHotel ? hotelFormData.state : newHotel.state} onChange={e => selectedHotel ? setHotelFormData({ ...hotelFormData, state: e.target.value }) : setNewHotel({ ...newHotel, state: e.target.value })} placeholder="Enter state" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="hotelLocation">Location</label>
                                    <input id="hotelLocation" type="text" value={selectedHotel ? hotelFormData.location : newHotel.location} onChange={e => selectedHotel ? setHotelFormData({ ...hotelFormData, location: e.target.value }) : setNewHotel({ ...newHotel, location: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="hotelRating">Rating</label>
                                    <input id="hotelRating" type="number" min="1" max="5" step="0.1" value={selectedHotel ? hotelFormData.rating : newHotel.rating} onChange={e => selectedHotel ? setHotelFormData({ ...hotelFormData, rating: e.target.value }) : setNewHotel({ ...newHotel, rating: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="hotelPrice">Price (per night)</label>
                                    <input id="hotelPrice" type="number" min="0" value={selectedHotel ? hotelFormData.price : newHotel.price} onChange={e => selectedHotel ? setHotelFormData({ ...hotelFormData, price: e.target.value }) : setNewHotel({ ...newHotel, price: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="hotelAmenities">Amenities (comma separated)</label>
                                    <input id="hotelAmenities" type="text" value={selectedHotel ? (hotelFormData.amenities || []).join(', ') : (newHotel.amenities || []).join(', ')} onChange={e => selectedHotel ? setHotelFormData({ ...hotelFormData, amenities: e.target.value.split(',').map(a => a.trim()) }) : setNewHotel({ ...newHotel, amenities: e.target.value.split(',').map(a => a.trim()) })} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="hotelStatus">Status</label>
                                    <select id="hotelStatus" value={selectedHotel ? hotelFormData.status : newHotel.status} onChange={e => selectedHotel ? setHotelFormData({ ...hotelFormData, status: e.target.value }) : setNewHotel({ ...newHotel, status: e.target.value })}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="modal-actions" style={{ marginTop: 24 }}>
                                    <button className="btn btn-primary" type="submit">{selectedHotel ? 'Update Hotel' : 'Add Hotel'}</button>
                                    <button className="btn btn-secondary" type="button" onClick={handleCloseHotelModal}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;