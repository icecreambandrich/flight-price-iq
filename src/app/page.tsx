'use client';

import { useState } from 'react';
import { Plane, Calendar, MapPin, TrendingUp, AlertCircle } from 'lucide-react';
import FlightSearchForm from '@/components/FlightSearchForm';
import PricePredictionCard from '@/components/PricePredictionCard';
import SpotlightRoutes from '@/components/SpotlightRoutes';
import { PricePrediction } from '@/lib/prediction';

interface SearchData {
  origin: string;
  destination: string;
  originName: string;
  destinationName: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  tripType: 'roundtrip' | 'oneway';
}

export default function Home() {
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFlightSearch = async (searchFormData: SearchData) => {
    setLoading(true);
    setError('');
    setSearchData(searchFormData);
    
    try {
      // Call the statistically validated prediction API
      const response = await fetch('/api/validated-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: searchFormData.origin,
          destination: searchFormData.destination,
          departureDate: searchFormData.departureDate,
          returnDate: searchFormData.returnDate,
          passengers: searchFormData.passengers || 1,
          userId: `user_${Date.now()}` // Generate unique user ID for A/B testing
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prediction');
      }

      const data = await response.json();
      
      // Convert validated prediction to display format
      const validatedPred = data.validatedPrediction;
      const newPrediction = {
        ...validatedPred,
        confidence: validatedPred.validatedConfidence, // Use true statistical confidence
        dataQuality: validatedPred.statisticalConfidence,
        errorBounds: validatedPred.errorBounds,
        abTestInfo: {
          variant: validatedPred.abTestVariant,
          metrics: validatedPred.abTestMetrics
        }
      };
      
      setPrediction(newPrediction);
    } catch (error) {
      setError('Failed to get price prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-blue-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Flight Price IQ</h1>
                <p className="text-sm text-gray-600">Smart Booking with AI</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>Real-time data</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Never Overpay for Flights Again
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Save on flights with AI-powered predictions, historical price trends and simple buy-or-wait signals
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-4xl mx-auto mb-12">
          <FlightSearchForm onSearch={handleFlightSearch} loading={loading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Prediction Results */}
        {prediction && searchData && (
          <div className="max-w-4xl mx-auto mb-12">
            <PricePredictionCard 
              prediction={prediction}
              route={{
                origin: searchData.origin,
                destination: searchData.destination,
                originName: searchData.originName,
                destinationName: searchData.destinationName
              }}
              departureDate={searchData.departureDate}
            />
          </div>
        )}

        {/* Spotlight Routes */}
        <div className="mb-12">
          <SpotlightRoutes />
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Why Trust Our Predictions?
            </h3>
            <p className="text-lg text-gray-600">
              Our AI is the only flight price predictor using machine learning with real and synthetic data to help you save money
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Real-time Data</h4>
              <p className="text-gray-600">
                Live pricing updated daily to ensure accuracy
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">7-Day Forecast</h4>
              <p className="text-gray-600">
                Predictive model analyzes seasonal trends and booking patterns
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Global Coverage</h4>
              <p className="text-gray-600">
                Support for worldwide routes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">Flight Price IQ</span>
            </div>
            <p className="text-gray-400 text-sm">
              Powered by Amadeus API • Updated daily • Built with Next.js
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
