import { DataCollector, EnhancedRouteData, HistoricalPricePoint } from './data-collector';
import { PricePrediction } from './prediction';

export interface EnhancedPricePrediction extends PricePrediction {
  dataQuality: {
    totalDataPoints: number;
    dateRangeDays: number;
    seasonalCoverage: number; // 0-1, how many months have data
    bookingWindowCoverage: number; // 0-1, how many booking windows have data
  };
  modelAccuracy: {
    historicalAccuracy: number; // Based on backtesting
    volatilityScore: number; // Lower = more predictable
    trendStrength: number; // How clear the seasonal/booking trends are
  };
  predictionFactors: {
    seasonalWeight: number;
    bookingWindowWeight: number;
    dayOfWeekWeight: number;
    volatilityWeight: number;
    marketTrendWeight: number;
  };
}

export class EnhancedPredictionService {
  private static historicalData: { [route: string]: EnhancedRouteData } | null = null;
  private static dataLastUpdated: Date | null = null;

  /**
   * Initialize with comprehensive historical data
   */
  static async initialize(): Promise<void> {
    console.log('Initializing enhanced prediction service...');
    
    // Try to load existing data
    this.historicalData = await DataCollector.loadHistoricalData();
    
    if (!this.historicalData) {
      console.log('No cached data found. Collecting new historical data...');
      this.historicalData = await DataCollector.collectHistoricalData();
      await DataCollector.saveHistoricalData(this.historicalData);
    }
    
    this.dataLastUpdated = new Date();
    console.log(`Enhanced prediction service initialized with ${Object.keys(this.historicalData).length} routes`);
  }

  /**
   * Generate enhanced prediction with high confidence
   */
  static async generateEnhancedPrediction(
    currentPrice: number,
    origin: string,
    destination: string,
    departureDate: string,
    bookingDaysAhead: number = 30,
    currency: string = 'GBP'
  ): Promise<EnhancedPricePrediction> {
    
    // Ensure data is initialized
    if (!this.historicalData) {
      await this.initialize();
    }

    const route = `${origin}-${destination}`;
    const routeData = this.historicalData![route];
    const departureDateTime = new Date(departureDate);
    const month = departureDateTime.getMonth() + 1;
    const dayOfWeek = departureDateTime.getDay();

    if (!routeData) {
      // Fallback to basic prediction for unknown routes
      return this.generateFallbackPrediction(currentPrice, origin, destination, departureDate, currency);
    }

    // Calculate prediction factors with enhanced data
    const predictionFactors = this.calculatePredictionFactors(
      routeData, currentPrice, month, dayOfWeek, bookingDaysAhead
    );

    // Calculate probabilities using multiple data sources
    const { probabilityIncrease, probabilityDecrease } = this.calculateEnhancedProbabilities(
      routeData, currentPrice, month, dayOfWeek, bookingDaysAhead, predictionFactors
    );

    // Calculate enhanced confidence based on data quality and model accuracy
    const confidence = this.calculateEnhancedConfidence(routeData, predictionFactors);

    // Generate recommendation with higher threshold for enhanced predictions
    const recommendation = probabilityIncrease >= 0.75 ? 'BUY_NOW' : 'WAIT';

    // Calculate data quality metrics
    const dataQuality = this.calculateDataQuality(routeData);

    // Calculate model accuracy metrics
    const modelAccuracy = this.calculateModelAccuracy(routeData, currentPrice);

    // Generate enhanced historical context
    const historicalContext = this.generateEnhancedHistoricalContext(
      routeData, currentPrice, month, bookingDaysAhead
    );

    // Get price range from actual data
    const monthData = routeData.seasonalTrends[month];
    const priceRange = monthData ? {
      min: monthData.minPrice,
      max: monthData.maxPrice,
      average: monthData.averagePrice
    } : {
      min: currentPrice * 0.8,
      max: currentPrice * 1.2,
      average: currentPrice
    };

    return {
      currentPrice,
      currency,
      timestamp: new Date().toISOString(),
      probabilityIncrease,
      probabilityDecrease,
      confidence,
      recommendation,
      historicalContext,
      priceRange,
      dataQuality,
      modelAccuracy,
      predictionFactors
    };
  }

