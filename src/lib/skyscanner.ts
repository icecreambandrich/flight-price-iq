// Skyscanner API integration via RapidAPI
// Get your API key from: https://rapidapi.com/3b-data-3b-data-default/api/skyscanner44

export interface SkyscannerFlightOffer {
  id: string;
  price: {
    amount: number;
    currency: string;
  };
  legs: Array<{
    origin: {
      id: string;
      name: string;
    };
    destination: {
      id: string;
      name: string;
    };
    departure: string;
    arrival: string;
    duration: number;
    carriers: Array<{
      id: string;
      name: string;
    }>;
    segments: number;
  }>;
  deeplink: string;
}

export interface SkyscannerSearchParams {
  originSkyId: string;
  destinationSkyId: string;
  originEntityId: string;
  destinationEntityId: string;
  departureDate: string;
  returnDate?: string;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  adults: number;
  children?: number;
  infants?: number;
  sortBy: 'best' | 'price_high' | 'fastest' | 'outbound_take_off_time' | 'outbound_landing_time' | 'return_take_off_time' | 'return_landing_time';
  currency: string;
  market: string;
  countryCode: string;
}

export class SkyscannerService {
  private static readonly API_KEY = process.env.RAPIDAPI_SKYSCANNER_KEY;
  private static readonly BASE_URL = 'https://skyscanner44.p.rapidapi.com';

