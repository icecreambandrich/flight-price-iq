// Aviasales API integration via Travel Payouts
// Get your API key from: https://www.travelpayouts.com/

export interface AviasalesFlightOffer {
  id: string;
  price: {
    amount: number;
    currency: string;
  };
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  airline: string;
  flight_number: string;
  duration: number;
  transfers: number;
  link: string;
}

export interface AviasalesSearchParams {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  currency: string;
  limit?: number;
}

export class AviasalesService {
  private static readonly API_KEY = process.env.TRAVEL_PAYOUTS_API_KEY;
  // Use top-level base URL. Specific API versions are appended per-endpoint.
  private static readonly BASE_URL = 'https://api.travelpayouts.com';

  /**
   * Search for flights using Aviasales API
   */
  static async searchFlights(params: AviasalesSearchParams): Promise<AviasalesFlightOffer[]> {
    console.log('AviasalesService.searchFlights called with:', params);
    console.log('API_KEY available:', !!this.API_KEY);
    console.log('API_KEY value:', this.API_KEY ? `${this.API_KEY.substring(0, 8)}...` : 'undefined');
    
    if (!this.API_KEY) {
      console.log('No Travel Payouts API key found, using mock Aviasales data');
      return this.generateMockAviasalesData(params);
    }

  

    try {
      // Use the month-matrix endpoint which returns real price data
      const departureDate = new Date(params.departure_date);
      const monthStr = `${departureDate.getFullYear()}-${String(departureDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Convert airport codes to city codes (Travel Payouts uses city codes)
      const originCity = this.convertAirportToCity(params.origin);
      const destinationCity = this.convertAirportToCity(params.destination);
      
      const monthParams = new URLSearchParams({
        origin: originCity,
        destination: destinationCity,
        month: monthStr,
        currency: params.currency,
        token: this.API_KEY
      });

      console.log('Calling Travel Payouts Month Matrix API:', `${this.BASE_URL}/v2/prices/month-matrix?${monthParams.toString()}`);
      
      const monthResponse = await fetch(`${this.BASE_URL}/v2/prices/month-matrix?${monthParams.toString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      console.log('Month Matrix API response status:', monthResponse.status);
      
      if (monthResponse.ok) {
        const monthData = await monthResponse.json();
        console.log('Month Matrix API response received, items:', Array.isArray(monthData?.data) ? monthData.data.length : 0);
        
        if (monthData.data && monthData.data.length > 0) {
          // Parse the real flight data
          return this.parseMonthMatrixResponse(monthData, params);
        }
      }

      console.log('Travel Payouts API returned no data, falling back to mock data');
      throw new Error('No flight data available from Travel Payouts API');

    } catch (error) {
      console.error('Aviasales API error:', error);
      console.log('Falling back to mock data due to API error');
      return this.generateMockAviasalesData(params);
    }
  }

  /**
   * Convert airport codes to city codes for Travel Payouts API
   */
  static convertAirportToCity(airportCode: string): string {
    const airportToCityMap: { [key: string]: string } = {
      'LHR': 'LON', // London Heathrow -> London
      'LGW': 'LON', // London Gatwick -> London
      'STN': 'LON', // London Stansted -> London
      'LTN': 'LON', // London Luton -> London
      'JFK': 'NYC', // JFK -> New York
      'LGA': 'NYC', // LaGuardia -> New York
      'EWR': 'NYC', // Newark -> New York
      'CDG': 'PAR', // Charles de Gaulle -> Paris
      'ORY': 'PAR', // Orly -> Paris
      'MXP': 'MIL', // Milan Malpensa -> Milan
      'LIN': 'MIL', // Milan Linate -> Milan
      'BCN': 'BCN', // Barcelona
      'DUB': 'DUB', // Dublin
      'LAX': 'LAX', // Los Angeles
      'SYD': 'SYD', // Sydney
      'DXB': 'DXB', // Dubai
      'BOS': 'BOS', // Boston
      'ACC': 'ACC'  // Kotoka International Airport -> Accra
      ,
      // Important multi-airport cities
      'ARN': 'STO', // Stockholm Arlanda -> Stockholm (city)
      'BMA': 'STO', // Stockholm Bromma -> Stockholm
      'NRT': 'TYO', // Tokyo Narita -> Tokyo
      'HND': 'TYO', // Tokyo Haneda -> Tokyo
      'EZE': 'BUE', // Buenos Aires Ezeiza -> Buenos Aires
      'AEP': 'BUE', // Buenos Aires Aeroparque -> Buenos Aires
      'GRU': 'SAO', // Sao Paulo Guarulhos -> Sao Paulo
      'CGH': 'SAO', // Sao Paulo Congonhas -> Sao Paulo
      'GIG': 'RIO', // Rio de Janeiro GIG -> Rio
      'SDU': 'RIO'  // Rio de Janeiro SDU -> Rio
    };
    
    return airportToCityMap[airportCode] || airportCode;
  }

  /**
   * Parse Travel Payouts month matrix response
   */
  static parseMonthMatrixResponse(data: any, params: AviasalesSearchParams): AviasalesFlightOffer[] {
    if (!data || !data.data || !Array.isArray(data.data)) {
      return [];
    }

    const flights: AviasalesFlightOffer[] = [];
    
    // Prefer exact departure date matches; fall back to cheapest within month
    const targetDate = new Date(params.departure_date);
    const targetStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

    const items: any[] = data.data;
    const exactMatches = items.filter((i: any) => i?.depart_date === targetStr);

    const basisArray = exactMatches.length > 0 ? exactMatches : items;
    // Sort deterministically by price then date
    const sortedFlights = basisArray
      .slice()
      .sort((a: any, b: any) => (a.value - b.value) || (a.depart_date || '').localeCompare(b.depart_date || ''));
    const topFlights = sortedFlights.slice(0, 5); // Take top 5 cheapest flights
    
    topFlights.forEach((item: any, index: number) => {
      if (item && item.value) {
        flights.push({
          id: `travelpayouts-${index}`,
          price: {
            amount: item.value,
            currency: params.currency
          },
          origin: params.origin,
          destination: params.destination,
          departure_date: item.depart_date || params.departure_date,
          return_date: item.return_date || params.return_date,
          airline: item.gate || 'Multiple Airlines',
          flight_number: 'Various',
          duration: item.duration || 480, // Default 8 hours for transatlantic
          transfers: item.number_of_changes || 0,
          link: this.generateBookingUrl(params)
        });
      }
    });

    return flights;
  }

  /**
   * Get exact-date price (or a small range) and optionally enforce direct flights.
   * For round trips, sums both legs using exact dates where possible.
   */
  static async getExactOrRangePrice(
    params: AviasalesSearchParams & { directOnly?: boolean }
  ): Promise<{
    best: number;
    currency: string;
    isExact: boolean;
    min?: number;
    max?: number;
    basis: 'exact' | 'month';
  } | null> {
    if (!this.API_KEY) return null;

    const originCity = this.convertAirportToCity(params.origin);
    const destinationCity = this.convertAirportToCity(params.destination);

    const fetchLeg = async (origCity: string, destCity: string, dateISO: string) => {
      const d = new Date(dateISO);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const qs = new URLSearchParams({
        origin: origCity,
        destination: destCity,
        month: monthStr,
        currency: params.currency,
        token: this.API_KEY as string,
      });
      const url = `${this.BASE_URL}/v2/prices/month-matrix?${qs.toString()}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json?.data || !Array.isArray(json.data) || json.data.length === 0) return null;

      const target = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const directFilter = (i: any) => (params.directOnly ? (i?.number_of_changes ?? 0) === 0 : true);
      const exactItems = json.data.filter((i: any) => i?.depart_date === target && directFilter(i));
      const pool = exactItems.length > 0 ? exactItems : json.data.filter(directFilter);
      if (pool.length === 0) return null;
      const sorted = pool
        .slice()
        .sort((a: any, b: any) => (a.value - b.value) || (a.depart_date || '').localeCompare(b.depart_date || ''));
      const best = sorted[0].value as number;
      const isExact = exactItems.length > 0;
      const min = Math.min(...pool.map((x: any) => x.value as number));
      const max = Math.max(...pool.map((x: any) => x.value as number));
      return { best, isExact, min, max } as { best: number; isExact: boolean; min: number; max: number };
    };

    const out = await fetchLeg(originCity, destinationCity, params.departure_date);
    if (!out) return null;
    if (!params.return_date) {
      return {
        best: out.best,
        currency: params.currency,
        isExact: out.isExact,
        min: out.isExact ? undefined : out.min,
        max: out.isExact ? undefined : out.max,
        basis: out.isExact ? 'exact' : 'month',
      };
    }

    const back = await fetchLeg(destinationCity, originCity, params.return_date);
    if (!back) {
      return {
        best: out.best,
        currency: params.currency,
        isExact: out.isExact,
        min: out.isExact ? undefined : out.min,
        max: out.isExact ? undefined : out.max,
        basis: out.isExact ? 'exact' : 'month',
      };
    }

    const isExact = out.isExact && back.isExact;
    return {
      best: out.best + back.best,
      currency: params.currency,
      isExact,
      min: isExact ? undefined : (out.min + back.min),
      max: isExact ? undefined : (out.max + back.max),
      basis: isExact ? 'exact' : 'month',
    };
  }

  /**
   * Parse Aviasales API response
   */
  static parseAviasalesResponse(data: any, params: AviasalesSearchParams): AviasalesFlightOffer[] {
    if (!data || !data.data) {
      return [];
    }

    const flights: AviasalesFlightOffer[] = [];
    const responseData = Array.isArray(data.data) ? data.data : Object.values(data.data);

    responseData.forEach((item: any, index: number) => {
      if (item && (item.price || item.value)) {
        flights.push({
          id: `aviasales-${index}`,
          price: {
            amount: item.price || item.value,
            currency: params.currency
          },
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departure_date,
          return_date: params.return_date,
          airline: item.airline || 'Multiple Airlines',
          flight_number: item.flight_number || 'Various',
          duration: item.duration || 120,
          transfers: item.transfers || 0,
          link: this.generateBookingUrl(params)
        });
      }
    });

    return flights;
  }

  /**
   * Generate booking URL for Aviasales
   */
  static generateBookingUrl(params: AviasalesSearchParams): string {
    const formatDateForAviasales = (dateStr: string) => {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}${month}`;
    };

    const formattedDepartureDate = formatDateForAviasales(params.departure_date);
    let url = `https://www.aviasales.com/search/${params.origin}${formattedDepartureDate}${params.destination}`;
    
    if (params.return_date) {
      const formattedReturnDate = formatDateForAviasales(params.return_date);
      url += formattedReturnDate;
    } else {
      // For one-way flights, use same date format but add a week
      const returnDate = new Date(params.departure_date);
      returnDate.setDate(returnDate.getDate() + 7);
      const formattedReturnDate = formatDateForAviasales(returnDate.toISOString());
      url += formattedReturnDate;
    }
    
    url += '1?currency=' + (params.currency || 'GBP');
    return url;
  }

  /**
   * Generate mock Aviasales data for testing
   */
  static generateMockAviasalesData(params: AviasalesSearchParams): AviasalesFlightOffer[] {
    // Generate consistent prices based on route only (no random variation)
    const basePrice = this.calculateBasePrice(params.origin, params.destination);
    const mockFlights: AviasalesFlightOffer[] = [];

    // Generate deterministic flight options with fixed price variations
    const priceVariations = [1.0, 1.05, 1.12, 1.18, 1.25]; // Fixed variations: base, +5%, +12%, +18%, +25%
    const airlines = ['Air Europa', 'British Airways', 'Virgin Atlantic', 'JetBlue Airways', 'American Airlines'];
    const flightNumbers = ['UX', 'BA', 'VS', 'B6', 'AA'];
    
    for (let i = 0; i < 5; i++) {
      const price = Math.round(basePrice * priceVariations[i]);
      
      mockFlights.push({
        id: `mock-aviasales-${i}`,
        price: {
          amount: price,
          currency: params.currency
        },
        origin: params.origin,
        destination: params.destination,
        departure_date: params.departure_date,
        return_date: params.return_date,
        airline: airlines[i],
        flight_number: `${flightNumbers[i]}${1000 + i * 100}`,
        duration: 480 + (i * 30), // 8+ hours for transatlantic
        transfers: i > 2 ? 1 : 0, // First 3 are direct, last 2 have stops
        link: this.generateBookingUrl(params)
      });
    }

    return mockFlights.sort((a, b) => a.price.amount - b.price.amount);
  }

  /**
   * Calculate base price for route (simplified)
   */
  static calculateBasePrice(origin: string, destination: string): number {
    // Pricing based on real Aviasales market data
    const routes: { [key: string]: number } = {
      // European routes
      'LGW-MXP': 75,  // London to Milan
      'MXP-LGW': 75,
      'LHR-CDG': 85,
      'CDG-LHR': 85,
      'LGW-BCN': 95,
      'BCN-LGW': 95,
      'LHR-DUB': 65,
      'DUB-LHR': 65,
      
      // Transatlantic routes (based on your screenshot)
      'LHR-JFK': 434,  // London to New York - matches Aviasales
      'JFK-LHR': 434,
      'LGW-JFK': 434,
      'JFK-LGW': 434,
      'LHR-LAX': 450,
      'LAX-LHR': 450,
      'LHR-BOS': 420,
      'BOS-LHR': 420,
      
      // Other major routes
      'LHR-SYD': 800,
      'SYD-LHR': 800,
      'LHR-DXB': 350,
      'DXB-LHR': 350,
      
      // African routes
      'LHR-ACC': 450,  // London to Accra
      'ACC-LHR': 450,
      'JFK-ACC': 650,  // New York to Accra
      'ACC-JFK': 650
    };

    const routeKey = `${origin}-${destination}`;
    return routes[routeKey] || 200; // Default price for unknown routes
  }

  /**
   * Get cheapest price for a route
   */
  static async getCheapestPrice(params: AviasalesSearchParams): Promise<number | null> {
    const flights = await this.searchFlights(params);
    return flights.length > 0 ? Math.min(...flights.map(flight => flight.price.amount)) : null;
  }
}