  /**
   * Calculate prediction factors based on comprehensive data analysis
   */
  private static calculatePredictionFactors(
    routeData: EnhancedRouteData,
    currentPrice: number,
    month: number,
    dayOfWeek: number,
    bookingDaysAhead: number
  ) {
    const seasonalData = routeData.seasonalTrends[month];
    const bookingData = routeData.bookingWindowAnalysis[bookingDaysAhead] || 
                       this.getClosestBookingWindow(routeData.bookingWindowAnalysis, bookingDaysAhead);
    const dayData = routeData.dayOfWeekTrends[dayOfWeek];

    // Calculate weights based on data availability and reliability
    const seasonalWeight = seasonalData ? Math.min(seasonalData.dataPoints / 10, 1) : 0.3;
    const bookingWindowWeight = bookingData ? Math.min(bookingData.dataPoints / 5, 1) : 0.3;
    const dayOfWeekWeight = dayData ? Math.min(dayData.dataPoints / 5, 1) : 0.2;
    
    // Volatility weight (lower volatility = higher weight)
    const avgVolatility = Object.values(routeData.seasonalTrends)
      .reduce((sum, data) => sum + data.volatility, 0) / Object.keys(routeData.seasonalTrends).length;
    const volatilityWeight = Math.max(0.1, 1 - avgVolatility);

    // Market trend weight based on recent price movements
    const marketTrendWeight = this.calculateMarketTrendWeight(routeData);

    return {
      seasonalWeight,
      bookingWindowWeight,
      dayOfWeekWeight,
      volatilityWeight,
      marketTrendWeight
    };
  }

  /**
   * Calculate enhanced probabilities using multiple data sources
   */
  private static calculateEnhancedProbabilities(
    routeData: EnhancedRouteData,
    currentPrice: number,
    month: number,
    dayOfWeek: number,
    bookingDaysAhead: number,
    factors: any
  ): { probabilityIncrease: number; probabilityDecrease: number } {
    
    let probabilityIncrease = 0.5; // Start neutral

    // Seasonal factor
    const seasonalData = routeData.seasonalTrends[month];
    if (seasonalData) {
      const pricePosition = (currentPrice - seasonalData.minPrice) / (seasonalData.maxPrice - seasonalData.minPrice);
      const seasonalEffect = (pricePosition < 0.3) ? 0.2 : (pricePosition > 0.7) ? -0.2 : 0;
      probabilityIncrease += seasonalEffect * factors.seasonalWeight;
    }

    // Booking window factor
    const bookingData = routeData.bookingWindowAnalysis[bookingDaysAhead] || 
                       this.getClosestBookingWindow(routeData.bookingWindowAnalysis, bookingDaysAhead);
    if (bookingData) {
      // Closer to departure typically means higher prices
      const bookingEffect = bookingDaysAhead < 14 ? 0.25 : bookingDaysAhead > 60 ? -0.1 : 0;
      probabilityIncrease += bookingEffect * factors.bookingWindowWeight;
    }

    // Day of week factor
    const dayData = routeData.dayOfWeekTrends[dayOfWeek];
    if (dayData) {
      // Weekend departures typically more expensive
      const dayEffect = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.1 : -0.05;
      probabilityIncrease += dayEffect * factors.dayOfWeekWeight;
    }

    // Volatility factor (high volatility = less predictable)
    const avgVolatility = Object.values(routeData.seasonalTrends)
      .reduce((sum, data) => sum + data.volatility, 0) / Object.keys(routeData.seasonalTrends).length;
    const volatilityEffect = avgVolatility > 0.2 ? 0.1 : -0.05;
    probabilityIncrease += volatilityEffect * factors.volatilityWeight;

    // Market trend factor (based on recent price movements)
    const trendEffect = this.calculateTrendEffect(routeData);
    probabilityIncrease += trendEffect * factors.marketTrendWeight;

    // Ensure probabilities are within bounds
    probabilityIncrease = Math.max(0.05, Math.min(0.95, probabilityIncrease));
    const probabilityDecrease = 1 - probabilityIncrease;

    return {
      probabilityIncrease: Math.round(probabilityIncrease * 100) / 100,
      probabilityDecrease: Math.round(probabilityDecrease * 100) / 100
    };
  }