  /**
   * Search for flights using Skyscanner API
   */
  static async searchFlights(params: SkyscannerSearchParams): Promise<SkyscannerFlightOffer[]> {
    if (!this.API_KEY) {
      console.log('No Skyscanner API key found, using fallback');
      return this.generateMockSkyscannerData(params);
    }

    try {
      const searchParams = new URLSearchParams({
        originSkyId: params.originSkyId,
        destinationSkyId: params.destinationSkyId,
        originEntityId: params.originEntityId,
        destinationEntityId: params.destinationEntityId,
        departureDate: params.departureDate,
        cabinClass: params.cabinClass,
        adults: params.adults.toString(),
        sortBy: params.sortBy,
        currency: params.currency,
        market: params.market,
        countryCode: params.countryCode
      });

      if (params.returnDate) {
        searchParams.append('returnDate', params.returnDate);
      }
      if (params.children) {
        searchParams.append('children', params.children.toString());
      }
      if (params.infants) {
        searchParams.append('infants', params.infants.toString());
      }

      const response = await fetch(`${this.BASE_URL}/search?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.API_KEY,
          'X-RapidAPI-Host': 'skyscanner44.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error(`Skyscanner API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseSkyscannerResponse(data);
    } catch (error) {
      console.error('Skyscanner API error:', error);
      return this.generateMockSkyscannerData(params);
    }
  }

  /**
   * Get airport/city information for search
   */
  static async searchPlaces(query: string): Promise<any[]> {
    if (!this.API_KEY) {
      return [];
    }

    try {
      const response = await fetch(`${this.BASE_URL}/searchAirport?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.API_KEY,
          'X-RapidAPI-Host': 'skyscanner44.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error(`Skyscanner places API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Skyscanner places API error:', error);
      return [];
    }
  }

  /**
   * Parse Skyscanner API response into our format
   */
  private static parseSkyscannerResponse(data: any): SkyscannerFlightOffer[] {
    if (!data.itineraries || !Array.isArray(data.itineraries.results)) {
      return [];
    }

    return data.itineraries.results.map((result: any, index: number) => ({
      id: result.id || `skyscanner_${index}`,
      price: {
        amount: result.price?.raw || 0,
        currency: result.price?.currency || 'GBP'
      },
      legs: result.legs?.map((leg: any) => ({
        origin: {
          id: leg.origin?.id || '',
          name: leg.origin?.name || ''
        },
        destination: {
          id: leg.destination?.id || '',
          name: leg.destination?.name || ''
        },
        departure: leg.departure || '',
        arrival: leg.arrival || '',
        duration: leg.durationInMinutes || 0,
        carriers: leg.carriers?.map((carrier: any) => ({
          id: carrier.id || '',
          name: carrier.name || ''
        })) || [],
        segments: leg.segments?.length || 1
      })) || [],
      deeplink: result.deeplink || ''
    }));
  }

  /**
   * Generate mock Skyscanner-style data when API is not available
   */
  private static generateMockSkyscannerData(params: SkyscannerSearchParams): SkyscannerFlightOffer[] {
    // Use deterministic base price calculation for consistency
    const basePrice = this.calculateBasePrice(params.originSkyId, params.destinationSkyId);
    const airlines = [
      { id: 'BA', name: 'British Airways' },
      { id: 'LH', name: 'Lufthansa' },
      { id: 'AF', name: 'Air France' },
      { id: 'KL', name: 'KLM' },
      { id: 'VS', name: 'Virgin Atlantic' },
      { id: 'EK', name: 'Emirates' },
      { id: 'QR', name: 'Qatar Airways' },
      { id: 'TK', name: 'Turkish Airlines' },
      { id: 'SQ', name: 'Singapore Airlines' },
      { id: 'CX', name: 'Cathay Pacific' }
    ];

    const mockFlights: SkyscannerFlightOffer[] = [];
    // Generate more flights for better average calculation
    const priceVariations = [1.0, 1.08, 1.15, 1.22, 1.30, 1.38, 1.45, 1.52, 1.60, 1.70];

    for (let i = 0; i < 10; i++) {
      const airline = airlines[i % airlines.length];
      const totalPrice = Math.round(basePrice * priceVariations[i]);

      mockFlights.push({
        id: `mock_skyscanner_${i + 1}`,
        price: {
          amount: totalPrice,
          currency: params.currency
        },
        legs: [{
          origin: {
            id: params.originSkyId,
            name: params.originSkyId
          },
          destination: {
            id: params.destinationSkyId,
            name: params.destinationSkyId
          },
          departure: `${params.departureDate}T${(6 + i).toString().padStart(2, '0')}:00:00`,
          arrival: `${params.departureDate}T${(8 + i + Math.floor(i/2)).toString().padStart(2, '0')}:00:00`,
          duration: 120 + (i * 30), // Varying durations
          carriers: [airline],
          segments: i > 6 ? 2 : 1 // Last 3 have connections
        }],
        deeplink: `https://wayaway.io/flights/${params.originSkyId}${params.destinationSkyId}/${params.departureDate}/${params.returnDate || params.departureDate}/1/0/0/E`
      });
    }

    return mockFlights.sort((a, b) => a.price.amount - b.price.amount);
  }

  /**
   * Convert airport IATA code to Skyscanner Sky ID (simplified mapping)
   */
  static getSkySkyId(iataCode: string): string {
    // This is a simplified mapping. In production, you'd use the searchPlaces API
    // to get the proper Sky IDs
    const mapping: { [key: string]: string } = {
      'LHR': 'LHR',
      'LGW': 'LGW',
      'STN': 'STN',
      'LTN': 'LTN',
      'CDG': 'CDG',
      'FRA': 'FRA',
      'AMS': 'AMS',
      'BCN': 'BCN',
      'MAD': 'MAD',
      'FCO': 'FCO',
      'JFK': 'JFK',
      'LAX': 'LAX',
      'DXB': 'DXB'
    };
    
    return mapping[iataCode] || iataCode;
  }

  /**
   * Convert airport IATA code to Skyscanner Entity ID (simplified mapping)
   */
  static getEntityId(iataCode: string): string {
    // This is a simplified mapping. In production, you'd use the searchPlaces API
    const mapping: { [key: string]: string } = {
      'LHR': '27544008',
      'LGW': '27544055',
      'STN': '27544079',
      'LTN': '27544064',
      'CDG': '27539793',
      'FRA': '27539663',
      'AMS': '27544735',
      'BCN': '27539614',
      'MAD': '27539733',
      'FCO': '27539793',
      'JFK': '27537542',
      'LAX': '27537465',
      'DXB': '27544735'
    };
    
    return mapping[iataCode] || '27544008'; // Default to LHR
  }

  /**
   * Calculate base price for route (similar to Aviasales)
   */
  private static calculateBasePrice(origin: string, destination: string): number {
    const routes: { [key: string]: number } = {
      // European routes
      'LGW-MXP': 85, 'MXP-LGW': 85,
      'LHR-CDG': 95, 'CDG-LHR': 95,
      'LGW-BCN': 105, 'BCN-LGW': 105,
      'LHR-DUB': 75, 'DUB-LHR': 75,
      
      // Transatlantic routes
      'LHR-JFK': 450, 'JFK-LHR': 450,
      'LGW-JFK': 450, 'JFK-LGW': 450,
      'LHR-LAX': 470, 'LAX-LHR': 470,
      'LHR-BOS': 440, 'BOS-LHR': 440,
      
      // Other major routes
      'LHR-SYD': 820, 'SYD-LHR': 820,
      'LHR-DXB': 370, 'DXB-LHR': 370,
      'LHR-ACC': 470, 'ACC-LHR': 470,
      'JFK-ACC': 670, 'ACC-JFK': 670
    };

    const routeKey = `${origin}-${destination}`;
    return routes[routeKey] || 220; // Default price for unknown routes
  }

  /**
   * Get average price for a route
   */
  static async getAveragePrice(params: SkyscannerSearchParams): Promise<number | null> {
    const flights = await this.searchFlights(params);
    if (flights.length === 0) return null;
    
    const totalPrice = flights.reduce((sum, flight) => sum + flight.price.amount, 0);
    return Math.round(totalPrice / flights.length);
  }

  /**
   * Get price statistics for a route
   */
  static async getPriceStatistics(params: SkyscannerSearchParams): Promise<{
    average: number;
    min: number;
    max: number;
    count: number;
    currency: string;
  } | null> {
    const flights = await this.searchFlights(params);
    if (flights.length === 0) return null;
    
    const prices = flights.map(flight => flight.price.amount);
    const totalPrice = prices.reduce((sum, price) => sum + price, 0);
    
    return {
      average: Math.round(totalPrice / prices.length),
      min: Math.min(...prices),
      max: Math.max(...prices),
      count: prices.length,
      currency: params.currency
    };
  }
}
