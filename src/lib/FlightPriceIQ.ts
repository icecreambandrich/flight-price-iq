// Removed amadeus import as it's not needed in this context

export interface PriceHistory {
  date: string;
  price: number;
  currency: string;
}

export interface PricePrediction {
  currentPrice: number;
  currency: string;
  timestamp: string;
  probabilityIncrease: number;
  probabilityDecrease: number;
  confidence: number;
  recommendation: 'BUY_NOW' | 'WAIT';
  historicalContext: string;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
}

export interface RouteAnalysis {
  route: string;
  month: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceVariation: number;
}

export class PricePredictionService {
  private static readonly HISTORICAL_DATA: { [key: string]: RouteAnalysis[] } = {
    'LHR-KUL': [
      { route: 'LHR-KUL', month: 1, averagePrice: 650, minPrice: 580, maxPrice: 720, priceVariation: 0.15 },
      { route: 'LHR-KUL', month: 2, averagePrice: 620, minPrice: 550, maxPrice: 690, priceVariation: 0.18 },
      { route: 'LHR-KUL', month: 3, averagePrice: 680, minPrice: 610, maxPrice: 750, priceVariation: 0.16 },
      { route: 'LHR-KUL', month: 4, averagePrice: 720, minPrice: 650, maxPrice: 790, priceVariation: 0.14 },
      { route: 'LHR-KUL', month: 5, averagePrice: 750, minPrice: 680, maxPrice: 820, priceVariation: 0.13 },
      { route: 'LHR-KUL', month: 6, averagePrice: 820, minPrice: 750, maxPrice: 890, priceVariation: 0.12 },
      { route: 'LHR-KUL', month: 7, averagePrice: 880, minPrice: 810, maxPrice: 950, priceVariation: 0.11 },
      { route: 'LHR-KUL', month: 8, averagePrice: 860, minPrice: 790, maxPrice: 930, priceVariation: 0.12 },
      { route: 'LHR-KUL', month: 9, averagePrice: 720, minPrice: 650, maxPrice: 790, priceVariation: 0.14 },
      { route: 'LHR-KUL', month: 10, averagePrice: 680, minPrice: 610, maxPrice: 750, priceVariation: 0.16 },
      { route: 'LHR-KUL', month: 11, averagePrice: 740, minPrice: 670, maxPrice: 810, priceVariation: 0.13 },
      { route: 'LHR-KUL', month: 12, averagePrice: 820, minPrice: 750, maxPrice: 890, priceVariation: 0.12 }
    ],
    'LHR-JFK': [
      { route: 'LHR-JFK', month: 1, averagePrice: 420, minPrice: 350, maxPrice: 490, priceVariation: 0.20 },
      { route: 'LHR-JFK', month: 2, averagePrice: 380, minPrice: 320, maxPrice: 440, priceVariation: 0.22 },
      { route: 'LHR-JFK', month: 3, averagePrice: 450, minPrice: 380, maxPrice: 520, priceVariation: 0.18 },
      { route: 'LHR-JFK', month: 4, averagePrice: 520, minPrice: 450, maxPrice: 590, priceVariation: 0.16 },
      { route: 'LHR-JFK', month: 5, averagePrice: 580, minPrice: 510, maxPrice: 650, priceVariation: 0.15 },
      { route: 'LHR-JFK', month: 6, averagePrice: 680, minPrice: 610, maxPrice: 750, priceVariation: 0.12 },
      { route: 'LHR-JFK', month: 7, averagePrice: 750, minPrice: 680, maxPrice: 820, priceVariation: 0.11 },
      { route: 'LHR-JFK', month: 8, averagePrice: 720, minPrice: 650, maxPrice: 790, priceVariation: 0.12 },
      { route: 'LHR-JFK', month: 9, averagePrice: 520, minPrice: 450, maxPrice: 590, priceVariation: 0.16 },
      { route: 'LHR-JFK', month: 10, averagePrice: 480, minPrice: 410, maxPrice: 550, priceVariation: 0.17 },
      { route: 'LHR-JFK', month: 11, averagePrice: 450, minPrice: 380, maxPrice: 520, priceVariation: 0.18 },
      { route: 'LHR-JFK', month: 12, averagePrice: 520, minPrice: 450, maxPrice: 590, priceVariation: 0.16 }
    ],
    'DXB-LHR': [
      { route: 'DXB-LHR', month: 1, averagePrice: 480, minPrice: 420, maxPrice: 540, priceVariation: 0.18 },
      { route: 'DXB-LHR', month: 2, averagePrice: 450, minPrice: 390, maxPrice: 510, priceVariation: 0.20 },
      { route: 'DXB-LHR', month: 3, averagePrice: 520, minPrice: 460, maxPrice: 580, priceVariation: 0.16 },
      { route: 'DXB-LHR', month: 4, averagePrice: 580, minPrice: 520, maxPrice: 640, priceVariation: 0.14 },
      { route: 'DXB-LHR', month: 5, averagePrice: 620, minPrice: 560, maxPrice: 680, priceVariation: 0.13 },
      { route: 'DXB-LHR', month: 6, averagePrice: 680, minPrice: 620, maxPrice: 740, priceVariation: 0.12 },
      { route: 'DXB-LHR', month: 7, averagePrice: 750, minPrice: 690, maxPrice: 810, priceVariation: 0.11 },
      { route: 'DXB-LHR', month: 8, averagePrice: 720, minPrice: 660, maxPrice: 780, priceVariation: 0.12 },
      { route: 'DXB-LHR', month: 9, averagePrice: 580, minPrice: 520, maxPrice: 640, priceVariation: 0.14 },
      { route: 'DXB-LHR', month: 10, averagePrice: 540, minPrice: 480, maxPrice: 600, priceVariation: 0.16 },
      { route: 'DXB-LHR', month: 11, averagePrice: 520, minPrice: 460, maxPrice: 580, priceVariation: 0.16 },
      { route: 'DXB-LHR', month: 12, averagePrice: 580, minPrice: 520, maxPrice: 640, priceVariation: 0.14 }
    ],
    'LAX-HND': [
      { route: 'LAX-HND', month: 1, averagePrice: 850, minPrice: 750, maxPrice: 950, priceVariation: 0.16 },
      { route: 'LAX-HND', month: 2, averagePrice: 820, minPrice: 720, maxPrice: 920, priceVariation: 0.18 },
      { route: 'LAX-HND', month: 3, averagePrice: 900, minPrice: 800, maxPrice: 1000, priceVariation: 0.15 },
      { route: 'LAX-HND', month: 4, averagePrice: 950, minPrice: 850, maxPrice: 1050, priceVariation: 0.14 },
      { route: 'LAX-HND', month: 5, averagePrice: 1000, minPrice: 900, maxPrice: 1100, priceVariation: 0.13 },
      { route: 'LAX-HND', month: 6, averagePrice: 1100, minPrice: 1000, maxPrice: 1200, priceVariation: 0.12 },
      { route: 'LAX-HND', month: 7, averagePrice: 1200, minPrice: 1100, maxPrice: 1300, priceVariation: 0.11 },
      { route: 'LAX-HND', month: 8, averagePrice: 1150, minPrice: 1050, maxPrice: 1250, priceVariation: 0.12 },
      { route: 'LAX-HND', month: 9, averagePrice: 950, minPrice: 850, maxPrice: 1050, priceVariation: 0.14 },
      { route: 'LAX-HND', month: 10, averagePrice: 900, minPrice: 800, maxPrice: 1000, priceVariation: 0.15 },
      { route: 'LAX-HND', month: 11, averagePrice: 850, minPrice: 750, maxPrice: 950, priceVariation: 0.16 },
      { route: 'LAX-HND', month: 12, averagePrice: 950, minPrice: 850, maxPrice: 1050, priceVariation: 0.14 }
    ],
    'SFO-NRT': [
      { route: 'SFO-NRT', month: 1, averagePrice: 780, minPrice: 680, maxPrice: 880, priceVariation: 0.17 },
      { route: 'SFO-NRT', month: 2, averagePrice: 750, minPrice: 650, maxPrice: 850, priceVariation: 0.19 },
      { route: 'SFO-NRT', month: 3, averagePrice: 820, minPrice: 720, maxPrice: 920, priceVariation: 0.16 },
      { route: 'SFO-NRT', month: 4, averagePrice: 880, minPrice: 780, maxPrice: 980, priceVariation: 0.15 },
      { route: 'SFO-NRT', month: 5, averagePrice: 920, minPrice: 820, maxPrice: 1020, priceVariation: 0.14 },
      { route: 'SFO-NRT', month: 6, averagePrice: 1000, minPrice: 900, maxPrice: 1100, priceVariation: 0.13 },
      { route: 'SFO-NRT', month: 7, averagePrice: 1100, minPrice: 1000, maxPrice: 1200, priceVariation: 0.12 },
      { route: 'SFO-NRT', month: 8, averagePrice: 1050, minPrice: 950, maxPrice: 1150, priceVariation: 0.13 },
      { route: 'SFO-NRT', month: 9, averagePrice: 880, minPrice: 780, maxPrice: 980, priceVariation: 0.15 },
      { route: 'SFO-NRT', month: 10, averagePrice: 820, minPrice: 720, maxPrice: 920, priceVariation: 0.16 },
      { route: 'SFO-NRT', month: 11, averagePrice: 780, minPrice: 680, maxPrice: 880, priceVariation: 0.17 },
      { route: 'SFO-NRT', month: 12, averagePrice: 880, minPrice: 780, maxPrice: 980, priceVariation: 0.15 }
    ],
    'JFK-CDG': [
      { route: 'JFK-CDG', month: 1, averagePrice: 420, minPrice: 360, maxPrice: 480, priceVariation: 0.19 },
      { route: 'JFK-CDG', month: 2, averagePrice: 390, minPrice: 330, maxPrice: 450, priceVariation: 0.21 },
      { route: 'JFK-CDG', month: 3, averagePrice: 460, minPrice: 400, maxPrice: 520, priceVariation: 0.17 },
      { route: 'JFK-CDG', month: 4, averagePrice: 520, minPrice: 460, maxPrice: 580, priceVariation: 0.15 },
      { route: 'JFK-CDG', month: 5, averagePrice: 580, minPrice: 520, maxPrice: 640, priceVariation: 0.14 },
      { route: 'JFK-CDG', month: 6, averagePrice: 680, minPrice: 620, maxPrice: 740, priceVariation: 0.12 },
      { route: 'JFK-CDG', month: 7, averagePrice: 750, minPrice: 690, maxPrice: 810, priceVariation: 0.11 },
      { route: 'JFK-CDG', month: 8, averagePrice: 720, minPrice: 660, maxPrice: 780, priceVariation: 0.12 },
      { route: 'JFK-CDG', month: 9, averagePrice: 520, minPrice: 460, maxPrice: 580, priceVariation: 0.15 },
      { route: 'JFK-CDG', month: 10, averagePrice: 480, minPrice: 420, maxPrice: 540, priceVariation: 0.17 },
      { route: 'JFK-CDG', month: 11, averagePrice: 460, minPrice: 400, maxPrice: 520, priceVariation: 0.17 },
      { route: 'JFK-CDG', month: 12, averagePrice: 520, minPrice: 460, maxPrice: 580, priceVariation: 0.15 }
    ]
  };