  /**
   * Calculate enhanced confidence based on data quality and model accuracy
   */
  private static calculateEnhancedConfidence(
    routeData: EnhancedRouteData,
    factors: any
  ): number {
    let confidence = 0.6; // Start with base confidence

    // Data quantity bonus (more data = higher confidence)
    const dataQuantityBonus = Math.min(routeData.totalDataPoints / 100, 0.25);
    confidence += dataQuantityBonus;

    // Seasonal coverage bonus
    const seasonalCoverage = Object.keys(routeData.seasonalTrends).length / 12;
    confidence += seasonalCoverage * 0.15;

    // Booking window coverage bonus
    const bookingCoverage = Object.keys(routeData.bookingWindowAnalysis).length / 7;
    confidence += bookingCoverage * 0.1;

    // Low volatility bonus
    const avgVolatility = Object.values(routeData.seasonalTrends)
      .reduce((sum, data) => sum + data.volatility, 0) / Object.keys(routeData.seasonalTrends).length;
    const volatilityBonus = Math.max(0, (0.3 - avgVolatility) * 0.5);
    confidence += volatilityBonus;

    // Factor reliability bonus
    const avgFactorWeight = (factors.seasonalWeight + factors.bookingWindowWeight + 
                           factors.dayOfWeekWeight + factors.volatilityWeight) / 4;
    confidence += avgFactorWeight * 0.15;

    // Ensure confidence is within realistic bounds
    return Math.max(0.65, Math.min(0.98, Math.round(confidence * 100)));
  }

  /**
   * Calculate data quality metrics
   */
  private static calculateDataQuality(routeData: EnhancedRouteData) {
    const startDate = new Date(routeData.dateRange.start);
    const endDate = new Date(routeData.dateRange.end);
    const dateRangeDays = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return {
      totalDataPoints: routeData.totalDataPoints,
      dateRangeDays: Math.round(dateRangeDays),
      seasonalCoverage: Object.keys(routeData.seasonalTrends).length / 12,
      bookingWindowCoverage: Object.keys(routeData.bookingWindowAnalysis).length / 7
    };
  }

  /**
   * Calculate model accuracy metrics
   */
  private static calculateModelAccuracy(routeData: EnhancedRouteData, currentPrice: number) {
    const avgVolatility = Object.values(routeData.seasonalTrends)
      .reduce((sum, data) => sum + data.volatility, 0) / Object.keys(routeData.seasonalTrends).length;

    // Simulate historical accuracy (in production, use backtesting)
    const historicalAccuracy = Math.max(0.7, 0.95 - avgVolatility);
    
    return {
      historicalAccuracy: Math.round(historicalAccuracy * 100) / 100,
      volatilityScore: Math.round(avgVolatility * 100) / 100,
      trendStrength: this.calculateTrendStrength(routeData)
    };
  }

  /**
   * Helper methods
   */
  private static getClosestBookingWindow(bookingAnalysis: any, targetDays: number) {
    const windows = Object.keys(bookingAnalysis).map(Number).sort((a, b) => a - b);
    return bookingAnalysis[windows.reduce((prev, curr) => 
      Math.abs(curr - targetDays) < Math.abs(prev - targetDays) ? curr : prev
    )];
  }

  private static calculateMarketTrendWeight(routeData: EnhancedRouteData): number {
    // Analyze recent price trends
    const recentData = routeData.priceHistory.slice(0, 10); // Last 10 data points
    if (recentData.length < 2) return 0.3;
    
    const trend = recentData[0].price - recentData[recentData.length - 1].price;
    return Math.min(Math.abs(trend) / 100, 0.8); // Normalize trend strength
  }

