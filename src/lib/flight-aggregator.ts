// Flight Price Aggregator - Combines real data (Aviasales) and synthetic data (FlightPriceIQ) for average price calculations
import { AviasalesService, AviasalesSearchParams } from './aviasales';
import { PricePredictionService } from './FlightPriceIQ';

export interface FlightPriceData {
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceCount: number;
  currency: string;
  sources: string[];
  confidence: number;
  lastUpdated: string;
}

export interface AggregatedFlightSearch {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  currency: string;
  directOnly?: boolean;
}

export class FlightPriceAggregator {
  /**
   * Get aggregated average price data from multiple sources
   */
  static async getAverageFlightPrices(params: AggregatedFlightSearch): Promise<FlightPriceData | null> {
    const sources: string[] = [];
    const allPrices: number[] = [];
    let currency = params.currency || 'GBP';

    try {
      // Get data from Aviasales
      const aviasalesParams: AviasalesSearchParams = {
        origin: params.origin,
        destination: params.destination,
        departure_date: params.departureDate,
        return_date: params.returnDate,
        currency: currency,
        limit: 10
      };

      // Get Aviasales data (real flight prices with weighted averaging)
      try {
        const aviasalesStats = await AviasalesService.getPriceStatistics(aviasalesParams);
        if (aviasalesStats) {
          // Use weighted average for more current pricing
          const weightedPrice = aviasalesStats.weightedAverage;
          const simpleAverage = aviasalesStats.average;
          
          // Add both weighted and simple average to provide balance
          allPrices.push(weightedPrice);
          allPrices.push(simpleAverage);
          
          // Add some individual flight prices for variety, but weight recent ones more
          const aviasalesFlights = await AviasalesService.searchFlights(aviasalesParams);
          const recentFlights = aviasalesFlights
            .filter(f => (f.recencyWeight || 1.0) > 1.5)
            .slice(0, 3); // Top 3 recent flights
          
          recentFlights.forEach(flight => allPrices.push(flight.price.amount));
          
          sources.push('Aviasales (Weighted)');
          
          console.log(`Aviasales weighted avg: £${weightedPrice}, simple avg: £${simpleAverage}, recent flights: ${recentFlights.length}`);
        }
      } catch (error) {
        console.error('Error fetching Aviasales data:', error);
      }

      // Add synthetic data from FlightPriceIQ for comprehensive averaging
      const route = `${params.origin}-${params.destination}`;
      const currentMonth = new Date(params.departureDate).getMonth() + 1;
      const prediction = PricePredictionService.generatePrediction(
        allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 400,
        params.origin,
        params.destination,
        params.departureDate,
        currency
      );

      // Add synthetic historical data points for better averaging
      // Use min, average, and max from historical data to create realistic price distribution
      allPrices.push(prediction.priceRange.min);
      allPrices.push(prediction.priceRange.average);
      allPrices.push(prediction.priceRange.max);
      sources.push('Synthetic Data (FlightPriceIQ)');

      if (allPrices.length === 0) {
        return null;
      }

      // Calculate comprehensive statistics
      const averagePrice = Math.round(allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);

      // Calculate confidence based on data sources and price consistency
      let confidence = 75; // Higher base confidence with quality real + synthetic data
      if (sources.includes('Aviasales') && sources.includes('Synthetic Data (FlightPriceIQ)')) {
        confidence += 10; // Bonus for having both real and synthetic data
      }
      if (allPrices.length >= 10) confidence += 5; // Bonus for large sample size
      
      // Check price consistency (lower standard deviation = higher confidence)
      const mean = averagePrice;
      const variance = allPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / allPrices.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / mean;
      
      if (coefficientOfVariation < 0.15) confidence += 10; // Low variation
      else if (coefficientOfVariation > 0.3) confidence -= 10; // High variation

      confidence = Math.max(50, Math.min(95, confidence));

      return {
        averagePrice,
        minPrice,
        maxPrice,
        priceCount: allPrices.length,
        currency,
        sources,
        confidence,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error aggregating flight prices:', error);
      return null;
    }
  }

  /**
   * Get price trend analysis comparing current average to historical data
   */
  static async getPriceTrend(params: AggregatedFlightSearch): Promise<{
    currentAverage: number;
    historicalAverage: number;
    trendDirection: 'up' | 'down' | 'stable';
    percentageChange: number;
    recommendation: 'BUY_NOW' | 'WAIT';
  } | null> {
    const currentData = await this.getAverageFlightPrices(params);
    if (!currentData) return null;

    const prediction = PricePredictionService.generatePrediction(
      currentData.averagePrice,
      params.origin,
      params.destination,
      params.departureDate,
      params.currency || 'GBP'
    );

    const historicalAverage = prediction.priceRange.average;
    const percentageChange = ((currentData.averagePrice - historicalAverage) / historicalAverage) * 100;

    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentageChange) > 5) {
      trendDirection = percentageChange > 0 ? 'up' : 'down';
    }

