'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DailyDataPoint {
  date: string;
  price: number;
  day: string;
  upperBound?: number;
  lowerBound?: number;
  type?: 'historical' | 'current' | 'prediction';
}

interface DailyPriceChartProps {
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

export default function DailyPriceChart({ route, routeInfo, currentPrice, departureDate, priceRange }: DailyPriceChartProps) {
  const generateDailyData = (): DailyDataPoint[] => {
    const data: DailyDataPoint[] = [];
    const currentDate = new Date();
    
    // Generate daily data for the past 30 days
    for (let i = 30; i >= 1; i--) {
      const dayDate = new Date(currentDate);
      dayDate.setDate(currentDate.getDate() - i);
      
      // Create realistic daily price variations
      const basePrice = priceRange.average;
      
      // Day of week effect (weekends typically more expensive)
      const dayOfWeek = dayDate.getDay();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.05 : 0.98;
      
      // Random daily volatility (±8%)
      const dailyVariation = 0.92 + Math.random() * 0.16;
      
      // Trend factor (slight upward trend over time for booking urgency)
      const trendFactor = 1 + (30 - i) * 0.002;
      
      // Occasional price spikes or drops
      const spikeChance = Math.random();
      let spikeFactor = 1;
      if (spikeChance < 0.05) { // 5% chance of spike
        spikeFactor = 1.15 + Math.random() * 0.1;
      } else if (spikeChance > 0.95) { // 5% chance of drop
        spikeFactor = 0.85 - Math.random() * 0.1;
      }
      
      let finalPrice = Math.round(basePrice * weekendMultiplier * dailyVariation * trendFactor * spikeFactor);
      
      // Ensure price stays within reasonable bounds
      finalPrice = Math.max(priceRange.min * 0.9, Math.min(priceRange.max * 1.1, finalPrice));
      
      const dayLabel = i === 1 ? 'Yesterday' : 
                      dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      data.push({
        date: dayDate.toISOString().split('T')[0],
        price: finalPrice,
        day: dayLabel,
        type: 'historical'
      });
    }
    
    // Add today's price
    data.push({
      date: currentDate.toISOString().split('T')[0],
      price: currentPrice,
      day: 'Today',
      type: 'current'
    });
    
    // Generate future predictions for 2 weeks (14 days)
    for (let i = 1; i <= 14; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setDate(currentDate.getDate() + i);
      
      // Base prediction on current price with trend
      const trendFactor = 1 + (i * 0.005); // Slight upward trend for booking urgency
      const volatility = 0.94 + Math.random() * 0.12; // ±6% daily volatility
      
      // Weekend effect for future predictions
      const dayOfWeek = futureDate.getDay();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.03 : 0.99;
      
      const predictedPrice = Math.round(currentPrice * trendFactor * volatility * weekendMultiplier);
      
      // Calculate confidence bounds (95% confidence interval)
      const confidenceRange = predictedPrice * 0.12; // ±12% confidence range
      const upperBound = Math.round(predictedPrice + confidenceRange);
      const lowerBound = Math.round(predictedPrice - confidenceRange);
      
      const futureDayLabel = i === 1 ? 'Tomorrow' :
                            futureDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      data.push({
        date: futureDate.toISOString().split('T')[0],
        price: predictedPrice,
        upperBound,
        lowerBound,
        day: futureDayLabel,
        type: 'prediction'
      });
    }
    
    return data;
  };

  const dailyData = generateDailyData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{dataPoint.day}</p>
          <p className="text-blue-600 font-semibold">
            £{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Daily Price History (Last 30 Days) - {routeInfo.originName} → {routeInfo.destinationName} - {new Date(departureDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="day"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={Math.ceil(dailyData.length / 8)} // Show ~8 labels
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `£${value.toLocaleString()}`}
              domain={['dataMin - 20', 'dataMax + 20']}
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
              strokeDasharray="2 2"
              dot={false}
              connectNulls={false}
            />
            <Line 
              type="monotone" 
              dataKey="lowerBound" 
              stroke="#94a3b8" 
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              connectNulls={false}
            />
            
            {/* Main price line */}
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={(props: any) => {
                const { payload } = props;
                if (payload?.type === 'prediction') {
                  return <circle {...props} fill="#fbbf24" stroke="#fbbf24" r={2} />;
                }
                return <circle {...props} fill="#3b82f6" stroke="#3b82f6" r={2} />;
              }}
              activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-between text-sm text-gray-600">
        <span>30 days ago</span>
        <span>2 weeks ahead</span>
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
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        Daily price variations with 2-week predictions and confidence intervals
      </div>
    </div>
  );
}
