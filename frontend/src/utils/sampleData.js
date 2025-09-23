// Sample data generator for testing admin dashboard
import { addUser } from './auth';
import { isProduction } from './security.js';

export const generateSampleData = () => {
    // Create sample users first
    const sampleUsers = [
        {
            name: "John Smith",
            email: "john.smith@example.com",
            password: "password123"
        },
        {
            name: "Sarah Johnson",
            email: "sarah.j@example.com",
            password: "password123"
        },
        {
            name: "Mike Wilson",
            email: "mike.wilson@example.com",
            password: "password123"
        },
        {
            name: "Emily Davis",
            email: "emily.davis@example.com",
            password: "password123"
        }
    ]

    // Add users (if they don't exist)
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]')
    const createdUsers = []

    sampleUsers.forEach(userData => {
        const exists = existingUsers.find(u => u.email === userData.email)
        if (!exists) {
            try {
                const newUser = addUser(userData)
                createdUsers.push(newUser)
                if (!isProduction()) {
                    console.log(`Created user: ${newUser.name}`)
                }
            } catch (error) {
                if (!isProduction()) {
                    console.log(`User ${userData.email} already exists or error:`, error.message)
                }
            }
        } else {
            createdUsers.push(exists)
        }
    })

    // Create sample bookings
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]')
    const sampleBookings = [
        {
            userId: allUsers[0]?.id || 1,
            hotelId: 1, // Taj Exotica Resort & Spa
            hotelName: "Taj Exotica Resort & Spa",
            hotelImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&crop=center&auto=format&q=80",
            hotelLocation: "Benaulim Beach, Goa, Goa",
            checkIn: "2025-08-20",
            checkOut: "2025-08-23",
            guests: 2,
            nights: 3,
            basePrice: 60000,
            serviceFee: 3000,
            taxes: 7200,
            cateringFee: 1800,
            totalPrice: 72000,
            status: 'confirmed'
        },
        {
            userId: allUsers[1]?.id || 2,
            hotelId: 3, // Grand Hyatt Goa
            hotelName: "Grand Hyatt Goa",
            hotelImage: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&crop=center&auto=format&q=80",
            hotelLocation: "Bambolim Beach, Goa, Goa",
            checkIn: "2025-08-25",
            checkOut: "2025-08-28",
            guests: 4,
            nights: 3,
            basePrice: 51000,
            serviceFee: 2550,
            taxes: 6120,
            cateringFee: 1530,
            totalPrice: 61200,
            status: 'confirmed'
        },
        {
            userId: allUsers[2]?.id || 3,
            hotelId: 4, // Park Hyatt Goa Resort
            hotelName: "Park Hyatt Goa Resort",
            hotelImage: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop&crop=center&auto=format&q=80",
            hotelLocation: "Arossim Beach, Goa, Goa",
            checkIn: "2025-08-17", // Tomorrow - within 24 hours for testing
            checkOut: "2025-08-18",
            guests: 2,
            nights: 1,
            basePrice: 16000,
            serviceFee: 800,
            taxes: 1920,
            cateringFee: 480,
            totalPrice: 19200,
            status: 'confirmed'
        },
        {
            userId: allUsers[3]?.id || 4,
            hotelId: 2, // The Leela Goa
            hotelName: "The Leela Goa",
            hotelImage: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&crop=center&auto=format&q=80",
            hotelLocation: "Cavelossim Beach, Goa, Goa",
            checkIn: "2025-09-10",
            checkOut: "2025-09-15",
            guests: 3,
            nights: 5,
            basePrice: 95000,
            serviceFee: 4750,
            taxes: 11400,
            cateringFee: 2850,
            totalPrice: 114000,
            status: 'pending'
        }
    ]

    // Add bookings (avoiding duplicates)
    const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]')

    sampleBookings.forEach(bookingData => {
        // Check if booking already exists
        const exists = existingBookings.find(b =>
            b.userId === bookingData.userId &&
            b.hotelId === bookingData.hotelId &&
            b.checkIn === bookingData.checkIn
        )

        if (!exists) {
            try {
                // Use the addBooking function but avoid the conflict check for sample data
                const bookings = JSON.parse(localStorage.getItem('bookings') || '[]')
                const newBooking = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    ...bookingData,
                    bookingDate: new Date().toISOString()
                }
                bookings.push(newBooking)
                localStorage.setItem('bookings', JSON.stringify(bookings))
                if (!isProduction()) {
                    console.log(`Created booking: ${newBooking.hotelName} for user ${bookingData.userId}`)
                }
            } catch (error) {
                if (!isProduction()) {
                    console.log('Error creating sample booking:', error.message)
                }
            }
        }
    })

    if (!isProduction()) {
        console.log('Sample data generation completed!')
    }
    return {
        users: createdUsers,
        bookingsCreated: sampleBookings.length
    }
}

// Function to clear all sample data
export const clearSampleData = () => {
    localStorage.removeItem('users')
    localStorage.removeItem('bookings')
    localStorage.removeItem('userNotifications')
    localStorage.removeItem('adminActivity')
    if (!isProduction()) {
        console.log('All sample data cleared!')
    }
}
