import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/ToastProvider';
import { getHotelsFromStorage } from './data/hotels';
import './styles/main.css';
import { getCurrentUser } from './utils/auth';
import { initializeSampleReviews } from './utils/sampleReviews';

// Lazy load page components for better performance
const Home = lazy(() => import('./pages/Home'));
const Hotels = lazy(() => import('./pages/Hotels'));
const HotelDetails = lazy(() => import('./pages/HotelDetails'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Auth = lazy(() => import('./pages/Auth'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const CustomerSupport = lazy(() => import('./pages/CustomerSupport'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App">
      {!isAdminRoute && <Navbar />}
      <main style={{ marginTop: isAdminRoute ? 0 : 0, paddingTop: 0 }}>
        <Suspense fallback={
          <div style={{ padding: '40px 0', minHeight: '50vh' }}>
            <div className="container">
              <div className="flex-center" style={{ minHeight: '30vh' }}>
                <div className="loading-spinner" aria-label="Loading page..." />
              </div>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/hotels/:city" element={<Hotels />} />
            <Route path="/hotel/:name" element={<HotelDetails />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/support" element={<CustomerSupport />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize hotels data on app load
    getHotelsFromStorage();

    // Initialize sample reviews for demonstration
    initializeSampleReviews();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Router>
  );
}

function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, user: null });
  useEffect(() => {
    let mounted = true;
    (async () => {
      const u = await getCurrentUser();
      if (mounted) setState({ loading: false, user: u });
    })();
    return () => { mounted = false; };
  }, []);

  if (state.loading) {
    return (
      <div style={{ padding: '40px 0', minHeight: '50vh' }}>
        <div className="container">
          <div className="flex-center" style={{ minHeight: '30vh' }}>
            <div className="loading-spinner" aria-label="Checking authentication..." />
          </div>
        </div>
      </div>
    );
  }

  if (!state.user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

export default App;
