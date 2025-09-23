import { motion as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Social icon brand colors
const socialIcons = [
  {
    url: 'https://facebook.com/LuxStayIndia',
    label: 'Facebook',
    bg: '#1877F3',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="Facebook">
        <path d="M22.675 0h-21.35C.595 0 0 .595 0 1.326v21.348C0 23.405.595 24 1.326 24h11.495v-9.294H9.691v-3.622h3.13V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.405 24 24 23.405 24 22.674V1.326C24 .595 23.405 0 22.675 0z" fill="#fff" />
      </svg>
    )
  },
  {
    url: 'https://instagram.com/LuxStayIndia',
    label: 'Instagram',
    bg: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
    svg: (
      // Provided Instagram SVG, resized to 22x22
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="-19.5036 -32.49725 169.0312 194.9835" aria-label="Instagram">
        <defs>
          <radialGradient fy="578.088" fx="158.429" gradientTransform="matrix(0 -1.98198 1.8439 0 -1031.399 454.004)" gradientUnits="userSpaceOnUse" r="65" cy="578.088" cx="158.429" id="c">
            <stop stopColor="#fd5" offset="0" />
            <stop stopColor="#fd5" offset=".1" />
            <stop stopColor="#ff543e" offset=".5" />
            <stop stopColor="#c837ab" offset="1" />
          </radialGradient>
          <radialGradient fy="473.455" fx="147.694" gradientTransform="matrix(.17394 .86872 -3.5818 .71718 1648.351 -458.493)" gradientUnits="userSpaceOnUse" r="65" cy="473.455" cx="147.694" id="d">
            <stop stopColor="#3771c8" offset="0" />
            <stop offset=".128" stopColor="#3771c8" />
            <stop stopOpacity="0" stopColor="#60f" offset="1" />
          </radialGradient>
        </defs>
        <path d="M65.033 0C37.891 0 29.953.028 28.41.156c-5.57.463-9.036 1.34-12.812 3.22-2.91 1.445-5.205 3.12-7.47 5.468-4.125 4.282-6.625 9.55-7.53 15.812-.44 3.04-.568 3.66-.594 19.188-.01 5.176 0 11.988 0 21.125 0 27.12.03 35.05.16 36.59.45 5.42 1.3 8.83 3.1 12.56 3.44 7.14 10.01 12.5 17.75 14.5 2.68.69 5.64 1.07 9.44 1.25 1.61.07 18.02.12 34.44.12 16.42 0 32.84-.02 34.41-.1 4.4-.207 6.955-.55 9.78-1.28a27.22 27.22 0 0017.75-14.53c1.765-3.64 2.66-7.18 3.065-12.317.088-1.12.125-18.977.125-36.81 0-17.836-.04-35.66-.128-36.78-.41-5.22-1.305-8.73-3.127-12.44-1.495-3.037-3.155-5.305-5.565-7.624-4.3-4.108-9.56-6.608-15.829-7.512C102.338.157 101.733.027 86.193 0z" fill="url(#c)" />
        <path d="M65.033 0C37.891 0 29.953.028 28.41.156c-5.57.463-9.036 1.34-12.812 3.22-2.91 1.445-5.205 3.12-7.47 5.468-4.125 4.282-6.625 9.55-7.53 15.812-.44 3.04-.568 3.66-.594 19.188-.01 5.176 0 11.988 0 21.125 0 27.12.03 35.05.16 36.59.45 5.42 1.3 8.83 3.1 12.56 3.44 7.14 10.01 12.5 17.75 14.5 2.68.69 5.64 1.07 9.44 1.25 1.61.07 18.02.12 34.44.12 16.42 0 32.84-.02 34.41-.1 4.4-.207 6.955-.55 9.78-1.28a27.22 27.22 0 0017.75-14.53c1.765-3.64 2.66-7.18 3.065-12.317.088-1.12.125-18.977.125-36.81 0-17.836-.04-35.66-.128-36.78-.41-5.22-1.305-8.73-3.127-12.44-1.495-3.037-3.155-5.305-5.565-7.624-4.3-4.108-9.56-6.608-15.829-7.512C102.338.157 101.733.027 86.193 0z" fill="url(#d)" />
        <path d="M65.003 17c-13.036 0-14.672.057-19.792.29-5.11.234-8.598 1.043-11.65 2.23-3.157 1.226-5.835 2.866-8.503 5.535-2.67 2.668-4.31 5.346-5.54 8.502-1.19 3.053-2 6.542-2.23 11.65C17.06 50.327 17 51.964 17 65s.058 14.667.29 19.787c.235 5.11 1.044 8.598 2.23 11.65 1.227 3.157 2.867 5.835 5.536 8.503 2.667 2.67 5.345 4.314 8.5 5.54 3.054 1.187 6.543 1.996 11.652 2.23 5.12.233 6.755.29 19.79.29 13.037 0 14.668-.057 19.788-.29 5.11-.234 8.602-1.043 11.656-2.23 3.156-1.226 5.83-2.87 8.497-5.54 2.67-2.668 4.31-5.346 5.54-8.502 1.18-3.053 1.99-6.542 2.23-11.65.23-5.12.29-6.752.29-19.788 0-13.036-.06-14.672-.29-19.792-.24-5.11-1.05-8.598-2.23-11.65-1.23-3.157-2.87-5.835-5.54-8.503-2.67-2.67-5.34-4.31-8.5-5.535-3.06-1.187-6.55-1.996-11.66-2.23-5.12-.233-6.75-.29-19.79-.29zm-4.306 8.65c1.278-.002 2.704 0 4.306 0 12.816 0 14.335.046 19.396.276 4.68.214 7.22.996 8.912 1.653 2.24.87 3.837 1.91 5.516 3.59 1.68 1.68 2.72 3.28 3.592 5.52.657 1.69 1.44 4.23 1.653 8.91.23 5.06.28 6.58.28 19.39s-.05 14.33-.28 19.39c-.214 4.68-.996 7.22-1.653 8.91-.87 2.24-1.912 3.835-3.592 5.514-1.68 1.68-3.275 2.72-5.516 3.59-1.69.66-4.232 1.44-8.912 1.654-5.06.23-6.58.28-19.396.28-12.817 0-14.336-.05-19.396-.28-4.68-.216-7.22-.998-8.913-1.655-2.24-.87-3.84-1.91-5.52-3.59-1.68-1.68-2.72-3.276-3.592-5.517-.657-1.69-1.44-4.23-1.653-8.91-.23-5.06-.276-6.58-.276-19.398s.046-14.33.276-19.39c.214-4.68.996-7.22 1.653-8.912.87-2.24 1.912-3.84 3.592-5.52 1.68-1.68 3.28-2.72 5.52-3.592 1.692-.66 4.233-1.44 8.913-1.655 4.428-.2 6.144-.26 15.09-.27zm29.928 7.97a5.76 5.76 0 105.76 5.758c0-3.18-2.58-5.76-5.76-5.76zm-25.622 6.73c-13.613 0-24.65 11.037-24.65 24.65 0 13.613 11.037 24.645 24.65 24.645C78.616 89.645 89.65 78.613 89.65 65S78.615 40.35 65.002 40.35zm0 8.65c8.836 0 16 7.163 16 16 0 8.836-7.164 16-16 16-8.837 0-16-7.164-16-16 0-8.837 7.163-16 16-16z" fill="#fff" />
      </svg>
    )
  },
  {
    url: 'https://twitter.com/LuxStayIndia',
    label: 'X',
    bg: '#000',
    svg: (
      <svg width="22" height="22" viewBox="0 0 1200 1227" fill="none" aria-label="X">
        <rect width="1200" height="1227" rx="240" fill="#000" />
        <path d="M908.305 0H1119.5L711.305 521.305L1200 1227H828.5L539.5 825.5L206.5 1227H0L433.5 661.5L0 0H382.5L637.5 370.5L908.305 0ZM841.5 1102H943.5L308.5 121H206.5L841.5 1102Z" fill="#fff" />
      </svg>
    )
  },
  {
    url: 'https://youtube.com/@LuxStayIndia',
    label: 'YouTube',
    bg: '#FF0000',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="YouTube">
        <path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.112C19.633 3.5 12 3.5 12 3.5s-7.633 0-9.386.574a2.994 2.994 0 0 0-2.112 2.112C0 7.94 0 12 0 12s0 4.06.502 5.814a2.994 2.994 0 0 0 2.112 2.112C4.367 20.5 12 20.5 12 20.5s7.633 0 9.386-.574a2.994 2.994 0 0 0 2.112-2.112C24 16.06 24 12 24 12s0-4.06-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#fff" />
      </svg>
    )
  }
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'linear-gradient(135deg, var(--bg-card), var(--bg-dark))',
      borderTop: '1px solid var(--border-color)',
      padding: '60px 0 30px 0',
      marginTop: '80px'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '40px',
          marginBottom: '40px'
        }}>
          {/* Brand Section */}
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 style={{
              fontSize: '28px',
              marginBottom: '16px',
              fontFamily: 'Playfair Display, serif',
              color: 'var(--primary-color)'
            }}>
              LuxStay
            </h3>
            <p style={{
              color: 'var(--text-gray)',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              Discover the incredible beauty of India through our curated selection of luxury hotels and resorts. Experience authentic Indian hospitality at its finest.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {socialIcons.map((item, index) => (
                <Motion.a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '45px',
                    height: '45px',
                    background: item.bg,
                    borderRadius: '50%',
                    fontSize: '20px',
                    textDecoration: 'none',
                    transition: 'var(--transition)'
                  }}
                >
                  {item.svg}
                </Motion.a>
              ))}
            </div>
          </Motion.div>

          {/* Quick Links */}
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 style={{
              fontSize: '20px',
              marginBottom: '20px',
              fontFamily: 'Playfair Display, serif',
              color: 'var(--text-light)'
            }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                { name: 'Home', path: '/' },
                { name: 'Hotels', path: '/hotels' },
                { name: 'My Bookings', path: '/bookings' },
                { name: 'Customer Support', path: '/support' }
              ].map((link, index) => (
                <li key={index} style={{ marginBottom: '12px' }}>
                  <Link
                    to={link.path}
                    style={{
                      color: 'var(--text-gray)',
                      textDecoration: 'none',
                      transition: 'var(--transition)',
                      display: 'inline-block'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'var(--primary-color)';
                      e.target.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--text-gray)';
                      e.target.style.transform = 'translateX(0)';
                    }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Motion.div>

          {/* Popular Destinations */}
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 style={{
              fontSize: '20px',
              marginBottom: '20px',
              fontFamily: 'Playfair Display, serif',
              color: 'var(--text-light)'
            }}>
              Popular Destinations
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                { name: 'Mumbai Hotels', path: '/hotels?city=Mumbai' },
                { name: 'Delhi Hotels', path: '/hotels?city=Delhi' },
                { name: 'Bangalore Hotels', path: '/hotels?city=Bangalore' },
                { name: 'Goa Resorts', path: '/hotels?city=Goa' },
                { name: 'Jaipur Palaces', path: '/hotels?city=Jaipur' },
                { name: 'Kolkata Hotels', path: '/hotels?city=Kolkata' }
              ].map((destination, index) => (
                <li key={index} style={{ marginBottom: '12px' }}>
                  <Link
                    to={destination.path}
                    style={{
                      color: 'var(--text-gray)',
                      textDecoration: 'none',
                      transition: 'var(--transition)',
                      display: 'inline-block'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'var(--primary-color)';
                      e.target.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--text-gray)';
                      e.target.style.transform = 'translateX(0)';
                    }}
                  >
                    {destination.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Motion.div>

          {/* Contact Info */}
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 style={{
              fontSize: '20px',
              marginBottom: '20px',
              fontFamily: 'Playfair Display, serif',
              color: 'var(--text-light)'
            }}>
              Contact Us
            </h4>
            <div style={{ color: 'var(--text-gray)', lineHeight: '1.8' }}>
              <p style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📧</span> support@LuxStay.in
              </p>
              <p style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📞</span> +91 1800-123-4567
              </p>
              <p style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📍</span> Mumbai, Maharashtra, India
              </p>
              <p style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🕒</span> 24/7 Customer Support
              </p>
            </div>
          </Motion.div>
        </div>

        {/* Bottom Bar */}
        <Motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <p style={{ color: 'var(--text-gray)', margin: 0 }}>
            © {currentYear} LuxStay . All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link, index) => (
              <a
                key={index}
                href="#"
                style={{
                  color: 'var(--text-gray)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--primary-color)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-gray)'}
              >
                {link}
              </a>
            ))}
          </div>
        </Motion.div>
      </div>
    </footer>
  );
};

export default Footer;
