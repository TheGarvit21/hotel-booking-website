import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPriceINR } from '../utils/currency';

const HotelCard = ({ hotel, index = 0, searchState }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          delay: index * 0.1,
          ease: "power3.out"
        }
      );
    }
  }, [index]);

  const handleClick = () => {
    gsap.to(cardRef.current, {
      scale: 0.98,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // Use hotel ID if available, otherwise fall back to name
        const hotelIdentifier = hotel.id || hotel._id || hotel.name;
        navigate(`/hotel/${encodeURIComponent(hotelIdentifier)}`, searchState ? { state: searchState } : undefined);
      }
    });
  };

  const [displayPrice, setDisplayPrice] = useState(`₹${(hotel.price || 0).toLocaleString('en-IN')}`);

  useEffect(() => {
    let mounted = true;
    const update = async () => {
      const price = await formatPriceINR(hotel.price || 0);
      if (mounted) setDisplayPrice(price);
    };
    update();
    const listener = () => update();
    window.addEventListener('currency:change', listener);
    return () => { mounted = false; window.removeEventListener('currency:change', listener); };
  }, [hotel.price]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star">☆</span>);
    }

    return stars;
  };

  return (
    <div ref={cardRef} className="hotel-card" onClick={handleClick}>
      <div className="hotel-image-wrapper">
        <img
          src={hotel.image || "/placeholder.svg"}
          alt={hotel.name}
          className="hotel-image"
          loading="lazy"
        />
      </div>
      {hotel.category && (
        <div className={`hotel-category ${hotel.category.toLowerCase()}`}>
          {hotel.category}
        </div>
      )}

      <div className="hotel-info">
        <div className="hotel-content">
          <h3 className="hotel-name">{hotel.name}</h3>
          <p className="hotel-location">{hotel.location}</p>

          <div className="hotel-rating">
            <div className="rating">
              {renderStars(hotel.rating)}
              <span className="rating-text">
                {hotel.rating} ({hotel.reviews} reviews)
              </span>
            </div>
          </div>
        </div>

        <div className="hotel-bottom">
          <div className="hotel-price">
            {displayPrice}
            <span className="hotel-price-per">/night</span>
          </div>
          <div className={`hotel-availability ${hotel.available ? 'available' : 'booked'}`}>
            {hotel.available ? 'Available' : 'Booked'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
