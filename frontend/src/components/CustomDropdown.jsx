import { AnimatePresence, motion as Motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';

const CustomDropdown = ({ isOpen, onClose, value, onChange, options, offset = 8 }) => {
  const [hoveredOption, setHoveredOption] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      gsap.fromTo(dropdownRef.current,
        { opacity: 0, scale: 0.95, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  // Ensure the selected option is visible when opening
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const selectedNode = dropdownRef.current.querySelector('[data-selected="true"]');
      if (selectedNode && selectedNode.scrollIntoView) {
        selectedNode.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, value]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isOpen) return;
      const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      const clickedOnTrigger = event.target.closest('.nav-currency-select');
      if (!clickedInsideDropdown && !clickedOnTrigger) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleOptionClick = (option) => {
    onChange(option.value);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className="custom-dropdown"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 999999,
          marginTop: `${offset}px`,
          background: 'rgba(26, 31, 58, 0.98)',
          border: '2px solid rgba(255, 107, 53, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 107, 53, 0.2)',
          backdropFilter: 'blur(25px)',
          overflow: 'hidden',
          maxHeight: '300px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable content wrapper */}
        <div
          className="dropdown-scroll-container"
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: '#ff6b35 rgba(26, 31, 58, 0.3)',
            overscrollBehavior: 'contain'
          }}
        >
          {/* options */}
          {options.map((option, index) => (
            <Motion.div
              key={option.value}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => setHoveredOption(index)}
              onMouseLeave={() => setHoveredOption(null)}
              className="dropdown-option"
              style={{
                backgroundColor: hoveredOption === index
                  ? 'linear-gradient(135deg, #ff6b4a 0%, #ff8a6b 100%)'
                  : value === option.value
                    ? 'rgba(255, 107, 74, 0.2)'
                    : 'transparent',
                color: hoveredOption === index
                  ? '#ffffff'
                  : value === option.value
                    ? '#ff6b4a'
                    : '#ffffff',
                borderLeft: value === option.value ? '4px solid #ff6b4a' : 'none',
                borderBottom: index !== options.length - 1 ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                fontWeight: value === option.value ? '600' : '500',
                transform: hoveredOption === index ? 'translateX(4px)' : 'translateX(0)',
                transition: 'all 0.2s ease',
                padding: '16px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              data-selected={value === option.value}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: value === option.value ? '600' : '500',
                  marginBottom: option.description ? '4px' : '0',
                  fontSize: '16px',
                  lineHeight: '1.4'
                }}>
                  {option.label}
                </div>
                {option.description && (
                  <div style={{
                    fontSize: '12px',
                    opacity: hoveredOption === index ? 0.9 : 0.7,
                    color: hoveredOption === index
                      ? 'rgba(255,255,255,0.9)'
                      : value === option.value
                        ? 'rgba(255, 107, 74, 0.8)'
                        : 'rgba(255, 255, 255, 0.7)',
                    lineHeight: '1.3'
                  }}>
                    {option.description}
                  </div>
                )}
              </div>
              {option.icon && (
                <span style={{
                  fontSize: '20px',
                  marginLeft: '12px',
                  opacity: hoveredOption === index ? 1 : 0.8,
                  transform: hoveredOption === index ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}>
                  {option.icon}
                </span>
              )}
            </Motion.div>
          ))}
        </div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default CustomDropdown;