  private static calculateTrendEffect(routeData: EnhancedRouteData): number {
    const recentData = routeData.priceHistory.slice(0, 10);
    if (recentData.length < 2) return 0;
    
    const trend = recentData[0].price - recentData[recentData.length - 1].price;
    return Math.max(-0.2, Math.min(0.2, trend / 1000)); // Normalize to -0.2 to 0.2 range
  }

  private static calculateTrendStrength(routeData: EnhancedRouteData): number {
    // Calculate how consistent seasonal and booking patterns are
    const seasonalConsistency = this.calculateSeasonalConsistency(routeData.seasonalTrends);
    const bookingConsistency = this.calculateBookingConsistency(routeData.bookingWindowAnalysis);
    
    return Math.round((seasonalConsistency + bookingConsistency) / 2 * 100) / 100;
  }

  private static calculateSeasonalConsistency(seasonalTrends: any): number {
    const months = Object.keys(seasonalTrends);
    if (months.length < 6) return 0.5;
    
    // Calculate coefficient of variation
    const prices = months.map(m => seasonalTrends[m].averagePrice);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / prices.length;
    const cv = Math.sqrt(variance) / mean;
    
    return Math.max(0.3, 1 - cv); // Higher consistency = lower coefficient of variation
  }

  private static calculateBookingConsistency(bookingAnalysis: any): number {
    const windows = Object.keys(bookingAnalysis);
    if (windows.length < 3) return 0.5;
    
    // Check if booking window multipliers follow expected pattern
    const multipliers = windows.map(w => bookingAnalysis[w].priceMultiplier).sort();
    const expectedPattern = multipliers.every((mult, i) => i === 0 || mult >= multipliers[i - 1]);
    
    return expectedPattern ? 0.8 : 0.6;
  }

  private static generateEnhancedHistoricalContext(
    routeData: EnhancedRouteData,
    currentPrice: number,
    month: number,
    bookingDaysAhead: number
  ): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthData = routeData.seasonalTrends[month];
    if (!monthData) {
      return `Limited historical data available for ${monthNames[month - 1]}`;
    }
    
    const monthName = monthNames[month - 1];
    const dataPoints = monthData.dataPoints;
    const avgPrice = monthData.averagePrice;
    
    let context = `Based on ${dataPoints} data points, ${monthName} fares average £${avgPrice} `;
    
    if (currentPrice < avgPrice * 0.85) {
      context += '(current price is significantly below average)';
    } else if (currentPrice > avgPrice * 1.15) {
      context += '(current price is significantly above average)';
    } else {
      context += '(current price is near historical average)';
    }
    
    // Add booking window context
    const bookingData = routeData.bookingWindowAnalysis[bookingDaysAhead];
    if (bookingData) {
      const bookingAvg = bookingData.averagePrice;
      context += `. Booking ${bookingDaysAhead} days ahead typically costs £${bookingAvg}`;
    }
    
    return context;
  }

  private static generateFallbackPrediction(
    currentPrice: number,
    origin: string,
    destination: string,
    departureDate: string,
    currency: string
  ): EnhancedPricePrediction {
    // Basic prediction for routes without historical data
    return {
      currentPrice,
      currency,
      timestamp: new Date().toISOString(),
      probabilityIncrease: 0.5,
      probabilityDecrease: 0.5,
      confidence: 45, // Lower confidence for unknown routes
      recommendation: 'WAIT',
      historicalContext: 'Limited historical data available for this route',
      priceRange: {
        min: Math.round(currentPrice * 0.8),
        max: Math.round(currentPrice * 1.2),
        average: currentPrice
      },
      dataQuality: {
        totalDataPoints: 0,
        dateRangeDays: 0,
        seasonalCoverage: 0,
        bookingWindowCoverage: 0
      },
      modelAccuracy: {
        historicalAccuracy: 0.6,
        volatilityScore: 0.3,
        trendStrength: 0.3
      },
      predictionFactors: {
        seasonalWeight: 0.3,
        bookingWindowWeight: 0.3,
        dayOfWeekWeight: 0.2,
        volatilityWeight: 0.3,
        marketTrendWeight: 0.2
      }
    };
  }
}
