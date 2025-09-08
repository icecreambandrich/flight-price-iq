'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, CheckCircle, AlertTriangle, BarChart3, Search } from 'lucide-react';
import PredictionDetailsModal from './PredictionDetailsModal';
import { PricePrediction } from '@/lib/prediction';

interface PricePredictionCardProps {
  prediction: PricePrediction;
  route: {
    origin: string;
    destination: string;
    originName: string;
    destinationName: string;
  };
  departureDate: string;
}

export default function PricePredictionCard({ prediction, route, departureDate }: PricePredictionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const formatPrice = (price: number) => `£${price.toFixed(0)}`;
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getRecommendationColor = (recommendation: string) => {
    return recommendation === 'BUY_NOW' ? 'text-green-600' : 'text-orange-600';
  };

  const handleSearchFlights = () => {
    try {
      console.log('Search Flights clicked', { route, departureDate });
      
      // Generate URL for Travel Payouts (Aviasales) booking
      const formatDateForAviasales = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}${month}`;
      };

      const formattedDepartureDate = formatDateForAviasales(departureDate);
      const returnDate = new Date(departureDate);
      returnDate.setDate(returnDate.getDate() + 7); // Default 7 days later
      const formattedReturnDate = formatDateForAviasales(returnDate.toISOString());

      // Aviasales URL format: origin + ddmm + destination + ddmm + passengers
      const travelPayoutsUrl = `https://www.aviasales.com/search/${route.origin}${formattedDepartureDate}${route.destination}${formattedReturnDate}1`;
      
      console.log('Generated Travel Payouts URL:', travelPayoutsUrl);
      
      // Open in new tab
      const opened = window.open(travelPayoutsUrl, '_blank');
      
      if (!opened) {
        console.error('Popup blocked or failed to open');
        // Fallback: try to navigate in same tab
        window.location.href = travelPayoutsUrl;
      }
    } catch (error) {
      console.error('Error in handleSearchFlights:', error);
      
      // Fallback to a basic Skyscanner URL if WayAway fails
      const fallbackUrl = `https://www.skyscanner.com/transport/flights/${route.origin}/${route.destination}`;
      window.open(fallbackUrl, '_blank');
    }
  };

  const getRecommendationBg = (recommendation: string) => {
    return recommendation === 'BUY_NOW' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200';
  };

  const getRecommendationIcon = (recommendation: string) => {
    return recommendation === 'BUY_NOW' ? CheckCircle : AlertTriangle;
  };

  const RecommendationIcon = getRecommendationIcon(prediction.recommendation);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header with current price */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-1">
              {formatPrice(prediction.currentPrice)}
            </h3>
            <p className="text-blue-100">Current best price</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Updated</p>
            <p className="text-sm font-medium">
              {new Date(prediction.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main recommendation */}
      <div className={`p-6 border-b ${getRecommendationBg(prediction.recommendation)}`}>
        <div className="flex items-center space-x-3">
          <RecommendationIcon className={`h-8 w-8 ${getRecommendationColor(prediction.recommendation)}`} />
          <div>
            <h4 className={`text-xl font-bold ${getRecommendationColor(prediction.recommendation)}`}>
              {prediction.recommendation === 'BUY_NOW' ? 'Book Now!' : 'Wait & Monitor'}
            </h4>
            <p className="text-gray-600">
              {prediction.recommendation === 'BUY_NOW' 
                ? 'High probability of price increase - book today to secure this rate'
                : 'Prices may drop - consider waiting a few days before booking'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Probability indicators */}
      <div className="p-6 border-b">
        <h5 className="font-semibold text-gray-900 mb-4">7-Day Price Forecast</h5>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              <span className="text-gray-700">Price increase probability</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${prediction.probabilityIncrease * 100}%` }}
                />
              </div>
              <span className="font-semibold text-gray-900 w-12">
                {Math.round(prediction.probabilityIncrease * 100)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
              <span className="text-gray-700">Price decrease probability</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${prediction.probabilityDecrease * 100}%` }}
                />
              </div>
              <span className="font-semibold text-gray-900 w-12">
                {Math.round(prediction.probabilityDecrease * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confidence meter */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-2">
          <h5 className="font-semibold text-gray-900">Prediction Confidence</h5>
          <span className="font-bold text-lg text-gray-900">{Math.round(prediction.confidence)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              prediction.confidence >= 80 ? 'bg-green-500' :
              prediction.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${prediction.confidence}%` }}
          />
        </div>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-gray-600">
            {prediction.confidence >= 80 ? 'High confidence - reliable prediction' :
             prediction.confidence >= 60 ? 'Medium confidence - good prediction' :
             'Lower confidence - monitor closely'}
          </p>
          {(prediction as any).dataQuality && (
            <p className="text-xs text-gray-500">
              Based on {(prediction as any).dataQuality.totalDataPoints} historical data points
            </p>
          )}
        </div>
      </div>

      {/* Price range context */}
      <div className="p-6 border-b">
        <h5 className="font-semibold text-gray-900 mb-3">Historical Price Range</h5>
        <div className="flex items-center justify-between text-sm">
          <div className="text-center">
            <p className="text-gray-600">Minimum</p>
            <p className="font-semibold text-green-600">{formatPrice(prediction.priceRange.min)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Average</p>
            <p className="font-semibold text-gray-900">{formatPrice(prediction.priceRange.average)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Maximum</p>
            <p className="font-semibold text-red-600">{formatPrice(prediction.priceRange.max)}</p>
          </div>
        </div>
        
        {/* Price position indicator */}
        <div className="mt-4">
          <div className="relative w-full bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-full h-2">
            <div 
              className="absolute top-0 w-3 h-3 bg-blue-600 rounded-full transform -translate-y-0.5 -translate-x-1.5 border-2 border-white shadow-lg"
              style={{ 
                left: `${((prediction.currentPrice - prediction.priceRange.min) / (prediction.priceRange.max - prediction.priceRange.min)) * 100}%` 
              }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">Current price position</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-6 bg-gray-50 flex space-x-3">
        <button 
          onClick={handleSearchFlights}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Search className="h-5 w-5" />
          <span>Search Flights</span>
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <BarChart3 className="h-5 w-5" />
          <span>{showDetails ? 'Hide Details' : 'View Details'}</span>
        </button>
      </div>

      {/* Inline Details */}
      {showDetails && (
        <div className="border-t border-gray-200">
          <PredictionDetailsModal
            isOpen={true}
            onClose={() => setShowDetails(false)}
            prediction={prediction}
            route={route}
            departureDate={departureDate}
            inline={true}
          />
        </div>
      )}

    </div>
  );
}
