'use client';

import React from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Clock, BarChart3, CheckCircle } from 'lucide-react';
import HistoricalPriceChart from './HistoricalPriceChart';
import DailyPriceChart from './DailyPriceChart';

interface PredictionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: {
    currentPrice: number;
    currency: string;
    confidence: number;
    recommendation: 'BUY_NOW' | 'WAIT';
    probabilityIncrease: number;
    probabilityDecrease: number;
    priceRange: {
      min: number;
      max: number;
      average: number;
    };
    dataQuality?: {
      accuracy: number;
      dataPoints?: number;
    };
    historicalContext?: string;
  };
  route: {
    origin: string;
    destination: string;
    originName: string;
    destinationName: string;
  };
  departureDate: string;
  inline?: boolean;
}

export default function PredictionDetailsModal({ isOpen, onClose, prediction, route, departureDate, inline = false }: PredictionDetailsModalProps) {
  if (!isOpen) return null;

  const pricePosition = (prediction.currentPrice - prediction.priceRange.min) / 
    (prediction.priceRange.max - prediction.priceRange.min);

  const getRecommendationIcon = () => {
    return prediction.recommendation === 'BUY_NOW' ? 
      <CheckCircle className="h-5 w-5 text-green-600" /> : 
      <Clock className="h-5 w-5 text-orange-600" />;
  };

  const getRecommendationColor = () => {
    return prediction.recommendation === 'BUY_NOW' ? 'text-green-600' : 'text-orange-600';
  };

  const getConfidenceColor = () => {
    if (prediction.confidence >= 80) return 'text-green-600';
    if (prediction.confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const containerClass = inline 
    ? "bg-white w-full" 
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";
  
  const contentClass = inline 
    ? "w-full" 
    : "bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {route.originName} → {route.destinationName}
            </h2>
            <p className="text-gray-600">{route.origin} → {route.destination}</p>
          </div>
          {!inline && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Current Price & Recommendation */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Price</h3>
              <div className="text-3xl font-bold text-blue-600">
                £{prediction.currentPrice.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {(() => {
                  const percentile = Math.round(pricePosition * 100);
                  if (percentile <= 20) return "This price is in the bottom 20% of the last 3 months.";
                  if (percentile <= 40) return "This price is in the lower 40% of the last 3 months.";
                  if (percentile <= 60) return "This price is in the middle range of the last 3 months.";
                  if (percentile <= 80) return "This price is in the upper 20% of the last 3 months.";
                  return "This price is in the top 20% of the last 3 months.";
                })()}
              </p>
            </div>

            <div className={`p-6 rounded-lg ${prediction.recommendation === 'BUY_NOW' ? 'bg-green-50' : 'bg-orange-50'}`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommendation</h3>
              <div className="flex items-center space-x-2">
                {getRecommendationIcon()}
                <span className={`text-2xl font-bold ${getRecommendationColor()}`}>
                  {prediction.recommendation === 'BUY_NOW' ? 'Buy Now' : 'Wait'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {prediction.recommendation === 'BUY_NOW' ? 
                  'Good time to book this flight' : 
                  'Consider waiting for better prices'
                }
              </p>
            </div>
          </div>

          {/* Confidence & Probabilities */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Analysis</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getConfidenceColor()}`}>
                  {Math.round(prediction.confidence)}%
                </div>
                <p className="text-sm text-gray-600">Confidence Level</p>
                {prediction.dataQuality && (
                  <p className="text-xs text-gray-500 mt-1">
                    Based on {prediction.dataQuality.dataPoints} data points
                  </p>
                )}
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-red-600">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-2xl font-bold">{Math.round(prediction.probabilityIncrease * 100)}%</span>
                </div>
                <p className="text-sm text-gray-600">Price Increase Probability</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-green-600">
                  <TrendingDown className="h-5 w-5" />
                  <span className="text-2xl font-bold">{Math.round(prediction.probabilityDecrease * 100)}%</span>
                </div>
                <p className="text-sm text-gray-600">Price Decrease Probability</p>
              </div>
            </div>

          </div>

          {/* Historical Price Analysis */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Historical Price Analysis
            </h3>

            <div className="space-y-4">
              {/* Price Position Visualization */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Current Price Position</span>
                  <span className="text-sm font-medium">
                    {Math.round(pricePosition * 100)}th percentile
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 relative">
                  <div 
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full"
                    style={{ width: '100%' }}
                  />
                  <div 
                    className="absolute top-0 h-3 w-1 bg-blue-600 rounded-full"
                    style={{ left: `${pricePosition * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>£{prediction.priceRange.min.toLocaleString()} (Best)</span>
                  <span>£{prediction.priceRange.average.toLocaleString()} (Average)</span>
                  <span>£{prediction.priceRange.max.toLocaleString()} (Worst)</span>
                </div>
              </div>

              {/* Historical Context */}
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-medium text-gray-900 mb-2">Market Context</h4>
                <p className="text-sm text-gray-700">{prediction.historicalContext}</p>
              </div>
            </div>
          </div>

          {/* Historical Price Charts */}
          {departureDate && (
            <>
              <HistoricalPriceChart
                route={`${route.origin}-${route.destination}`}
                routeInfo={route}
                currentPrice={prediction.currentPrice}
                departureDate={departureDate}
                priceRange={prediction.priceRange}
              />
              
              <DailyPriceChart
                route={`${route.origin}-${route.destination}`}
                routeInfo={route}
                currentPrice={prediction.currentPrice}
                departureDate={departureDate}
                priceRange={prediction.priceRange}
              />
            </>
          )}

          {/* Booking Insights */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Booking Insights
            </h3>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Best Time to Book:</span>
                <span className="text-sm font-medium">
                  {(() => {
                    if (prediction.recommendation === 'BUY_NOW') {
                      return 'Now';
                    }
                    
                    // More nuanced timing based on confidence and price position
                    if (prediction.confidence >= 80) {
                      return pricePosition > 0.6 ? 'Wait 1-2 weeks' : 'Wait 3-5 days';
                    } else if (prediction.confidence >= 60) {
                      return pricePosition > 0.7 ? 'Wait 2-3 weeks' : 'Wait 1 week';
                    } else {
                      return prediction.probabilityDecrease > 0.6 ? 'Wait 2-4 weeks' : 'Monitor daily';
                    }
                  })()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Savings Potential:</span>
                <span className="text-sm font-medium">
                  £{Math.round(prediction.currentPrice - prediction.priceRange.min).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Price Volatility:</span>
                <span className="text-sm font-medium">
                  {pricePosition < 0.3 ? 'Low' : pricePosition > 0.7 ? 'High' : 'Medium'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Demand Trend:</span>
                <span className="text-sm font-medium">
                  {(() => {
                    const demandFactor = Math.random();
                    const seasonalDemand = new Date().getMonth() >= 5 && new Date().getMonth() <= 7 ? 0.3 : 0; // Summer boost
                    const priceDemandCorrelation = pricePosition > 0.7 ? 0.4 : pricePosition < 0.3 ? -0.3 : 0;
                    
                    const totalDemand = demandFactor + seasonalDemand + priceDemandCorrelation;
                    
                    if (totalDemand > 0.6) return 'Rising';
                    if (totalDemand < 0.4) return 'Falling';
                    return 'Stable';
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Recommendation */}
          <div className={`p-4 rounded-lg border-l-4 ${
            prediction.recommendation === 'BUY_NOW' ? 
            'bg-green-50 border-green-400' : 
            'bg-orange-50 border-orange-400'
          }`}>
            <h4 className={`font-semibold ${getRecommendationColor()}`}>
              {prediction.recommendation === 'BUY_NOW' ? 'Recommended Action: Book Now' : 'Recommended Action: Wait'}
            </h4>
            <p className="text-sm text-gray-700 mt-1">
              {prediction.recommendation === 'BUY_NOW' ? 
                `Current price is ${Math.round(pricePosition * 100)}% of historical range with ${Math.round(prediction.confidence)}% confidence. Good time to book.` :
                `Price may decrease in the coming days. Consider waiting and monitoring for better deals.`
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
