import Amadeus from 'amadeus';

// Initialize Amadeus client
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID!,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
  hostname: (process.env.AMADEUS_HOSTNAME as 'test' | 'production') || 'test' // Use 'test' for testing, 'production' for live
});

export interface FlightOffer {
  id: string;
  price: {
    currency: string;
    total: string;
    base: string;
    fees: Array<{
      amount: string;
      type: string;
    }>;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft: {
        code: string;
      };
      duration: string;
    }>;
  }>;
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
      base: string;
    };
  }>;
}

export interface FlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  currencyCode?: string;
  max?: number;
  nonStop?: boolean;
}

export interface Airport {
  iataCode: string;
  name: string;
  address: {
    cityName: string;
    countryName: string;
  };
}

export class AmadeusService {
  /**
   * Search for flight offers
   */
  static async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    try {
      console.log('Searching flights with params:', params);
      
      const searchParams: any = {
        originLocationCode: params.originLocationCode,
        destinationLocationCode: params.destinationLocationCode,
        departureDate: params.departureDate,
        adults: params.adults,
        currencyCode: params.currencyCode || 'GBP',
        max: params.max || 10
      };

      // Add optional parameters only if they exist
      if (params.returnDate) {
        searchParams.returnDate = params.returnDate;
      }
      if (params.children && params.children > 0) {
        searchParams.children = params.children;
      }
      if (params.infants && params.infants > 0) {
        searchParams.infants = params.infants;
      }
      if (params.travelClass) {
        searchParams.travelClass = params.travelClass;
      }
      if (params.nonStop) {
        searchParams.nonStop = params.nonStop;
      }

      console.log('Final search params:', searchParams);

      const response = await amadeus.shopping.flightOffersSearch.get(searchParams);
      
      console.log('Amadeus response received:', {
        dataLength: response.data?.length || 0,
        hasData: !!response.data
      });

      return response.data || [];
    } catch (error: any) {
      console.error('Amadeus API Error Details:', {
        message: error.message,
        code: error.code,
        description: error.description,
        response: error.response?.data
      });
      
      // Re-throw with more specific error message
      throw new Error(`Amadeus API Error: ${error.description || error.message || 'Unknown error'}`);
    }
  }

  /**
   * Search airports by keyword
   */
  static async searchAirports(keyword: string): Promise<Airport[]> {
    try {
      const response = await amadeus.referenceData.locations.get({
        keyword,
        subType: 'AIRPORT,CITY'
      });

      return response.data;
    } catch (error) {
      console.error('Error searching airports:', error);
      throw new Error('Failed to search airports');
    }
  }

  /**
   * Get flight price analysis for a specific route
   */
  static async getFlightPriceAnalysis(
    origin: string,
    destination: string,
    departureDate: string,
    returnDate?: string
  ) {
    try {
      const response = await amadeus.analytics.itineraryPriceMetrics.get({
        originIataCode: origin,
        destinationIataCode: destination,
        departureDate,
        returnDate,
        currencyCode: 'GBP'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting price analysis:', error);
      throw new Error('Failed to get price analysis');
    }
  }

  /**
   * Convert price from any currency to GBP
   */
  static async convertToGBP(amount: number, fromCurrency: string): Promise<number> {
    if (fromCurrency === 'GBP') return amount;
    
    try {
      // Use a currency conversion API or service
      // For now, we'll use approximate rates (in production, use a real service)
      const conversionRates: { [key: string]: number } = {
        'USD': 0.79,
        'EUR': 0.86,
        'CAD': 0.58,
        'AUD': 0.52,
        'JPY': 0.0053,
        'CHF': 0.88,
        'SEK': 0.074,
        'NOK': 0.073,
        'DKK': 0.115
      };

      const rate = conversionRates[fromCurrency] || 1;
      return Math.round(amount * rate * 100) / 100;
    } catch (error) {
      console.error('Error converting currency:', error);
      return amount; // Return original amount if conversion fails
    }
  }
}

export default amadeus;
