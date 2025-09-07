'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Airport } from '@/lib/amadeus';

interface AirportSelectorProps {
  value: string;
  onChange: (airportCode: string) => void;
  placeholder: string;
  label: string;
  error?: string;
}

export default function AirportSelector({ 
  value, 
  onChange, 
  placeholder, 
  label, 
  error 
}: AirportSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load popular airports on mount
  useEffect(() => {
    loadAirports('');
  }, []);

  // Handle clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search airports with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== selectedAirport?.name && searchTerm !== selectedAirport?.iataCode) {
        loadAirports(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedAirport]);

  const loadAirports = async (keyword: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/airports${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`);
      const data = await response.json();
      
      if (data.success) {
        setAirports(data.airports);
      }
    } catch (error) {
      console.error('Failed to load airports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearchTerm(inputValue);
    setIsOpen(true);
    
    // Clear selection if user is typing something different
    if (selectedAirport && inputValue !== selectedAirport.name && inputValue !== selectedAirport.iataCode) {
      setSelectedAirport(null);
      onChange('');
    }
  };

  const handleAirportSelect = (airport: Airport) => {
    setSelectedAirport(airport);
    setSearchTerm(airport.iataCode);
    onChange(airport.iataCode);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (!searchTerm && airports.length === 0) {
      loadAirports('');
    }
  };

  const formatAirportDisplay = (airport: Airport) => {
    const city = airport.address?.cityName || '';
    const country = airport.address?.countryName || '';
    
    if (city && country) {
      return `${airport.name} (${airport.iataCode}) - ${city}, ${country}`;
    } else if (city) {
      return `${airport.name} (${airport.iataCode}) - ${city}`;
    } else {
      return `${airport.name} (${airport.iataCode})`;
    }
  };

  const getDisplayValue = () => {
    if (selectedAirport) {
      return selectedAirport.iataCode;
    }
    return searchTerm;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={getDisplayValue()}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          autoComplete="off"
        />
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {loading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Searching airports...
            </div>
          ) : airports.length > 0 ? (
            <>
              {!searchTerm && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                  Popular Airports
                </div>
              )}
              {airports.map((airport) => (
                <button
                  key={airport.iataCode}
                  onClick={() => handleAirportSelect(airport)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {airport.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {airport.address?.cityName && airport.address?.countryName
                          ? `${airport.address.cityName}, ${airport.address.countryName}`
                          : airport.address?.cityName || ''}
                      </div>
                    </div>
                    <div className="text-sm font-mono font-semibold text-blue-600">
                      {airport.iataCode}
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'No airports found' : 'Start typing to search airports'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
