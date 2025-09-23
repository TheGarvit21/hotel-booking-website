import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          animations: ['framer-motion', 'gsap'],
          ui: ['swiper'],
          // Split large pages into separate chunks
          admin: ['./src/pages/AdminDashboard.jsx', './src/pages/AdminLogin.jsx'],
          hotels: ['./src/pages/Hotels.jsx', './src/pages/HotelDetails.jsx'],
          user: ['./src/pages/UserProfile.jsx', './src/pages/Bookings.jsx', './src/pages/Notifications.jsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
});