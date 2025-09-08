'use client';

import React, { useState } from 'react';
import { X, Plane, Calendar, Users, Star } from 'lucide-react';

interface FlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrigin?: string;
  defaultDestination?: string;
  defaultDepartureDate?: string;
}

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  classOfService: string;
  tripType: 'roundtrip' | 'oneway';
  directFlightsOnly: boolean;
}

export default function FlightSearchModal({ 
  isOpen, 
  onClose, 
  defaultOrigin = '', 
  defaultDestination = '', 
  defaultDepartureDate = '' 
}: FlightSearchModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    origin: defaultOrigin,
    destination: defaultDestination,
    departureDate: defaultDepartureDate,
    returnDate: '',
    passengers: 1,
    classOfService: 'Economy',
    tripType: 'roundtrip',
    directFlightsOnly: false,
  });

  const handleInputChange = (field: keyof FlightSearchParams, value: string | number | boolean) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search-flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: searchParams.origin,
          destination: searchParams.destination,
          departureDate: searchParams.departureDate,
          returnDate: searchParams.tripType === 'roundtrip' ? searchParams.returnDate : undefined,
          passengers: searchParams.passengers,
          classOfService: searchParams.classOfService,
          directFlightsOnly: searchParams.directFlightsOnly,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Open the partner link in a new tab
        window.open(result.partnerUrl, '_blank');
        onClose();
      } else {
        alert(`Search failed: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to search flights. Please try again.');
      console.error('Flight search error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Plane className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Search Flights</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Trip Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trip Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="roundtrip"
                  checked={searchParams.tripType === 'roundtrip'}
                  onChange={(e) => handleInputChange('tripType', e.target.value)}
                  className="mr-2"
                />
                Round Trip
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="oneway"
                  checked={searchParams.tripType === 'oneway'}
                  onChange={(e) => handleInputChange('tripType', e.target.value)}
                  className="mr-2"
                />
                One Way
              </label>
            </div>
          </div>

          {/* Direct Flights Toggle */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={searchParams.directFlightsOnly}
                onChange={(e) => handleInputChange('directFlightsOnly', e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Direct flights only</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">Show only non-stop flights without connections</p>
          </div>

          {/* Origin and Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <input
                type="text"
                value={searchParams.origin}
                onChange={(e) => handleInputChange('origin', e.target.value)}
                placeholder="Origin airport code (e.g., LHR)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <input
                type="text"
                value={searchParams.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                placeholder="Destination airport code (e.g., JFK)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Departure Date
              </label>
              <input
                type="date"
                value={searchParams.departureDate}
                onChange={(e) => handleInputChange('departureDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {searchParams.tripType === 'roundtrip' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Return Date
                </label>
                <input
                  type="date"
                  value={searchParams.returnDate}
                  onChange={(e) => handleInputChange('returnDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Passengers and Class */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Passengers
              </label>
              <select
                value={searchParams.passengers}
                onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Star className="inline h-4 w-4 mr-1" />
                Class
              </label>
              <select
                value={searchParams.classOfService}
                onChange={(e) => handleInputChange('classOfService', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Economy">Economy</option>
                <option value="Premium_Economy">Premium Economy</option>
                <option value="Business">Business</option>
                <option value="First">First Class</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSearch}
            disabled={loading || !searchParams.origin || !searchParams.destination || !searchParams.departureDate}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Plane className="h-4 w-4" />
                <span>Search Flights</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
