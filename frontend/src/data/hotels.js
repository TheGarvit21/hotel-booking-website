const DATA_VERSION = 2; // bump to refresh cached dataset when rating logic changes

function setDataVersion() {
  try { localStorage.setItem('indianHotelsVersion', String(DATA_VERSION)); } catch {
    // Storage not available, continue without caching
  }
}

function getDataVersion() {
  try { return Number(localStorage.getItem('indianHotelsVersion') || '0'); } catch { return 0; }
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // 32-bit int
  }
  return h;
}

function seededRandom(seedStr) {
  const seed = Math.abs(hashCode(seedStr)) || 1;
  let x = seed % 2147483647;
  x = (x * 48271) % 2147483647;
  return (x - 1) / 2147483646; // in (0,1)
}

function realisticRating(name, price) {
  // Price-informed ranges; higher price -> higher baseline
  let min = 3.8, max = 4.3;
  if (price >= 18000) { min = 4.6; max = 4.9; }
  else if (price >= 15000) { min = 4.4; max = 4.8; }
  else if (price >= 12000) { min = 4.2; max = 4.6; }
  else if (price >= 9000) { min = 4.0; max = 4.4; }
  else { min = 3.8; max = 4.2; }

  // Deterministic jitter based on name
  const r = seededRandom(name);
  const val = min + r * (max - min);
  return Math.round(val * 10) / 10;
}

