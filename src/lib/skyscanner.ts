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
    const basePrice = Math.floor(Math.random() * 400) + 200;
    const airlines = [
      { id: 'BA', name: 'British Airways' },
      { id: 'LH', name: 'Lufthansa' },
      { id: 'AF', name: 'Air France' },
      { id: 'KL', name: 'KLM' },
      { id: 'VS', name: 'Virgin Atlantic' }
    ];

    const mockFlights: SkyscannerFlightOffer[] = [];

    for (let i = 0; i < 5; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const priceVariation = Math.floor(Math.random() * 200) - 100;
      const totalPrice = Math.max(150, basePrice + priceVariation);

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
          departure: `${params.departureDate}T${(Math.floor(Math.random() * 16) + 6).toString().padStart(2, '0')}:00:00`,
          arrival: `${params.departureDate}T${(Math.floor(Math.random() * 16) + 8).toString().padStart(2, '0')}:00:00`,
          duration: Math.floor(Math.random() * 480) + 60, // 1-8 hours
          carriers: [airline],
          segments: Math.random() > 0.7 ? 2 : 1 // 30% chance of connecting flight
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
}