  /**
   * Generate price prediction based on current price and historical data
   */
  static generatePrediction(
    currentPrice: number,
    origin: string,
    destination: string,
    departureDate: string,
    currency: string = 'GBP'
  ): PricePrediction {
    const route = `${origin}-${destination}`;
    const date = new Date(departureDate);
    const month = date.getMonth() + 1;
    
    // Get historical data for the route
    const historicalData = this.HISTORICAL_DATA[route] || this.getGenericHistoricalData(month);
    const monthData = historicalData.find(data => data.month === month) || historicalData[0];
    
    // Calculate price position relative to historical range
    const pricePosition = (currentPrice - monthData.minPrice) / (monthData.maxPrice - monthData.minPrice);
    
    // Calculate probabilities based on price position and seasonal trends
    const { probabilityIncrease, probabilityDecrease } = this.calculateProbabilities(
      currentPrice,
      monthData,
      pricePosition,
      date
    );
    
    // Calculate confidence based on data quality and price volatility
    const confidence = this.calculateConfidence(monthData, pricePosition);
    
    // Generate recommendation
    const recommendation = probabilityIncrease >= 0.8 ? 'BUY_NOW' : 'WAIT';
    
    // Generate historical context
    const historicalContext = this.generateHistoricalContext(monthData, currentPrice, month);
    
    return {
      currentPrice,
      currency,
      timestamp: new Date().toISOString(),
      probabilityIncrease,
      probabilityDecrease,
      confidence,
      recommendation,
      historicalContext,
      priceRange: {
        min: monthData.minPrice,
        max: monthData.maxPrice,
        average: monthData.averagePrice
      }
    };
  }