export const generateIndianHotels = () => {
  const indianHotelData = [
    // Goa Hotels (12, added 2 budget hotels)
    { city: 'Goa', state: 'Goa', country: 'India', hotelType: 'Taj Exotica Resort & Spa', landmark: 'Benaulim Beach', imageId: 'goa-exotica' },
    { city: 'Goa', state: 'Goa', country: 'India', hotelType: 'The Leela Goa', landmark: 'Cavelossim Beach', imageId: 'goa-leela' },
    { city: 'Goa', state: 'Goa', country: 'India', hotelType: 'Grand Hyatt Goa', landmark: 'Bambolim Beach', imageId: 'goa-hyatt' },
    { city: 'Goa', state: 'Goa', country: 'India', hotelType: 'Park Hyatt Goa Resort', landmark: 'Arossim Beach', imageId: 'goa-park' },
    { city: 'Goa', state: 'Goa', country: 'India', hotelType: 'W Goa', landmark: 'Vagator Beach', imageId: 'goa-w' },
    { city: 'Goa', state: 'Goa', country: 'India', hotelType: 'Alila Diwa Goa', landmark: 'Majorda Beach', imageId: 'goa-alila' },
    { city: 'Goa', state: 'Goa', country: 'India', hotelType: 'Taj Fort Aguada', landmark: 'Sinquerim Beach', imageId: 'goa-aguada' },
    { city: 'Goa', state: 'Goa', country: 'India', hotelType: 'Hard Rock Hotel Goa', landmark: 'Calangute Beach', imageId: 'goa-hardrock' },
    { city: 'Goa', state: 'Goa', country: 'India', hotelType: 'Novotel Goa Candolim', landmark: 'Candolim Beach', imageId: 'goa-novotel' },
    { city: 'Goa', state: 'Goa', country: 'India', hotelType: 'Radisson Hotel Candolim', landmark: 'Candolim Beach', imageId: 'goa-radisson' },
    { city: 'Goa', state: 'Goa', country: 'India', hotelType: 'Goa Budget Inn', landmark: 'Calangute Beach', imageId: 'goa-budget1' }, // New budget hotel
    { city: 'Goa', state: 'Goa', country: 'India', hotelType: 'Cozy Stay Goa', landmark: 'Baga Beach', imageId: 'goa-budget2' }, // New budget hotel

    // Ahmedabad Hotels (12, added 2 budget hotels)
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', hotelType: 'The Leela Gandhinagar', landmark: 'Gandhinagar', imageId: 'ahmedabad-leela' },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', hotelType: 'Taj Skyline', landmark: 'Ellisbridge', imageId: 'ahmedabad-taj' },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', hotelType: 'Hyatt Regency Ahmedabad', landmark: 'Vastrapur', imageId: 'ahmedabad-hyatt' },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', hotelType: 'Radisson Blu Ahmedabad', landmark: 'Paldi', imageId: 'ahmedabad-radisson' },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', hotelType: 'Novotel Ahmedabad', landmark: 'SG Highway', imageId: 'ahmedabad-novotel' },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', hotelType: 'Crowne Plaza Ahmedabad', landmark: 'Thaltej', imageId: 'ahmedabad-crowne' },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', hotelType: 'The Fern Residency', landmark: 'Navrangpura', imageId: 'ahmedabad-fern' },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', hotelType: 'Courtyard by Marriott Ahmedabad', landmark: 'Satellite', imageId: 'ahmedabad-courtyard' },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', hotelType: 'Ramada Encore Ahmedabad', landmark: 'Vejalpur', imageId: 'ahmedabad-ramada' },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', hotelType: 'Hilton Garden Inn Ahmedabad', landmark: 'Maninagar', imageId: 'ahmedabad-hilton' },
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', hotelType: 'Ahmedabad Eco Lodge', landmark: 'Navrangpura', imageId: 'ahmedabad-budget1' }, // New budget hotel
    { city: 'Ahmedabad', state: 'Gujarat', country: 'India', hotelType: 'City Rest Ahmedabad', landmark: 'Paldi', imageId: 'ahmedabad-budget2' }, // New budget hotel

    // Bangalore Hotels (12)
    { city: 'Bangalore', state: 'Karnataka', country: 'India', hotelType: 'The Leela Palace Bangalore', landmark: 'HAL Airport Road', imageId: 'bangalore-leela' },
    { city: 'Bangalore', state: 'Karnataka', country: 'India', hotelType: 'ITC Gardenia', landmark: 'Residency Road', imageId: 'bangalore-itc' },
    { city: 'Bangalore', state: 'Karnataka', country: 'India', hotelType: 'The Oberoi Bangalore', landmark: 'MG Road', imageId: 'bangalore-oberoi' },
    { city: 'Bangalore', state: 'Karnataka', country: 'India', hotelType: 'JW Marriott Hotel Bangalore', landmark: 'Vittal Mallya Road', imageId: 'bangalore-marriott' },
    { city: 'Bangalore', state: 'Karnataka', country: 'India', hotelType: 'The Ritz-Carlton Bangalore', landmark: 'Residency Road', imageId: 'bangalore-ritz' },
    { city: 'Bangalore', state: 'Karnataka', country: 'India', hotelType: 'Taj West End Bangalore', landmark: 'Race Course Road', imageId: 'bangalore-west' },
    { city: 'Bangalore', state: 'Karnataka', country: 'India', hotelType: 'Shangri-La Hotel Bangalore', landmark: 'Lavelle Road', imageId: 'bangalore-shangri' },
    { city: 'Bangalore', state: 'Karnataka', country: 'India', hotelType: 'Conrad Bengaluru', landmark: 'Ulsoor', imageId: 'bangalore-conrad' },
    { city: 'Bangalore', state: 'Karnataka', country: 'India', hotelType: 'Hilton Bangalore Embassy Golf Links', landmark: 'Domlur', imageId: 'bangalore-hilton' },
    { city: 'Bangalore', state: 'Karnataka', country: 'India', hotelType: 'The Park Bangalore', landmark: 'Kumara Krupa Road', imageId: 'bangalore-park' },
    { city: 'Bangalore', state: 'Karnataka', country: 'India', hotelType: 'Bangalore Stay Inn', landmark: 'Koramangala', imageId: 'bangalore-budget1' }, // New budget hotel
    { city: 'Bangalore', state: 'Karnataka', country: 'India', hotelType: 'Green Nest Bangalore', landmark: 'Whitefield', imageId: 'bangalore-budget2' }, // New budget hotel

    // Chennai Hotels (12)
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', hotelType: 'ITC Grand Chola', landmark: 'Guindy', imageId: 'chennai-chola' },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', hotelType: 'The Leela Palace Chennai', landmark: 'Adyar', imageId: 'chennai-leela' },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', hotelType: 'Taj Coromandel', landmark: 'Nungambakkam', imageId: 'chennai-taj' },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', hotelType: 'Hyatt Regency Chennai', landmark: 'Anna Salai', imageId: 'chennai-hyatt' },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', hotelType: 'The Park Chennai', landmark: 'Anna Salai', imageId: 'chennai-park' },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', hotelType: 'Radisson Blu Chennai', landmark: 'Egmore', imageId: 'chennai-radisson' },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', hotelType: 'Taj Club House', landmark: 'Anna Salai', imageId: 'chennai-club' },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', hotelType: 'Hilton Chennai', landmark: 'Guindy', imageId: 'chennai-hilton' },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', hotelType: 'The Raintree Hotel', landmark: 'Alwarpet', imageId: 'chennai-raintree' },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', hotelType: 'Novotel Chennai Sipcot', landmark: 'Siruseri', imageId: 'chennai-novotel' },
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', hotelType: 'Chennai Budget Stay', landmark: 'T. Nagar', imageId: 'chennai-budget1' }, // New budget hotel
    { city: 'Chennai', state: 'Tamil Nadu', country: 'India', hotelType: 'Sea View Inn Chennai', landmark: 'Besant Nagar', imageId: 'chennai-budget2' }, // New budget hotel

    // Hyderabad Hotels (12)
    { city: 'Hyderabad', state: 'Telangana', country: 'India', hotelType: 'ITC Kohenur', landmark: 'HITEC City', imageId: 'hyderabad-itc' },
    { city: 'Hyderabad', state: 'Telangana', country: 'India', hotelType: 'Taj Falaknuma Palace', landmark: 'Falaknuma', imageId: 'hyderabad-falaknuma' },
    { city: 'Hyderabad', state: 'Telangana', country: 'India', hotelType: 'Park Hyatt Hyderabad', landmark: 'Banjara Hills', imageId: 'hyderabad-park' },
    { city: 'Hyderabad', state: 'Telangana', country: 'India', hotelType: 'Marriott Hotel Hyderabad', landmark: 'Tank Bund Road', imageId: 'hyderabad-marriott' },
    { city: 'Hyderabad', state: 'Telangana', country: 'India', hotelType: 'Novotel Hyderabad', landmark: 'HITEC City', imageId: 'hyderabad-novotel' },
    { city: 'Hyderabad', state: 'Telangana', country: 'India', hotelType: 'Sheraton Hyderabad Hotel', landmark: 'Gachibowli', imageId: 'hyderabad-sheraton' },
    { city: 'Hyderabad', state: 'Telangana', country: 'India', hotelType: 'Taj Krishna Hyderabad', landmark: 'Banjara Hills', imageId: 'hyderabad-krishna' },
    { city: 'Hyderabad', state: 'Telangana', country: 'India', hotelType: 'The Westin Hyderabad Mindspace', landmark: 'HITEC City', imageId: 'hyderabad-westin' },
    { city: 'Hyderabad', state: 'Telangana', country: 'India', hotelType: 'Radisson Hyderabad Hitec City', landmark: 'HITEC City', imageId: 'hyderabad-radisson' },
    { city: 'Hyderabad', state: 'Telangana', country: 'India', hotelType: 'Taj Banjara', landmark: 'Banjara Hills', imageId: 'hyderabad-banjara' },
    { city: 'Hyderabad', state: 'Telangana', country: 'India', hotelType: 'Hyderabad Guest House', landmark: 'Secunderabad', imageId: 'hyderabad-budget1' }, // New budget hotel
    { city: 'Hyderabad', state: 'Telangana', country: 'India', hotelType: 'Pearl Inn Hyderabad', landmark: 'Charminar', imageId: 'hyderabad-budget2' }, // New budget hotel

    // Jaipur Hotels (12)
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', hotelType: 'Taj Rambagh Palace', landmark: 'Bhawani Singh Road', imageId: 'jaipur-rambagh' },
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', hotelType: 'The Oberoi Rajvilas', landmark: 'Goner Road', imageId: 'jaipur-rajvilas' },
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', hotelType: 'ITC Rajputana', landmark: 'Palace Road', imageId: 'jaipur-rajputana' },
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', hotelType: 'Fairmont Jaipur', landmark: 'Kukas', imageId: 'jaipur-fairmont' },
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', hotelType: 'Le Meridien Jaipur', landmark: 'Riico Kukas', imageId: 'jaipur-meridien' },
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', hotelType: 'Jai Mahal Palace', landmark: 'Jacob Road', imageId: 'jaipur-jai' },
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', hotelType: 'Hilton Jaipur', landmark: 'Tonk Road', imageId: 'jaipur-hilton' },
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', hotelType: 'The Lalit Jaipur', landmark: 'Malviya Nagar', imageId: 'jaipur-lalit' },
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', hotelType: 'Trident Jaipur', landmark: 'Jal Mahal', imageId: 'jaipur-trident' },
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', hotelType: 'Radisson Jaipur City Centre', landmark: 'MI Road', imageId: 'jaipur-radisson' },
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', hotelType: 'Jaipur Heritage Stay', landmark: 'Hawa Mahal', imageId: 'jaipur-budget1' }, // New budget hotel
    { city: 'Jaipur', state: 'Rajasthan', country: 'India', hotelType: 'Pink City Inn', landmark: 'Bani Park', imageId: 'jaipur-budget2' }, // New budget hotel

    // Kolkata Hotels (12)
    { city: 'Kolkata', state: 'West Bengal', country: 'India', hotelType: 'The Oberoi Grand', landmark: 'Chowringhee', imageId: 'kolkata-oberoi' },
    { city: 'Kolkata', state: 'West Bengal', country: 'India', hotelType: 'ITC Sonar', landmark: 'Salt Lake City', imageId: 'kolkata-sonar' },
    { city: 'Kolkata', state: 'West Bengal', country: 'India', hotelType: 'Taj Bengal', landmark: 'Alipore', imageId: 'kolkata-taj' },
    { city: 'Kolkata', state: 'West Bengal', country: 'India', hotelType: 'JW Marriott Kolkata', landmark: 'Ballygunge', imageId: 'kolkata-marriott' },
    { city: 'Kolkata', state: 'West Bengal', country: 'India', hotelType: 'The Lalit Great Eastern', landmark: 'Dalhousie Square', imageId: 'kolkata-lalit' },
    { city: 'Kolkata', state: 'West Bengal', country: 'India', hotelType: 'Hyatt Regency Kolkata', landmark: 'Salt Lake City', imageId: 'kolkata-hyatt' },
    { city: 'Kolkata', state: 'West Bengal', country: 'India', hotelType: 'The Park Kolkata', landmark: 'Park Street', imageId: 'kolkata-park' },
    { city: 'Kolkata', state: 'West Bengal', country: 'India', hotelType: 'Swissotel Kolkata', landmark: 'Rajarhat', imageId: 'kolkata-swissotel' },
    { city: 'Kolkata', state: 'West Bengal', country: 'India', hotelType: 'Novotel Kolkata', landmark: 'New Town', imageId: 'kolkata-novotel' },
    { city: 'Kolkata', state: 'West Bengal', country: 'India', hotelType: 'The Kenilworth', landmark: 'Camac Street', imageId: 'kolkata-kenilworth' },
    { city: 'Kolkata', state: 'West Bengal', country: 'India', hotelType: 'Kolkata Budget Retreat', landmark: 'Park Street', imageId: 'kolkata-budget1' }, // New budget hotel
    { city: 'Kolkata', state: 'West Bengal', country: 'India', hotelType: 'City Haven Kolkata', landmark: 'Salt Lake', imageId: 'kolkata-budget2' }, // New budget hotel

    // Mumbai Hotels (12)
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', hotelType: 'The Taj Mahal Palace', landmark: 'Gateway of India', imageId: 'mumbai-taj' },
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', hotelType: 'The Oberoi Mumbai', landmark: 'Marine Drive', imageId: 'mumbai-oberoi' },
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', hotelType: 'ITC Grand Central', landmark: 'Parel', imageId: 'mumbai-itc' },
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', hotelType: 'JW Marriott Mumbai', landmark: 'Juhu Beach', imageId: 'mumbai-marriott' },
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', hotelType: 'The St. Regis Mumbai', landmark: 'Lower Parel', imageId: 'mumbai-regis' },
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', hotelType: 'Trident Nariman Point', landmark: 'Nariman Point', imageId: 'mumbai-trident' },
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', hotelType: 'Sofitel Mumbai BKC', landmark: 'Bandra Kurla Complex', imageId: 'mumbai-sofitel' },
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', hotelType: 'Grand Hyatt Mumbai', landmark: 'Santacruz', imageId: 'mumbai-hyatt' },
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', hotelType: 'Hilton Mumbai International Airport', landmark: 'Andheri East', imageId: 'mumbai-hilton' },
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', hotelType: 'The Leela Mumbai', landmark: 'Andheri East', imageId: 'mumbai-leela' },
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', hotelType: 'Mumbai Backpackers', landmark: 'Colaba', imageId: 'mumbai-budget1' }, // New budget hotel
    { city: 'Mumbai', state: 'Maharashtra', country: 'India', hotelType: 'Sea Shore Inn', landmark: 'Juhu', imageId: 'mumbai-budget2' }, // New budget hotel

    // New Delhi Hotels (12)
    { city: 'New Delhi', state: 'Delhi', country: 'India', hotelType: 'The Imperial New Delhi', landmark: 'Connaught Place', imageId: 'delhi-imperial' },
    { city: 'New Delhi', state: 'Delhi', country: 'India', hotelType: 'The Leela Palace New Delhi', landmark: 'Chanakyapuri', imageId: 'delhi-leela' },
    { city: 'New Delhi', state: 'Delhi', country: 'India', hotelType: 'ITC Maurya', landmark: 'Diplomatic Enclave', imageId: 'delhi-maurya' },
    { city: 'New Delhi', state: 'Delhi', country: 'India', hotelType: 'The Taj Mahal Hotel', landmark: 'Man Singh Road', imageId: 'delhi-taj' },
    { city: 'New Delhi', state: 'Delhi', country: 'India', hotelType: 'Shangri-La Eros New Delhi', landmark: 'Connaught Place', imageId: 'delhi-shangri' },
    { city: 'New Delhi', state: 'Delhi', country: 'India', hotelType: 'The Lodhi New Delhi', landmark: 'Lodhi Gardens', imageId: 'delhi-lodhi' },
    { city: 'New Delhi', state: 'Delhi', country: 'India', hotelType: 'Hyatt Regency Delhi', landmark: 'Bhikaji Cama Place', imageId: 'delhi-hyatt' },
    { city: 'New Delhi', state: 'Delhi', country: 'India', hotelType: 'Roseate House New Delhi', landmark: 'Aerocity', imageId: 'delhi-roseate' },
    { city: 'New Delhi', state: 'Delhi', country: 'India', hotelType: 'Andaz Delhi', landmark: 'Aerocity', imageId: 'delhi-andaz' },
    { city: 'New Delhi', state: 'Delhi', country: 'India', hotelType: 'JW Marriott Hotel New Delhi Aerocity', landmark: 'Aerocity', imageId: 'delhi-marriott' },
    { city: 'New Delhi', state: 'Delhi', country: 'India', hotelType: 'Delhi Budget Stay', landmark: 'Paharganj', imageId: 'delhi-budget1' }, // New budget hotel
    { city: 'New Delhi', state: 'Delhi', country: 'India', hotelType: 'Heritage Inn Delhi', landmark: 'Karol Bagh', imageId: 'delhi-budget2' }, // New budget hotel

    // Pune Hotels (12)
    { city: 'Pune', state: 'Maharashtra', country: 'India', hotelType: 'JW Marriott Pune', landmark: 'Senapati Bapat Road', imageId: 'pune-marriott' },
    { city: 'Pune', state: 'Maharashtra', country: 'India', hotelType: 'The Westin Pune', landmark: 'Koregaon Park', imageId: 'pune-westin' },
    { city: 'Pune', state: 'Maharashtra', country: 'India', hotelType: 'Conrad Pune', landmark: 'Mangaldas Road', imageId: 'pune-conrad' },
    { city: 'Pune', state: 'Maharashtra', country: 'India', hotelType: 'Hyatt Regency Pune', landmark: 'Kalyani Nagar', imageId: 'pune-hyatt' },
    { city: 'Pune', state: 'Maharashtra', country: 'India', hotelType: 'The Ritz-Carlton Pune', landmark: 'Baner', imageId: 'pune-ritz' },
    { city: 'Pune', state: 'Maharashtra', country: 'India', hotelType: 'Courtyard by Marriott Pune', landmark: 'Hinjewadi', imageId: 'pune-courtyard' },
    { city: 'Pune', state: 'Maharashtra', country: 'India', hotelType: 'Sheraton Grand Pune', landmark: 'Koregaon Park', imageId: 'pune-sheraton' },
    { city: 'Pune', state: 'Maharashtra', country: 'India', hotelType: 'Novotel Pune', landmark: 'Viman Nagar', imageId: 'pune-novotel' },
    { city: 'Pune', state: 'Maharashtra', country: 'India', hotelType: 'Radisson Blu Pune', landmark: 'Khadki', imageId: 'pune-radisson' },
    { city: 'Pune', state: 'Maharashtra', country: 'India', hotelType: 'The Pride Hotel Pune', landmark: 'Shivajinagar', imageId: 'pune-pride' },
    { city: 'Pune', state: 'Maharashtra', country: 'India', hotelType: 'Pune Guest House', landmark: 'Kothrud', imageId: 'pune-budget1' }, // New budget hotel
    { city: 'Pune', state: 'Maharashtra', country: 'India', hotelType: 'Hill View Inn', landmark: 'Pune Hills', imageId: 'pune-budget2' } // New budget hotel
  ];

  const priceMap = {
    'Taj Exotica Resort & Spa': 20000,
    'The Leela Goa': 19000,
    'Grand Hyatt Goa': 17000,
    'Park Hyatt Goa Resort': 16000,
    'W Goa': 18000,
    'Alila Diwa Goa': 15000,
    'Taj Fort Aguada': 17000,
    'Hard Rock Hotel Goa': 12000,
    'Novotel Goa Candolim': 11000,
    'Radisson Hotel Candolim': 9500,
    'Goa Budget Inn': 4000,
    'Cozy Stay Goa': 3500,
    'The Leela Gandhinagar': 16000,
    'Taj Skyline': 14000,
    'Hyatt Regency Ahmedabad': 12000,
    'Radisson Blu Ahmedabad': 9500,
    'Novotel Ahmedabad': 9000,
    'Crowne Plaza Ahmedabad': 10500,
    'The Fern Residency': 8500,
    'Courtyard by Marriott Ahmedabad': 9500,
    'Ramada Encore Ahmedabad': 8000,
    'Hilton Garden Inn Ahmedabad': 9000,
    'Ahmedabad Eco Lodge': 4500,
    'City Rest Ahmedabad': 3800,
    'The Leela Palace Bangalore': 17000,
    'ITC Gardenia': 15000,
    'The Oberoi Bangalore': 16000,
    'JW Marriott Hotel Bangalore': 14000,
    'The Ritz-Carlton Bangalore': 18000,
    'Taj West End Bangalore': 15500,
    'Shangri-La Hotel Bangalore': 13000,
    'Conrad Bengaluru': 13500,
    'Hilton Bangalore Embassy Golf Links': 12000,
    'The Park Bangalore': 9000,
    'Bangalore Stay Inn': 4200,
    'Green Nest Bangalore': 3700,
    'ITC Grand Chola': 17000,
    'The Leela Palace Chennai': 16000,
    'Taj Coromandel': 15000,
    'Hyatt Regency Chennai': 11000,
    'The Park Chennai': 9000,
    'Radisson Blu Chennai': 9500,
    'Taj Club House': 10000,
    'Hilton Chennai': 12000,
    'The Raintree Hotel': 10500,
    'Novotel Chennai Sipcot': 9500,
    'Chennai Budget Stay': 4300,
    'Sea View Inn Chennai': 3900,
    'ITC Kohenur': 16000,
    'Taj Falaknuma Palace': 20000,
    'Park Hyatt Hyderabad': 15000,
    'Marriott Hotel Hyderabad': 12000,
    'Novotel Hyderabad': 11000,
    'Sheraton Hyderabad Hotel': 11500,
    'Taj Krishna Hyderabad': 14000,
    'The Westin Hyderabad Mindspace': 13000,
    'Radisson Hyderabad Hitec City': 9500,
    'Taj Banjara': 10000,
    'Hyderabad Guest House': 4100,
    'Pearl Inn Hyderabad': 3600,
    'Taj Rambagh Palace': 20000,
    'The Oberoi Rajvilas': 18000,
    'ITC Rajputana': 15000,
    'Fairmont Jaipur': 14000,
    'Le Meridien Jaipur': 12000,
    'Jai Mahal Palace': 16000,
    'Hilton Jaipur': 11000,
    'The Lalit Jaipur': 11500,
    'Trident Jaipur': 10500,
    'Radisson Jaipur City Centre': 9500,
    'Jaipur Heritage Stay': 4400,
    'Pink City Inn': 4000,
    'The Oberoi Grand': 16000,
    'ITC Sonar': 15000,
    'Taj Bengal': 17000,
    'JW Marriott Kolkata': 14000,
    'The Lalit Great Eastern': 12000,
    'Hyatt Regency Kolkata': 11000,
    'The Park Kolkata': 9000,
    'Swissotel Kolkata': 10500,
    'Novotel Kolkata': 9500,
    'The Kenilworth': 9000,
    'Kolkata Budget Retreat': 4200,
    'City Haven Kolkata': 3700,
    'The Taj Mahal Palace': 18000,
    'The Oberoi Mumbai': 16000,
    'ITC Grand Central': 12000,
    'JW Marriott Mumbai': 14000,
    'The St. Regis Mumbai': 17000,
    'Trident Nariman Point': 11000,
    'Sofitel Mumbai BKC': 13000,
    'Grand Hyatt Mumbai': 12500,
    'Hilton Mumbai International Airport': 10000,
    'The Leela Mumbai': 15000,
    'Mumbai Backpackers': 4500,
    'Sea Shore Inn': 3800,
    'The Imperial New Delhi': 17000,
    'The Leela Palace New Delhi': 18000,
    'ITC Maurya': 15000,
    'The Taj Mahal Hotel': 16000,
    'Shangri-La Eros New Delhi': 12000,
    'The Lodhi New Delhi': 15500,
    'Hyatt Regency Delhi': 11000,
    'Roseate House New Delhi': 13000,
    'Andaz Delhi': 12500,
    'JW Marriott Hotel New Delhi Aerocity': 14000,
    'Delhi Budget Stay': 4300,
    'Heritage Inn Delhi': 3900,
    'JW Marriott Pune': 14000,
    'The Westin Pune': 13000,
    'Conrad Pune': 13500,
    'Hyatt Regency Pune': 11000,
    'The Ritz-Carlton Pune': 18000,
    'Courtyard by Marriott Pune': 9500,
    'Sheraton Grand Pune': 12000,
    'Novotel Pune': 9500,
    'Radisson Blu Pune': 9000,
    'The Pride Hotel Pune': 8500,
    'Pune Guest House': 4100,
    'Hill View Inn': 3500
  };

  const indianAmenities = [
    'Free WiFi', 'Swimming Pool', 'Spa & Wellness Center', 'Ayurvedic Treatments',
    'Multi-cuisine Restaurant', '24/7 Room Service', 'Business Center', 'Valet Parking',
    'Airport Shuttle', 'Concierge Service', 'Laundry & Dry Cleaning', 'Yoga Classes',
    'Fitness Center', 'Bar & Lounge', 'Banquet Halls', 'Wedding Services',
    'Cultural Programs', 'Traditional Dance Shows', 'Rooftop Dining', 'Heritage Tours',
    'Golf Course Access', 'Tennis Court', 'Kids Play Area', 'Babysitting Services'
  ];

  const hotels = [];

  indianHotelData.forEach((data, baseIndex) => {
    const hotelId = baseIndex + 1;
    const price = priceMap[data.hotelType] || 9000;
    const rating = realisticRating(data.hotelType, price);
    const reviewCount = Math.floor(Math.random() * 1500) + 100;

    const shuffledAmenities = [...indianAmenities].sort(() => 0.5 - Math.random());
    const selectedAmenities = shuffledAmenities.slice(0, Math.floor(Math.random() * 10) + 8);

    const hotelImages = [
      `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
      `https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
      `https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
      `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
      `https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
      `https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
      `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop&crop=center&auto=format&q=80`
    ];

    const mainImage = hotelImages[baseIndex % hotelImages.length];
    const galleryImages = [];
    for (let i = 1; i <= 5; i++) {
      galleryImages.push(hotelImages[(baseIndex + i) % hotelImages.length]);
    }

    // Room-level images pools (generic but varied)
    const roomImagePools = {
      standard: [
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&h=600&fit=crop&auto=format&q=80',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop&auto=format&q=80',
        'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=800&h=600&fit=crop&auto=format&q=80'
      ],
      deluxe: [
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop&auto=format&q=80',
        'https://images.unsplash.com/photo-1560448075-bb4caa6cfcf0?w=800&h=600&fit=crop&auto=format&q=80',
        'https://images.unsplash.com/photo-1551776235-dde6d4829808?w=800&h=600&fit=crop&auto=format&q=80'
      ],
      family: [
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop&auto=format&q=80',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop&auto=format&q=80',
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop&auto=format&q=80'
      ],
      suite: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop&auto=format&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop&auto=format&q=80',
        'https://images.unsplash.com/photo-1600585154084-4e3b16d6c89f?w=800&h=600&fit=crop&auto=format&q=80'
      ]
    };

    const bathroomFeatures = {
      standard: ['Private bathroom', 'Shower', 'Free toiletries', 'Towels'],
      deluxe: ['Private bathroom', 'Rain shower', 'Hairdryer', 'Slippers', 'Premium toiletries'],
      family: ['Two bathrooms', 'Bathtub', 'Shower', 'Towels', 'Kid-friendly amenities'],
      suite: ['Marble bathroom', 'Bathtub & shower', 'Bidet', 'Bathrobes', 'Heated floor']
    };

    const baseNightly = price; // hotel-level base nightly

    hotels.push({
      id: hotelId,
      name: data.hotelType,
      location: `${data.landmark}, ${data.city}, ${data.state}`,
      city: data.city,
      state: data.state,
      country: data.country,
      landmark: data.landmark,
      rating: parseFloat(rating),
      price: price,
      currency: 'INR',
      image: mainImage,
      images: galleryImages,
      description: `Experience the epitome of luxury and Indian hospitality at ${data.hotelType}. Located in the heart of ${data.city} near ${data.landmark}, our hotel seamlessly blends traditional Indian architecture with modern amenities. Indulge in authentic regional cuisine, rejuvenate with Ayurvedic spa treatments, and immerse yourself in the rich cultural heritage of India. Whether you're here for business or leisure, our world-class service and elegant accommodations ensure an unforgettable stay in the incredible city of ${data.city}.`,
      amenities: selectedAmenities,
      reviews: reviewCount,
      available: true,
      featured: rating >= 4.3,
      category: rating >= 4.5 ? 'Luxury' : rating >= 4.0 ? 'Premium' : 'Comfort',
      // Room types: explicit basePrice and room-specific images and bathroom features
      roomTypes: [
        {
          key: 'standard',
          name: 'Standard Room',
          capacity: 2,
          sizeSqm: 24,
          basePrice: Math.round(baseNightly * 1.0),
          images: roomImagePools.standard,
          bathroom: bathroomFeatures.standard
        },
        {
          key: 'deluxe',
          name: 'Deluxe Room',
          capacity: 3,
          sizeSqm: 32,
          basePrice: Math.round(baseNightly * 1.25),
          images: roomImagePools.deluxe,
          bathroom: bathroomFeatures.deluxe
        },
        {
          key: 'family',
          name: 'Family Suite',
          capacity: 4,
          sizeSqm: 45,
          basePrice: Math.round(baseNightly * 1.6),
          images: roomImagePools.family,
          bathroom: bathroomFeatures.family
        },
        {
          key: 'suite',
          name: 'Executive Suite',
          capacity: 5,
          sizeSqm: 60,
          basePrice: Math.round(baseNightly * 2.0),
          images: roomImagePools.suite,
          bathroom: bathroomFeatures.suite
        }
      ]
    });
  });

  return hotels;
};