    return {
      currentAverage: currentData.averagePrice,
      historicalAverage,
      trendDirection,
      percentageChange: Math.round(percentageChange * 100) / 100,
      recommendation: prediction.recommendation
    };
  }

  /**
   * Get comprehensive flight analysis with average pricing focus
   */
  static async getFlightAnalysis(params: AggregatedFlightSearch) {
    const [priceData, trendData] = await Promise.all([
      this.getAverageFlightPrices(params),
      this.getPriceTrend(params)
    ]);

    if (!priceData || !trendData) {
      return null;
    }

    const prediction = PricePredictionService.generatePrediction(
      priceData.averagePrice,
      params.origin,
      params.destination,
      params.departureDate,
      params.currency || 'GBP'
    );

    return {
      pricing: priceData,
      trend: trendData,
      prediction: {
        ...prediction,
        currentPrice: priceData.averagePrice, // Use aggregated average as current price
        displayPrefix: 'avg. ', // Indicate this is an average price
        isExact: false,
        minToday: priceData.minPrice,
        maxToday: priceData.maxPrice,
        dataQuality: {
          totalDataPoints: priceData.priceCount,
          sources: priceData.sources.join(', '),
          confidence: priceData.confidence
        }
      }
    };
  }

  /**
   * Get spotlight routes with real average pricing data
   */
  static async getSpotlightRoutesWithRealData(): Promise<Array<{
    route: string;
    origin: string;
    destination: string;
    originName: string;
    destinationName: string;
    currentPrice: number;
    averageTotal: number;
    returnPrice: number;
    totalPrice: number;
    discountPercentage: number;
    discount: number;
    recommendation: 'BUY_NOW' | 'WAIT';
    confidence: number;
  }>> {
    const routes = [
      {
        route: 'LHR-JFK',
        origin: 'LHR',
        destination: 'JFK',
        originName: 'London Heathrow',
        destinationName: 'New York JFK'
      },
      {
        route: 'LHR-DXB',
        origin: 'LHR',
        destination: 'DXB',
        originName: 'London Heathrow',
        destinationName: 'Dubai'
      },
      {
        route: 'LHR-LAX',
        origin: 'LHR',
        destination: 'LAX',
        originName: 'London Heathrow',
        destinationName: 'Los Angeles'
      }
    ];

    const departureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const returnDate = new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const results = await Promise.all(
      routes.map(async (route) => {
        // Get outbound pricing
        const outboundData = await this.getAverageFlightPrices({
          origin: route.origin,
          destination: route.destination,
          departureDate,
          currency: 'GBP'
        });

        // Get return pricing
        const returnData = await this.getAverageFlightPrices({
          origin: route.destination,
          destination: route.origin,
          departureDate: returnDate,
          currency: 'GBP'
        });

        const currentPrice = outboundData?.averagePrice || 450;
        const returnPrice = returnData?.averagePrice || 450;
        const totalPrice = currentPrice + returnPrice;

        // Get historical average for comparison
        const prediction = PricePredictionService.generatePrediction(
          currentPrice,
          route.origin,
          route.destination,
          departureDate
        );

        const historicalTotal = prediction.priceRange.average * 2; // Round trip
        const discount = Math.max(0, historicalTotal - totalPrice);
        const discountPercentage = Math.round((discount / historicalTotal) * 100);

        return {
          ...route,
          currentPrice,
          returnPrice,
          totalPrice,
          averageTotal: historicalTotal,
          discount,
          discountPercentage,
          recommendation: prediction.recommendation,
          confidence: outboundData?.confidence || 75
        };
      })
    );

    return results;
  }
}
