import { AmadeusService } from './amadeus';
import { PricePrediction } from './prediction';

export interface HistoricalPricePoint {
  date: string;
  price: number;
  currency: string;
  route: string;
  bookingDaysAhead: number;
  dayOfWeek: number;
  month: number;
  year: number;
  isWeekend: boolean;
  isHoliday: boolean;
  seasonalPeriod: 'low' | 'shoulder' | 'peak';
}

export interface EnhancedRouteData {
  route: string;
  totalDataPoints: number;
  dateRange: {
    start: string;
    end: string;
  };
  priceHistory: HistoricalPricePoint[];
  seasonalTrends: {
    [month: number]: {
      averagePrice: number;
      minPrice: number;
      maxPrice: number;
      volatility: number;
      dataPoints: number;
    };
  };
  bookingWindowAnalysis: {
    [daysAhead: number]: {
      averagePrice: number;
      priceMultiplier: number;
      dataPoints: number;
    };
  };
  dayOfWeekTrends: {
    [day: number]: {
      averagePrice: number;
      priceMultiplier: number;
      dataPoints: number;
    };
  };
}

export class DataCollector {
  private static readonly POPULAR_ROUTES = [
    'LHR-JFK', 'LHR-LAX', 'LHR-DXB', 'LHR-SIN', 'LHR-HKG',
    'LHR-KUL', 'LHR-CPH', 'LHR-CDG', 'LHR-FRA', 'LHR-AMS',
    'JFK-LAX', 'JFK-LHR', 'LAX-NRT', 'CDG-JFK', 'FRA-JFK'
  ];

  /**
   * Collect historical price data for multiple routes over time
   */
  static async collectHistoricalData(
    routes: string[] = this.POPULAR_ROUTES,
    daysBack: number = 90
  ): Promise<{ [route: string]: EnhancedRouteData }> {
    const routeData: { [route: string]: EnhancedRouteData } = {};
    
    for (const route of routes) {
      console.log(`Collecting data for route: ${route}`);
      
      const [origin, destination] = route.split('-');
      const priceHistory: HistoricalPricePoint[] = [];
      
      // Collect data for different booking windows
      const bookingWindows = [7, 14, 21, 30, 45, 60, 90];
      
      for (const bookingDaysAhead of bookingWindows) {
        // Simulate historical data collection (in production, you'd query historical APIs)
        const historicalPoints = await this.simulateHistoricalCollection(
          origin,
          destination,
          bookingDaysAhead,
          daysBack
        );
        
        priceHistory.push(...historicalPoints);
      }
      
      // Analyze the collected data
      routeData[route] = this.analyzeRouteData(route, priceHistory);
    }
    
    return routeData;
  }