export const getHotelsFromStorage = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const res = await fetch('/api/hotels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const hotels = await res.json();
        if (Array.isArray(hotels)) return hotels;
      }
    } catch {
      // Swallow network errors gracefully and fall back to local data
    }
  }
  try {
    const stored = localStorage.getItem('indianHotels');
    if (stored) {
      const hotels = JSON.parse(stored);
      if (Array.isArray(hotels) && hotels.length > 0) {
        // Only run migration if ALL hotels are missing roomTypes (i.e., legacy dataset, not mixed with admin-added)
        const allMissingRoomTypes = hotels.every(h => !Array.isArray(h.roomTypes) || h.roomTypes.length === 0 || !('basePrice' in (h.roomTypes[0] || {})));
        if (allMissingRoomTypes) {
          const regenerated = generateIndianHotels();
          try { localStorage.setItem('indianHotels', JSON.stringify(regenerated)); setDataVersion(); } catch {
            // Storage not available, continue without caching
          }
          return regenerated;
        }
        // If only some hotels are missing roomTypes, do not overwrite; just return as is
        return hotels;
      }
    }
    // Only generate default hotels if localStorage is missing or empty (not on version bump alone)
    if (!stored) {
      const regenerated = generateIndianHotels();
      try { localStorage.setItem('indianHotels', JSON.stringify(regenerated)); setDataVersion(); } catch {
        // Storage not available, continue without caching
      }
      return regenerated;
    }
  } catch {
    // Ignore storage parse errors and continue
  }
  // Fallback: generate hotels if nothing in storage
  const hotels = generateIndianHotels();
  try {
    localStorage.setItem('indianHotels', JSON.stringify(hotels));
    setDataVersion();
  } catch {
    // Best-effort cache write; ignore quota errors
  }
  return hotels;
};