  private static calculateProbabilities(
    currentPrice: number,
    monthData: RouteAnalysis,
    pricePosition: number,
    departureDate: Date
  ): { probabilityIncrease: number; probabilityDecrease: number } {
    // Base probability on price position
    let probabilityIncrease = 0.5;
    
    if (pricePosition < 0.3) {
      // Price is in lower 30% - likely to increase
      probabilityIncrease = 0.75;
    } else if (pricePosition > 0.7) {
      // Price is in upper 30% - likely to decrease
      probabilityIncrease = 0.25;
    } else {
      // Price is in middle range
      probabilityIncrease = 0.5;
    }
    
    // Adjust based on booking window
    const daysUntilDeparture = Math.ceil((departureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeparture < 14) {
      // Last-minute booking - prices tend to increase
      probabilityIncrease += 0.2;
    } else if (daysUntilDeparture > 90) {
      // Very early booking - prices might fluctuate more
      probabilityIncrease += 0.1;
    }
    
    // Add some randomness based on market volatility
    const volatilityFactor = monthData.priceVariation * (Math.random() - 0.5) * 0.2;
    probabilityIncrease += volatilityFactor;
    
    // Ensure probabilities are within bounds
    probabilityIncrease = Math.max(0.1, Math.min(0.9, probabilityIncrease));
    const probabilityDecrease = 1 - probabilityIncrease;
    
    return {
      probabilityIncrease: Math.round(probabilityIncrease * 100) / 100,
      probabilityDecrease: Math.round(probabilityDecrease * 100) / 100
    };
  }

  private static calculateConfidence(monthData: RouteAnalysis, pricePosition: number): number {
    // Base confidence on data availability and price volatility
    let confidence = 0.8;
    
    // Lower confidence for high volatility routes
    if (monthData.priceVariation > 0.2) {
      confidence -= 0.2;
    }
    
    // Higher confidence when price is at extremes
    if (pricePosition < 0.2 || pricePosition > 0.8) {
      confidence += 0.1;
    }
    
    // Add some randomness
    confidence += (Math.random() - 0.5) * 0.1;
    
    return Math.max(60, Math.min(95, Math.round(confidence * 100)));
  }

  private static generateHistoricalContext(
    monthData: RouteAnalysis,
    currentPrice: number,
    month: number
  ): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthName = monthNames[month - 1];
    const avgPrice = monthData.averagePrice;
    const minPrice = monthData.minPrice;
    const maxPrice = monthData.maxPrice;
    
    let context = `${monthName} fares average £${avgPrice}–£${maxPrice}; `;
    
    if (currentPrice < avgPrice * 0.9) {
      context += 'today is below typical range';
    } else if (currentPrice > avgPrice * 1.1) {
      context += 'today is above typical range';
    } else {
      context += 'today is within typical range';
    }
    
    return context;
  }

