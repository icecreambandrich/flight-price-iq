'use client';

import { useState, useEffect } from 'react';
import { Plane, TrendingUp, TrendingDown, MapPin, Clock } from 'lucide-react';
import { PricePredictionService } from '@/lib/prediction';

export default function SpotlightRoutes() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load spotlight routes data
    const loadRoutes = async () => {
      try {
        const spotlightRoutes = PricePredictionService.getSpotlightRoutes();
        setRoutes(spotlightRoutes);
      } catch (error) {
        console.error('Error loading spotlight routes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoutes();
  }, []);

  const getRecommendationColor = (recommendation: string) => {
    return recommendation === 'BUY_NOW' ? 'text-green-600' : 'text-orange-600';
  };

  const getRecommendationBg = (recommendation: string) => {
    return recommendation === 'BUY_NOW' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200';
  };

  const getRecommendationIcon = (recommendation: string) => {
    return recommendation === 'BUY_NOW' ? TrendingUp : TrendingDown;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Spotlight Routes</h3>
          <p className="text-lg text-gray-600">Popular destinations with live price insights</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 mb-4">Spotlight Deals</h3>
        <p className="text-lg text-gray-600">Round-trip flights departing in 30 days with the biggest discounts</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {routes.map((route) => {
          const RecommendationIcon = getRecommendationIcon(route.recommendation);
          
          return (
            <div key={route.route} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              {/* Route Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Plane className="h-5 w-5" />
                    <span className="font-semibold">{route.route}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationBg(route.recommendation)}`}>
                    <span className={getRecommendationColor(route.recommendation)}>
                      {route.recommendation === 'BUY_NOW' ? 'Book Now' : 'Wait'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-blue-100">
                  <div className="flex items-center space-x-1 mb-1">
                    <MapPin className="h-3 w-3" />
                    <span>{route.originName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{route.destinationName}</span>
                  </div>
                </div>
              </div>

              {/* Price and Details */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">£{route.totalPrice.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Return flight total</p>
                    <p className="text-xs text-gray-500">Outbound: £{route.currentPrice.toLocaleString()} • Return: £{route.returnPrice.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Average: £{route.averageTotal.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold mb-1">
                      {route.discountPercentage}% below average
                    </div>
                    <div className="flex items-center space-x-1">
                      <RecommendationIcon className={`h-5 w-5 ${getRecommendationColor(route.recommendation)}`} />
                      <span className={`font-semibold ${getRecommendationColor(route.recommendation)}`}>
                        {route.recommendation === 'BUY_NOW' ? 'Book Now' : 'Wait'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confidence Meter */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Confidence</span>
                    <span className="text-sm font-semibold text-gray-900">{Math.round(route.confidence)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        route.confidence >= 80 ? 'bg-green-500' :
                        route.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${route.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-600">You Save</p>
                    <p className="font-semibold text-green-600">£{route.discount.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-600">When to Book</p>
                    <p className="font-semibold text-gray-900">
                      {route.recommendation === 'BUY_NOW' ? 'Today' : 'Wait 3-5 days'}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => {
                    // Auto-fill the search form with this route
                    const searchForm = document.querySelector('form');
                    if (searchForm) {
                      const originSelect = searchForm.querySelector('input[placeholder*="origin"]') as HTMLInputElement;
                      const destinationSelect = searchForm.querySelector('input[placeholder*="destination"]') as HTMLInputElement;
                      
                      if (originSelect && destinationSelect) {
                        // Trigger change events to update the form state
                        originSelect.value = route.origin;
                        originSelect.dispatchEvent(new Event('input', { bubbles: true }));
                        
                        destinationSelect.value = route.destination;
                        destinationSelect.dispatchEvent(new Event('input', { bubbles: true }));
                        
                        // Scroll to the search form
                        searchForm.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Clock className="h-4 w-4" />
                  <span>Get Full Forecast</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-sm">
          Prices updated every 24 hours • Predictions based on historical data and market trends
        </p>
      </div>
    </div>
  );
}