export const searchHotels = async (searchTerm) => {
  const hotels = await getHotelsFromStorage();
  if (!searchTerm || typeof searchTerm !== 'string') return hotels;

  const term = searchTerm.toLowerCase().trim();
  if (!term) return hotels;

  return hotels.filter(hotel => {
    if (!hotel) return false;

    const city = hotel.city || '';
    const location = hotel.location || '';
    const name = hotel.name || '';
    const landmark = hotel.landmark || '';
    const state = hotel.state || '';

    return (
      city.toLowerCase().includes(term) ||
      location.toLowerCase().includes(term) ||
      name.toLowerCase().includes(term) ||
      landmark.toLowerCase().includes(term) ||
      state.toLowerCase().includes(term)
    );
  });
};

export const getFeaturedHotels = async () => {
  const hotels = await getHotelsFromStorage();
  return hotels.filter(hotel => hotel.featured && hotel.rating >= 4.3).slice(0, 12);
};

export const getHotelsByCity = async (city) => {
  const hotels = await getHotelsFromStorage();
  const cityHotels = hotels.filter(hotel =>
    hotel.city.toLowerCase() === city.toLowerCase() && hotel.available
  );
  if (cityHotels.length !== 10) {
    console.warn(`Expected 10 hotels for ${city}, found ${cityHotels.length}`);
  }
  return cityHotels;
};

export const getHotelById = async (id) => {
  const hotels = await getHotelsFromStorage();
  return hotels.find(hotel => hotel.id === parseInt(id));
};

export const getHotelByName = async (name) => {
  const hotels = await getHotelsFromStorage();
  return hotels.find(hotel => hotel.name === name);
};