  /**
   * Simulate historical data collection (replace with real API calls)
   */
  private static async simulateHistoricalCollection(
    origin: string,
    destination: string,
    bookingDaysAhead: number,
    daysBack: number
  ): Promise<HistoricalPricePoint[]> {
    const points: HistoricalPricePoint[] = [];
    const route = `${origin}-${destination}`;
    
    // Generate data points for the last 'daysBack' days
    for (let i = 0; i < daysBack; i += 3) { // Every 3 days to reduce API calls
      const searchDate = new Date();
      searchDate.setDate(searchDate.getDate() - i);
      
      const departureDate = new Date(searchDate);
      departureDate.setDate(departureDate.getDate() + bookingDaysAhead);
      
      try {
        // In production, you would make actual API calls here
        // For now, we'll simulate realistic price data
        const basePrice = this.getBasePrice(route);
        const seasonalMultiplier = this.getSeasonalMultiplier(departureDate.getMonth() + 1);
        const bookingMultiplier = this.getBookingWindowMultiplier(bookingDaysAhead);
        const volatility = Math.random() * 0.3 + 0.85; // 15% volatility
        
        const price = Math.round(basePrice * seasonalMultiplier * bookingMultiplier * volatility);
        
        points.push({
          date: searchDate.toISOString().split('T')[0],
          price,
          currency: 'GBP',
          route,
          bookingDaysAhead,
          dayOfWeek: departureDate.getDay(),
          month: departureDate.getMonth() + 1,
          year: departureDate.getFullYear(),
          isWeekend: departureDate.getDay() === 0 || departureDate.getDay() === 6,
          isHoliday: this.isHolidayPeriod(departureDate),
          seasonalPeriod: this.getSeasonalPeriod(departureDate.getMonth() + 1)
        });
        
        // Add small delay to avoid overwhelming APIs
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error collecting data for ${route}:`, error);
      }
    }
    
    return points;
  }

  /**
   * Analyze collected route data to extract patterns
   */
  private static analyzeRouteData(route: string, priceHistory: HistoricalPricePoint[]): EnhancedRouteData {
    const seasonalTrends: any = {};
    const bookingWindowAnalysis: any = {};
    const dayOfWeekTrends: any = {};
    
    // Group by month
    for (let month = 1; month <= 12; month++) {
      const monthData = priceHistory.filter(p => p.month === month);
      if (monthData.length > 0) {
        const prices = monthData.map(p => p.price);
        seasonalTrends[month] = {
          averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          volatility: this.calculateVolatility(prices),
          dataPoints: monthData.length
        };
      }
    }
    
    // Group by booking window
    const bookingWindows = [7, 14, 21, 30, 45, 60, 90];
    for (const window of bookingWindows) {
      const windowData = priceHistory.filter(p => p.bookingDaysAhead === window);
      if (windowData.length > 0) {
        const prices = windowData.map(p => p.price);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const baselinePrice = seasonalTrends[6]?.averagePrice || avgPrice; // Use June as baseline
        
        bookingWindowAnalysis[window] = {
          averagePrice: Math.round(avgPrice),
          priceMultiplier: avgPrice / baselinePrice,
          dataPoints: windowData.length
        };
      }
    }
    
    // Group by day of week
    for (let day = 0; day < 7; day++) {
      const dayData = priceHistory.filter(p => p.dayOfWeek === day);
      if (dayData.length > 0) {
        const prices = dayData.map(p => p.price);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const baselinePrice = seasonalTrends[6]?.averagePrice || avgPrice;
        
        dayOfWeekTrends[day] = {
          averagePrice: Math.round(avgPrice),
          priceMultiplier: avgPrice / baselinePrice,
          dataPoints: dayData.length
        };
      }
    }
    
    return {
      route,
      totalDataPoints: priceHistory.length,
      dateRange: {
        start: priceHistory[priceHistory.length - 1]?.date || '',
        end: priceHistory[0]?.date || ''
      },
      priceHistory,
      seasonalTrends,
      bookingWindowAnalysis,
      dayOfWeekTrends
    };
  }

  /**
   * Calculate price volatility (standard deviation)
   */
  private static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.round((stdDev / mean) * 100) / 100; // Return as coefficient of variation
  }

  /**
   * Get base price for a route
   */
  private static getBasePrice(route: string): number {
    const basePrices: { [key: string]: number } = {
      'LHR-JFK': 450, 'LHR-LAX': 550, 'LHR-DXB': 400, 'LHR-SIN': 650,
      'LHR-HKG': 600, 'LHR-KUL': 650, 'LHR-CPH': 180, 'LHR-CDG': 120,
      'LHR-FRA': 150, 'LHR-AMS': 140, 'JFK-LAX': 300, 'JFK-LHR': 450,
      'LAX-NRT': 500, 'CDG-JFK': 400, 'FRA-JFK': 420
    };
    
    return basePrices[route] || 400;
  }

  /**
   * Get seasonal multiplier
   */
  private static getSeasonalMultiplier(month: number): number {
    const multipliers = [0.8, 0.75, 0.9, 1.0, 1.1, 1.3, 1.4, 1.35, 1.0, 0.9, 0.85, 1.1];
    return multipliers[month - 1] || 1.0;
  }

  /**
   * Get booking window multiplier
   */
  private static getBookingWindowMultiplier(daysAhead: number): number {
    if (daysAhead >= 90) return 0.85; // Early bird discount
    if (daysAhead >= 60) return 0.9;
    if (daysAhead >= 30) return 1.0;
    if (daysAhead >= 14) return 1.1;
    if (daysAhead >= 7) return 1.25;
    return 1.5; // Last minute premium
  }

  /**
   * Check if date is in holiday period
   */
  private static isHolidayPeriod(date: Date): boolean {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Major holiday periods
    return (
      (month === 12 && day >= 20) || // Christmas/New Year
      (month === 1 && day <= 7) ||   // New Year
      (month === 7 || month === 8) || // Summer holidays
      (month === 3 || month === 4)    // Easter/Spring break
    );
  }

  /**
   * Get seasonal period classification
   */
  private static getSeasonalPeriod(month: number): 'low' | 'shoulder' | 'peak' {
    if ([6, 7, 8, 12].includes(month)) return 'peak';
    if ([1, 2, 9, 10].includes(month)) return 'low';
    return 'shoulder';
  }

  /**
   * Save collected data to local storage or database
   */
  static async saveHistoricalData(data: { [route: string]: EnhancedRouteData }): Promise<void> {
    try {
      // In production, save to database
      localStorage.setItem('flightPriceHistoricalData', JSON.stringify(data));
      localStorage.setItem('dataCollectionTimestamp', new Date().toISOString());
      console.log('Historical data saved successfully');
    } catch (error) {
      console.error('Error saving historical data:', error);
    }
  }

  /**
   * Load historical data from storage
   */
  static async loadHistoricalData(): Promise<{ [route: string]: EnhancedRouteData } | null> {
    try {
      const data = localStorage.getItem('flightPriceHistoricalData');
      const timestamp = localStorage.getItem('dataCollectionTimestamp');
      
      if (data && timestamp) {
        const dataAge = Date.now() - new Date(timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (dataAge < maxAge) {
          return JSON.parse(data);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error loading historical data:', error);
      return null;
    }
  }
}