  private static getGenericHistoricalData(month: number): RouteAnalysis[] {
    // Generic seasonal pattern for unknown routes
    const basePrice = 400;
    const seasonalMultipliers = [0.8, 0.75, 0.9, 1.0, 1.1, 1.3, 1.4, 1.35, 1.0, 0.9, 0.85, 1.1];
    
    return seasonalMultipliers.map((multiplier, index) => ({
      route: 'GENERIC',
      month: index + 1,
      averagePrice: Math.round(basePrice * multiplier),
      minPrice: Math.round(basePrice * multiplier * 0.8),
      maxPrice: Math.round(basePrice * multiplier * 1.2),
      priceVariation: 0.15
    }));
  }

  /**
   * Get spotlight routes with current predictions
   */
  static getSpotlightRoutes(): Array<{
    route: string;
    origin: string;
    destination: string;
    originName: string;
    destinationName: string;
    currentPrice: number;
    recommendation: 'BUY_NOW' | 'WAIT';
    confidence: number;
  }> {
    const routes = [
      {
        route: 'LHR-JFK',
        origin: 'LHR',
        destination: 'JFK',
        originName: 'London Heathrow',
        destinationName: 'New York JFK'
      },
      {
        route: 'DXB-LHR',
        origin: 'DXB',
        destination: 'LHR',
        originName: 'Dubai',
        destinationName: 'London Heathrow'
      },
      {
        route: 'LAX-HND',
        origin: 'LAX',
        destination: 'HND',
        originName: 'Los Angeles',
        destinationName: 'Tokyo Haneda'
      },
      {
        route: 'SFO-NRT',
        origin: 'SFO',
        destination: 'NRT',
        originName: 'San Francisco',
        destinationName: 'Tokyo Narita'
      },
      {
        route: 'JFK-CDG',
        origin: 'JFK',
        destination: 'CDG',
        originName: 'New York JFK',
        destinationName: 'Paris CDG'
      }
    ];

    return routes.map(route => {
      const currentMonth = new Date().getMonth() + 1;
      const monthData = this.HISTORICAL_DATA[route.route]?.find(data => data.month === currentMonth);
      const currentPrice = monthData ? 
        Math.round(monthData.averagePrice + (Math.random() - 0.5) * monthData.averagePrice * 0.2) :
        400;
      
      const prediction = this.generatePrediction(
        currentPrice,
        route.origin,
        route.destination,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );

      return {
        ...route,
        currentPrice,
        recommendation: prediction.recommendation,
        confidence: prediction.confidence
      };
    });
  }
}
