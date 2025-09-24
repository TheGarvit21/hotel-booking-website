"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { loginUser } from "../utils/auth"
import "./AdminLogin.css"

const AdminLogin = ({ onLogin }) => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        console.log("[v0] Form submitted with data:", formData)
        setIsLoading(true)
        setError("")

        try {
            console.log("[v0] Checking credentials...")
            console.log("[v0] Email:", formData.email)
            console.log("[v0] Password:", formData.password)

            // Use backend authentication
            const result = await loginUser(formData.email, formData.password)
            console.log("[v0] Backend response:", result)

            if (result.success) {
                console.log("[v0] Login successful, user:", result.user)

                // Check if user is admin
                if (result.user.role === 'admin') {
                    console.log("[v0] Admin user confirmed, calling onLogin")
                    onLogin && onLogin(result.user)
                    // Navigate to admin dashboard
                    navigate('/admin/dashboard')
                } else {
                    console.log("[v0] User is not admin, role:", result.user.role)
                    setError("Access denied. Admin privileges required.")
                }
            } else {
                console.log("[v0] Login failed:", result.error)
                setError(result.error || "Invalid credentials")
            }
        } catch (err) {
            console.log("[v0] Login error:", err)
            console.log("[v0] Error details:", err.message, err.stack)
            setError("Login failed. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="admin-login-container">
            <div className="admin-login-background">
                <div className="floating-orb orb-1"></div>
                <div className="floating-orb orb-2"></div>
                <div className="floating-orb orb-3"></div>
                <div className="grid-overlay"></div>
            </div>

            <div className="admin-login-card">
                <div className="admin-login-header">
                    <div className="admin-logo">
                        <div className="logo-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="admin-login-title">Admin Portal</h1>
                    <p className="admin-login-subtitle">Sign in to access the dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="admin-login-form">
                    {error && (
                        <div className="admin-error-message">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-8 5-8-5V6l8 5 8-5v2z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <div className="input-wrapper">
                            <div className="input-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="form-input enhanced"
                                placeholder="Enter your email"
                                required
                            />
                            {/* <label htmlFor="email" className="floating-label">
                                Email Address
                            </label> */}
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-wrapper">
                            <div className="input-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                </svg>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="form-input enhanced"
                                placeholder="Enter your password"
                                required
                            />
                            <span
                                className="password-eye-icon"
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 2 }}
                                onClick={() => setShowPassword((v) => !v)}
                                tabIndex={0}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5.05 0-9.29-3.16-11-8 1.09-2.73 2.99-4.98 5.38-6.32M1 1l22 22" /><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5 0-.47-.09-.92-.26-1.33" /></svg>
                                ) : (
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
                                )}
                            </span>
                            {/* <label htmlFor="password" className="floating-label">
                                Password
                            </label> */}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="remember-me">
                            <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleInputChange} />
                            <span>
                                {formData.rememberMe && (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                )}
                            </span>
                            Remember me
                        </label>
                    </div>

                    <button
                        type="submit"
                        className={`btn btn-primary admin-login-btn enhanced ${isLoading ? "loading" : ""}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner"></div>
                                Signing In...
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M10 17l5-5-5-5v10z" />
                                </svg>
                                Sign In
                                <div className="btn-shine"></div>
                            </>
                        )}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <a href="#" className="admin-forgot-link">
                        Forgot your password?
                    </a>
                </div>
            </div>
        </div>
    )
}

export default AdminLogin
