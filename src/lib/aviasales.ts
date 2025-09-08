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
  private static readonly BASE_URL = 'https://api.travelpayouts.com/v1';

  /**
   * Search for flights using Aviasales API
   */
  static async searchFlights(params: AviasalesSearchParams): Promise<AviasalesFlightOffer[]> {
    if (!this.API_KEY) {
      console.log('No Travel Payouts API key found, using mock Aviasales data');
      return this.generateMockAviasalesData(params);
    }

    try {
      // Use the prices/cheap endpoint for basic price data
      const searchParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        depart_date: params.departure_date,
        currency: params.currency,
        token: this.API_KEY
      });

      if (params.return_date) {
        searchParams.append('return_date', params.return_date);
      }

      const response = await fetch(`${this.BASE_URL}/prices/cheap?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Aviasales API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAviasalesResponse(data, params);
    } catch (error) {
      console.error('Aviasales API error:', error);
      return this.generateMockAviasalesData(params);
    }
  }

  /**
   * Get calendar prices for a route (30 days)
   */
  static async getCalendarPrices(params: AviasalesSearchParams): Promise<any> {
    if (!this.API_KEY) {
      return null;
    }

    try {
      const searchParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        depart_date: params.departure_date,
        currency: params.currency,
        token: this.API_KEY
      });

      if (params.return_date) {
        searchParams.append('return_date', params.return_date);
      }

      const response = await fetch(`${this.BASE_URL}/prices/calendar?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Aviasales calendar API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Aviasales calendar API error:', error);
      return null;
    }
  }

  /**
   * Parse Aviasales API response into our format
   */
  private static parseAviasalesResponse(data: any, params: AviasalesSearchParams): AviasalesFlightOffer[] {
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.slice(0, 5).map((flight: any, index: number) => ({
      id: `aviasales_${index}_${Date.now()}`,
      price: {
        amount: flight.price || flight.value || 0,
        currency: params.currency
      },
      origin: params.origin,
      destination: params.destination,
      departure_date: params.departure_date,
      return_date: params.return_date,
      airline: flight.airline || 'Unknown',
      flight_number: flight.flight_number || `${flight.airline}${Math.floor(Math.random() * 9000) + 1000}`,
      duration: flight.duration || Math.floor(Math.random() * 480) + 60,
      transfers: flight.transfers || 0,
      link: flight.link || this.generateAviasalesBookingUrl(params)
    }));
  }

  /**
   * Generate Aviasales booking URL
   */
  private static generateAviasalesBookingUrl(params: AviasalesSearchParams): string {
    const formatDateForAviasales = (dateStr: string) => {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}${month}`;
    };

    const formattedDepartureDate = formatDateForAviasales(params.departure_date);
    const formattedReturnDate = params.return_date ? formatDateForAviasales(params.return_date) : formattedDepartureDate;

    return `https://www.aviasales.com/search/${params.origin}${formattedDepartureDate}${params.destination}${formattedReturnDate}1?currency=${params.currency}`;
  }

  /**
   * Generate mock Aviasales-style data when API is not available
   */
  private static generateMockAviasalesData(params: AviasalesSearchParams): AviasalesFlightOffer[] {
    const basePrice = Math.floor(Math.random() * 400) + 200;
    const airlines = [
      { code: 'BA', name: 'British Airways' },
      { code: 'LH', name: 'Lufthansa' },
      { code: 'AF', name: 'Air France' },
      { code: 'KL', name: 'KLM' },
      { code: 'VS', name: 'Virgin Atlantic' },
      { code: 'EK', name: 'Emirates' }
    ];

    const mockFlights: AviasalesFlightOffer[] = [];

    for (let i = 0; i < 5; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const priceVariation = Math.floor(Math.random() * 200) - 100;
      const totalPrice = Math.max(150, basePrice + priceVariation);

      mockFlights.push({
        id: `mock_aviasales_${i + 1}`,
        price: {
          amount: totalPrice,
          currency: params.currency
        },
        origin: params.origin,
        destination: params.destination,
        departure_date: params.departure_date,
        return_date: params.return_date,
        airline: airline.code,
        flight_number: `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`,
        duration: Math.floor(Math.random() * 480) + 60, // 1-8 hours
        transfers: Math.random() > 0.7 ? 1 : 0, // 30% chance of 1 stop
        link: this.generateAviasalesBookingUrl(params)
      });
    }

    return mockFlights.sort((a, b) => a.price.amount - b.price.amount);
  }

  /**
   * Get cheapest price for a route
   */
  static async getCheapestPrice(params: AviasalesSearchParams): Promise<number> {
    const flights = await this.searchFlights(params);
    return flights.length > 0 ? flights[0].price.amount : 400;
  }
}
