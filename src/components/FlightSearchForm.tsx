'use client';

import { useState } from 'react';
import { Search, Calendar, Users, Loader2 } from 'lucide-react';
import AirportSelector from './AirportSelector';

interface FlightSearchFormProps {
  onSearch: (data: {
    origin: string;
    destination: string;
    originName: string;
    destinationName: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    tripType: 'roundtrip' | 'oneway';
    directFlightsOnly: boolean;
  }) => void;
  loading: boolean;
}

export default function FlightSearchForm({ onSearch, loading }: FlightSearchFormProps) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    originName: '',
    destinationName: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    tripType: 'roundtrip' as 'roundtrip' | 'oneway',
    directFlightsOnly: false
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Comprehensive airports list for quick selection
  const popularAirports = [
    // UK & Ireland
    { code: 'LHR', name: 'London Heathrow', city: 'London' },
    { code: 'LGW', name: 'London Gatwick', city: 'London' },
    { code: 'STN', name: 'London Stansted', city: 'London' },
    { code: 'LTN', name: 'London Luton', city: 'London' },
    { code: 'LCY', name: 'London City', city: 'London' },
    { code: 'MAN', name: 'Manchester', city: 'Manchester' },
    { code: 'BHX', name: 'Birmingham', city: 'Birmingham' },
    { code: 'EDI', name: 'Edinburgh', city: 'Edinburgh' },
    { code: 'GLA', name: 'Glasgow', city: 'Glasgow' },
    { code: 'BRS', name: 'Bristol', city: 'Bristol' },
    { code: 'NCL', name: 'Newcastle', city: 'Newcastle' },
    { code: 'LPL', name: 'Liverpool', city: 'Liverpool' },
    { code: 'DUB', name: 'Dublin', city: 'Dublin' },
    
    // Europe
    { code: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris' },
    { code: 'ORY', name: 'Paris Orly', city: 'Paris' },
    { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt' },
    { code: 'MUC', name: 'Munich', city: 'Munich' },
    { code: 'BER', name: 'Berlin Brandenburg', city: 'Berlin' },
    { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam' },
    { code: 'BCN', name: 'Barcelona', city: 'Barcelona' },
    { code: 'MAD', name: 'Madrid Barajas', city: 'Madrid' },
    { code: 'FCO', name: 'Rome Fiumicino', city: 'Rome' },
    { code: 'MXP', name: 'Milan Malpensa', city: 'Milan' },
    { code: 'VIE', name: 'Vienna', city: 'Vienna' },
    { code: 'ZUR', name: 'Zurich', city: 'Zurich' },
    { code: 'CPH', name: 'Copenhagen', city: 'Copenhagen' },
    { code: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm' },
    { code: 'OSL', name: 'Oslo', city: 'Oslo' },
    { code: 'HEL', name: 'Helsinki', city: 'Helsinki' },
    { code: 'WAW', name: 'Warsaw', city: 'Warsaw' },
    { code: 'PRG', name: 'Prague', city: 'Prague' },
    { code: 'BUD', name: 'Budapest', city: 'Budapest' },
    { code: 'ATH', name: 'Athens', city: 'Athens' },
    { code: 'IST', name: 'Istanbul', city: 'Istanbul' },
    { code: 'LIS', name: 'Lisbon', city: 'Lisbon' },
    
    // North America
    { code: 'JFK', name: 'New York JFK', city: 'New York' },
    { code: 'LGA', name: 'New York LaGuardia', city: 'New York' },
    { code: 'EWR', name: 'Newark', city: 'New York' },
    { code: 'LAX', name: 'Los Angeles', city: 'Los Angeles' },
    { code: 'SFO', name: 'San Francisco', city: 'San Francisco' },
    { code: 'ORD', name: 'Chicago O\'Hare', city: 'Chicago' },
    { code: 'MIA', name: 'Miami', city: 'Miami' },
    { code: 'DFW', name: 'Dallas Fort Worth', city: 'Dallas' },
    { code: 'ATL', name: 'Atlanta', city: 'Atlanta' },
    { code: 'BOS', name: 'Boston', city: 'Boston' },
    { code: 'SEA', name: 'Seattle', city: 'Seattle' },
    { code: 'DEN', name: 'Denver', city: 'Denver' },
    { code: 'LAS', name: 'Las Vegas', city: 'Las Vegas' },
    { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto' },
    { code: 'YVR', name: 'Vancouver', city: 'Vancouver' },
    
    // Asia Pacific
    { code: 'NRT', name: 'Tokyo Narita', city: 'Tokyo' },
    { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo' },
    { code: 'KIX', name: 'Osaka Kansai', city: 'Osaka' },
    { code: 'ICN', name: 'Seoul Incheon', city: 'Seoul' },
    { code: 'PEK', name: 'Beijing Capital', city: 'Beijing' },
    { code: 'PVG', name: 'Shanghai Pudong', city: 'Shanghai' },
    { code: 'HKG', name: 'Hong Kong', city: 'Hong Kong' },
    { code: 'SIN', name: 'Singapore Changi', city: 'Singapore' },
    { code: 'KUL', name: 'Kuala Lumpur', city: 'Kuala Lumpur' },
    { code: 'BKK', name: 'Bangkok Suvarnabhumi', city: 'Bangkok' },
    { code: 'DEL', name: 'Delhi', city: 'Delhi' },
    { code: 'BOM', name: 'Mumbai', city: 'Mumbai' },
    { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney' },
    { code: 'MEL', name: 'Melbourne', city: 'Melbourne' },
    { code: 'BNE', name: 'Brisbane', city: 'Brisbane' },
    { code: 'PER', name: 'Perth', city: 'Perth' },
    { code: 'AKL', name: 'Auckland', city: 'Auckland' },
    
    // Middle East & Africa
    { code: 'DXB', name: 'Dubai International', city: 'Dubai' },
    { code: 'DOH', name: 'Doha', city: 'Doha' },
    { code: 'AUH', name: 'Abu Dhabi', city: 'Abu Dhabi' },
    { code: 'CAI', name: 'Cairo', city: 'Cairo' },
    { code: 'JNB', name: 'Johannesburg', city: 'Johannesburg' },
    { code: 'CPT', name: 'Cape Town', city: 'Cape Town' },
    
    // South America
    { code: 'GRU', name: 'São Paulo Guarulhos', city: 'São Paulo' },
    { code: 'GIG', name: 'Rio de Janeiro', city: 'Rio de Janeiro' },
    { code: 'EZE', name: 'Buenos Aires Ezeiza', city: 'Buenos Aires' },
    { code: 'BOG', name: 'Bogotá', city: 'Bogotá' },
    { code: 'LIM', name: 'Lima', city: 'Lima' },
    { code: 'SCL', name: 'Santiago', city: 'Santiago' }
  ];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.origin) {
      newErrors.origin = 'Origin airport is required';
    }
    if (!formData.destination) {
      newErrors.destination = 'Destination airport is required';
    }
    if (formData.origin === formData.destination) {
      newErrors.destination = 'Origin and destination must be different';
    }
    if (!formData.departureDate) {
      newErrors.departureDate = 'Departure date is required';
    }
    if (formData.tripType === 'roundtrip' && !formData.returnDate) {
      newErrors.returnDate = 'Return date is required for round trip';
    }

    // Check if departure date is in the future
    const today = new Date().toISOString().split('T')[0];
    if (formData.departureDate && formData.departureDate < today) {
      newErrors.departureDate = 'Departure date must be in the future';
    }

    // Check if return date is after departure date
    if (formData.returnDate && formData.departureDate && formData.returnDate <= formData.departureDate) {
      newErrors.returnDate = 'Return date must be after departure date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Get the full airport names from the popularAirports array
      const originAirport = popularAirports.find(airport => airport.code === formData.origin);
      const destAirport = popularAirports.find(airport => airport.code === formData.destination);

      onSearch({
        ...formData,
        originName: originAirport ? originAirport.name : formData.origin,
        destinationName: destAirport ? destAirport.name : formData.destination
      });
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <form onSubmit={handleSubmit}>
        {/* Flight Options */}
        <div className="grid md:grid-cols-2 gap-4 mb-2">
          {/* Trip Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Trip Type</label>
            <div className="flex space-x-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="tripType"
                  value="roundtrip"
                  checked={formData.tripType === 'roundtrip'}
                  onChange={(e) => handleInputChange('tripType', e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Round trip</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="tripType"
                  value="oneway"
                  checked={formData.tripType === 'oneway'}
                  onChange={(e) => handleInputChange('tripType', e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">One way</span>
              </label>
            </div>
          </div>

          {/* Direct Flights Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Flight Preference</label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.directFlightsOnly}
                onChange={(e) => handleInputChange('directFlightsOnly', e.target.checked)}
                className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-full"
              />
              <span className="text-sm font-medium text-gray-700">Direct flights only</span>
            </label>
          </div>
        </div>

        {/* Airport Selection */}
        <div className="grid md:grid-cols-2 gap-4 mb-2">
          <AirportSelector
            value={formData.origin}
            onChange={(code) => handleInputChange('origin', code)}
            placeholder="Select origin airport"
            label="From"
            error={errors.origin}
          />

          <AirportSelector
            value={formData.destination}
            onChange={(code) => handleInputChange('destination', code)}
            placeholder="Select destination airport"
            label="To"
            error={errors.destination}
          />
        </div>

        {/* Date Selection */}
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Departure
            </label>
            <input
              type="date"
              value={formData.departureDate}
              onChange={(e) => handleInputChange('departureDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.departureDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.departureDate && <p className="mt-1 text-sm text-red-600">{errors.departureDate}</p>}
          </div>

          {formData.tripType === 'roundtrip' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Return
              </label>
              <input
                type="date"
                value={formData.returnDate}
                onChange={(e) => handleInputChange('returnDate', e.target.value)}
                min={formData.departureDate || new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.returnDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.returnDate && <p className="mt-1 text-sm text-red-600">{errors.returnDate}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Passengers
            </label>
            <select
              value={formData.passengers}
              onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Getting Price Forecast...</span>
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              <span>Get Price Forecast</span>
            </>
          )}
        </button>
      </form>

    </div>
  );
}
