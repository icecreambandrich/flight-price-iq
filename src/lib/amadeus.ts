import Amadeus from 'amadeus';

// Initialize Amadeus client with fallback handling
let amadeus: any = null;
const hasCredentials = process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET;

if (hasCredentials) {
  amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID!,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
    hostname: (process.env.AMADEUS_HOSTNAME as 'test' | 'production') || 'test'
  });
}

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
    // If no Amadeus credentials, return mock data
    if (!hasCredentials || !amadeus) {
      console.log('No Amadeus credentials found, returning mock flight data');
      return this.generateMockFlightData(params);
    }

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
      
      // Fallback to mock data on API error
      console.log('Amadeus API failed, falling back to mock data');
      return this.generateMockFlightData(params);
    }
  }

  /**
   * Generate mock flight data when Amadeus API is not available
   */
  static generateMockFlightData(params: FlightSearchParams): FlightOffer[] {
    const basePrice = Math.floor(Math.random() * 400) + 200; // £200-600
    const airlines = ['BA', 'LH', 'AF', 'KL', 'VS', 'EK'];
    const aircraftTypes = ['320', '321', '737', '777', '787', '350'];
    
    const mockFlights: FlightOffer[] = [];
    const numFlights = params.nonStop ? 3 : 5;

    for (let i = 0; i < numFlights; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const aircraft = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
      const priceVariation = Math.floor(Math.random() * 200) - 100; // ±£100
      const totalPrice = Math.max(150, basePrice + priceVariation);
      const baseAmount = Math.floor(totalPrice * 0.85);
      const fees = totalPrice - baseAmount;

      // Generate departure time (6 AM to 10 PM)
      const depHour = Math.floor(Math.random() * 16) + 6;
      const depMinute = Math.floor(Math.random() * 60);
      const departureTime = `${params.departureDate}T${depHour.toString().padStart(2, '0')}:${depMinute.toString().padStart(2, '0')}:00`;
      
      // Flight duration (1-8 hours for direct, up to 12 for connecting)
      const durationHours = params.nonStop ? Math.floor(Math.random() * 7) + 1 : Math.floor(Math.random() * 11) + 1;
      const durationMinutes = Math.floor(Math.random() * 60);
      const duration = `PT${durationHours}H${durationMinutes}M`;

      // Calculate arrival time
      const depDate = new Date(departureTime);
      depDate.setHours(depDate.getHours() + durationHours);
      depDate.setMinutes(depDate.getMinutes() + durationMinutes);
      const arrivalTime = depDate.toISOString();

      const segments = [{
        departure: {
          iataCode: params.originLocationCode,
          at: departureTime
        },
        arrival: {
          iataCode: params.destinationLocationCode,
          at: arrivalTime
        },
        carrierCode: airline,
        number: `${airline}${Math.floor(Math.random() * 9000) + 1000}`,
        aircraft: {
          code: aircraft
        },
        duration: duration
      }];

      // Add connecting flight if not non-stop
      if (!params.nonStop && Math.random() > 0.6) {
        const connectingAirports = ['AMS', 'CDG', 'FRA', 'MUC', 'ZUR'];
        const hub = connectingAirports[Math.floor(Math.random() * connectingAirports.length)];
        
        // First segment to hub
        segments[0].arrival.iataCode = hub;
        const layoverMinutes = Math.floor(Math.random() * 120) + 60; // 1-3 hour layover
        const connectingDepTime = new Date(segments[0].arrival.at);
        connectingDepTime.setMinutes(connectingDepTime.getMinutes() + layoverMinutes);
        
        // Second segment from hub to destination
        const secondLegDuration = Math.floor(Math.random() * 4) + 1; // 1-4 hours
        const finalArrival = new Date(connectingDepTime);
        finalArrival.setHours(finalArrival.getHours() + secondLegDuration);
        
        segments.push({
          departure: {
            iataCode: hub,
            at: connectingDepTime.toISOString()
          },
          arrival: {
            iataCode: params.destinationLocationCode,
            at: finalArrival.toISOString()
          },
          carrierCode: airline,
          number: `${airline}${Math.floor(Math.random() * 9000) + 1000}`,
          aircraft: {
            code: aircraft
          },
          duration: `PT${secondLegDuration}H${Math.floor(Math.random() * 60)}M`
        });
      }

      mockFlights.push({
        id: `mock_${i + 1}_${Date.now()}`,
        price: {
          currency: 'GBP',
          total: totalPrice.toString(),
          base: baseAmount.toString(),
          fees: [{
            amount: fees.toString(),
            type: 'SUPPLIER'
          }]
        },
        itineraries: [{
          duration: duration,
          segments: segments
        }],
        travelerPricings: [{
          travelerId: '1',
          fareOption: 'STANDARD',
          travelerType: 'ADULT',
          price: {
            currency: 'GBP',
            total: totalPrice.toString(),
            base: baseAmount.toString()
          }
        }]
      });
    }

    // Sort by price
    return mockFlights.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));
  }

  /**
   * Search airports by keyword
   */
  static async searchAirports(keyword: string): Promise<Airport[]> {
    // If no Amadeus credentials, return empty array (airport selector will use built-in list)
    if (!hasCredentials || !amadeus) {
      console.log('No Amadeus credentials found, airport search unavailable');
      return [];
    }

    try {
      const response = await amadeus.referenceData.locations.get({
        keyword,
        subType: 'AIRPORT,CITY'
      });

      return response.data;
    } catch (error) {
      console.error('Error searching airports:', error);
      return []; // Return empty array instead of throwing error
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
