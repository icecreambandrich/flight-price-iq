'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface HistoricalDataPoint {
  date: string;
  price: number;
  month: string;
  upperBound?: number;
  lowerBound?: number;
  type?: 'historical' | 'current' | 'prediction';
}

interface HistoricalPriceChartProps {
  route: string;
  routeInfo: {
    origin: string;
    destination: string;
    originName: string;
    destinationName: string;
  };
  currentPrice: number;
  departureDate: string;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
}

export default function HistoricalPriceChart({ 
  route, 
  routeInfo,
  currentPrice, 
  departureDate,
  priceRange 
}: HistoricalPriceChartProps) {
  
  // Generate weekly historical price data for the past 6 months
  const getSeasonalMultiplier = (month: number): number => {
    // Peak travel seasons: June-August (summer), December (holidays)
    const seasonalFactors: { [key: number]: number } = {
      1: 0.95,  // January - post-holiday low
      2: 0.90,  // February - lowest
      3: 0.95,  // March - spring break starts
      4: 1.05,  // April - spring travel
      5: 1.10,  // May - pre-summer
      6: 1.25,  // June - summer peak
      7: 1.30,  // July - summer peak
      8: 1.25,  // August - summer peak
      9: 1.05,  // September - post-summer
      10: 1.00, // October - stable
      11: 1.10, // November - Thanksgiving
      12: 1.20  // December - holidays
    };
    return seasonalFactors[month] || 1.0;
  };

  const generateHistoricalData = (): HistoricalDataPoint[] => {
    const data: HistoricalDataPoint[] = [];
    const currentDate = new Date();
    
    // Generate weekly data for the past 6 months (26 weeks)
    for (let i = 25; i >= 0; i--) {
      const weekDate = new Date(currentDate);
      weekDate.setDate(currentDate.getDate() - (i * 7));
      
      // Create realistic weekly price variations
      const basePrice = priceRange.average;
      
      // Seasonal multiplier based on month
      const month = weekDate.getMonth() + 1;
      const seasonalMultiplier = getSeasonalMultiplier(month);
      
      // Weekly volatility (±12%)
      const weeklyVariation = 0.88 + Math.random() * 0.24;
      
      // Trend factor (slight upward trend over time)
      const trendFactor = 1 + (25 - i) * 0.003;
      
      // Day of week effect for departure timing
      const dayOfWeek = weekDate.getDay();
      const dayMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.08 : 0.96;
      
      let finalPrice = Math.round(basePrice * seasonalMultiplier * weeklyVariation * trendFactor * dayMultiplier);
      
      // Ensure price stays within reasonable bounds
      finalPrice = Math.max(priceRange.min * 0.8, Math.min(priceRange.max * 1.2, finalPrice));
      
      const weekLabel = i === 0 ? 'This Week' : 
                       i === 1 ? 'Last Week' : 
                       weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      data.push({
        date: weekDate.toISOString().split('T')[0],
        price: finalPrice,
        month: weekLabel,
        type: 'historical'
      });
    }
    
    // Add current price as the last data point
    data.push({
      date: currentDate.toISOString().split('T')[0],
      price: currentPrice,
      month: 'Now',
      type: 'current'
    });
    
    // Generate future predictions for 1 month (4 weeks)
    for (let i = 1; i <= 4; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setDate(currentDate.getDate() + (i * 7));
      
      // Base prediction on current price with trend
      const trendFactor = 1 + (i * 0.008); // Slight upward trend
      const volatility = 0.92 + Math.random() * 0.16; // ±8% volatility
      
      const predictedPrice = Math.round(currentPrice * trendFactor * volatility);
      
      // Calculate confidence bounds (95% confidence interval)
      const confidenceRange = predictedPrice * 0.15; // ±15% confidence range
      const upperBound = Math.round(predictedPrice + confidenceRange);
      const lowerBound = Math.round(predictedPrice - confidenceRange);
      
      const futureWeekLabel = futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      data.push({
        date: futureDate.toISOString().split('T')[0],
        price: predictedPrice,
        upperBound,
        lowerBound,
        month: futureWeekLabel,
        type: 'prediction'
      });
    }
    
    return data;
  };

  const historicalData = generateHistoricalData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.month}</p>
          <p className="text-blue-600 font-semibold">£{payload[0].value.toLocaleString()}</p>
          {data.month === 'Now' && (
            <p className="text-xs text-gray-500">Current price</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">
        6-Month Weekly Price History - {routeInfo.originName} → {routeInfo.destinationName} - {new Date(departureDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </h4>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={10}
              tick={{ fill: '#6b7280' }}
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => `£${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines for price ranges */}
            <ReferenceLine 
              y={priceRange.average} 
              stroke="#fbbf24" 
              strokeDasharray="5 5" 
              label={{ value: "Average", position: "right", fill: "#f59e0b" }}
            />
            <ReferenceLine 
              y={priceRange.min} 
              stroke="#10b981" 
              strokeDasharray="3 3" 
              label={{ value: "Best Price", position: "right", fill: "#059669" }}
            />
            <ReferenceLine 
              y={priceRange.max} 
              stroke="#ef4444" 
              strokeDasharray="3 3" 
              label={{ value: "Peak Price", position: "right", fill: "#dc2626" }}
            />
            
            {/* Confidence bounds for predictions */}
            <Line 
              type="monotone" 
              dataKey="upperBound" 
              stroke="#94a3b8" 
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              connectNulls={false}
            />
            <Line 
              type="monotone" 
              dataKey="lowerBound" 
              stroke="#94a3b8" 
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              connectNulls={false}
            />
            
            {/* Main price line */}
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={(props: any) => {
                const { payload } = props;
                if (payload?.type === 'prediction') {
                  return <circle {...props} fill="#fbbf24" stroke="#fbbf24" r={3} />;
                }
                return <circle {...props} fill="#2563eb" stroke="#2563eb" r={2} />;
              }}
              activeDot={{ r: 4, fill: '#2563eb', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-blue-600"></div>
          <span className="text-gray-600">Historical Prices</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-yellow-400"></div>
          <span className="text-gray-600">Future Predictions</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-yellow-400 border-dashed border-t"></div>
          <span className="text-gray-600">Average (£{priceRange.average.toLocaleString()})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-green-500 border-dashed border-t"></div>
          <span className="text-gray-600">Best Price (£{priceRange.min.toLocaleString()})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-red-500 border-dashed border-t"></div>
          <span className="text-gray-600">Peak Price (£{priceRange.max.toLocaleString()})</span>
        </div>
      </div>
      
      {/* Insights */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Trend Analysis:</strong> {
            currentPrice < priceRange.average 
              ? `Current price is ${Math.round(((priceRange.average - currentPrice) / priceRange.average) * 100)}% below average - good value!`
              : currentPrice > priceRange.average
              ? `Current price is ${Math.round(((currentPrice - priceRange.average) / priceRange.average) * 100)}% above average - consider waiting.`
              : 'Current price is at the historical average.'
          }
        </p>
      </div>
    </div>
  );
}
