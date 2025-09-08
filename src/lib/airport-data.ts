import { AmadeusService, Airport } from './amadeus';

// Popular airports to show by default
export const POPULAR_AIRPORTS: Airport[] = [
  // UK Airports
  { iataCode: 'LHR', name: 'London Heathrow', address: { cityName: 'London', countryName: 'United Kingdom' } },
  { iataCode: 'LGW', name: 'London Gatwick', address: { cityName: 'London', countryName: 'United Kingdom' } },
  { iataCode: 'STN', name: 'London Stansted', address: { cityName: 'London', countryName: 'United Kingdom' } },
  { iataCode: 'LTN', name: 'London Luton', address: { cityName: 'London', countryName: 'United Kingdom' } },
  { iataCode: 'MAN', name: 'Manchester', address: { cityName: 'Manchester', countryName: 'United Kingdom' } },
  { iataCode: 'EDI', name: 'Edinburgh', address: { cityName: 'Edinburgh', countryName: 'United Kingdom' } },
  { iataCode: 'GLA', name: 'Glasgow', address: { cityName: 'Glasgow', countryName: 'United Kingdom' } },
  { iataCode: 'BHX', name: 'Birmingham', address: { cityName: 'Birmingham', countryName: 'United Kingdom' } },

  // European Airports
  { iataCode: 'CDG', name: 'Paris Charles de Gaulle', address: { cityName: 'Paris', countryName: 'France' } },
  { iataCode: 'AMS', name: 'Amsterdam Schiphol', address: { cityName: 'Amsterdam', countryName: 'Netherlands' } },
  { iataCode: 'FRA', name: 'Frankfurt', address: { cityName: 'Frankfurt', countryName: 'Germany' } },
  { iataCode: 'MUC', name: 'Munich', address: { cityName: 'Munich', countryName: 'Germany' } },
  { iataCode: 'BCN', name: 'Barcelona', address: { cityName: 'Barcelona', countryName: 'Spain' } },
  { iataCode: 'MAD', name: 'Madrid', address: { cityName: 'Madrid', countryName: 'Spain' } },
  { iataCode: 'FCO', name: 'Rome Fiumicino', address: { cityName: 'Rome', countryName: 'Italy' } },
  { iataCode: 'MXP', name: 'Milan Malpensa', address: { cityName: 'Milan', countryName: 'Italy' } },
  { iataCode: 'ZUR', name: 'Zurich', address: { cityName: 'Zurich', countryName: 'Switzerland' } },
  { iataCode: 'VIE', name: 'Vienna', address: { cityName: 'Vienna', countryName: 'Austria' } },
  { iataCode: 'CPH', name: 'Copenhagen', address: { cityName: 'Copenhagen', countryName: 'Denmark' } },
  { iataCode: 'ARN', name: 'Stockholm Arlanda', address: { cityName: 'Stockholm', countryName: 'Sweden' } },
  { iataCode: 'OSL', name: 'Oslo', address: { cityName: 'Oslo', countryName: 'Norway' } },
  { iataCode: 'HEL', name: 'Helsinki', address: { cityName: 'Helsinki', countryName: 'Finland' } },

  // North American Airports
  { iataCode: 'JFK', name: 'New York JFK', address: { cityName: 'New York', countryName: 'United States' } },
  { iataCode: 'LGA', name: 'New York LaGuardia', address: { cityName: 'New York', countryName: 'United States' } },
  { iataCode: 'EWR', name: 'Newark', address: { cityName: 'Newark', countryName: 'United States' } },
  { iataCode: 'LAX', name: 'Los Angeles', address: { cityName: 'Los Angeles', countryName: 'United States' } },
  { iataCode: 'SFO', name: 'San Francisco', address: { cityName: 'San Francisco', countryName: 'United States' } },
  { iataCode: 'ORD', name: 'Chicago O\'Hare', address: { cityName: 'Chicago', countryName: 'United States' } },
  { iataCode: 'MIA', name: 'Miami', address: { cityName: 'Miami', countryName: 'United States' } },
  { iataCode: 'DFW', name: 'Dallas/Fort Worth', address: { cityName: 'Dallas', countryName: 'United States' } },
  { iataCode: 'ATL', name: 'Atlanta', address: { cityName: 'Atlanta', countryName: 'United States' } },
  { iataCode: 'BOS', name: 'Boston', address: { cityName: 'Boston', countryName: 'United States' } },
  { iataCode: 'YYZ', name: 'Toronto Pearson', address: { cityName: 'Toronto', countryName: 'Canada' } },
  { iataCode: 'YVR', name: 'Vancouver', address: { cityName: 'Vancouver', countryName: 'Canada' } },

  // Asian Airports
  { iataCode: 'NRT', name: 'Tokyo Narita', address: { cityName: 'Tokyo', countryName: 'Japan' } },
  { iataCode: 'HND', name: 'Tokyo Haneda', address: { cityName: 'Tokyo', countryName: 'Japan' } },
  { iataCode: 'ICN', name: 'Seoul Incheon', address: { cityName: 'Seoul', countryName: 'South Korea' } },
  { iataCode: 'PEK', name: 'Beijing Capital', address: { cityName: 'Beijing', countryName: 'China' } },
  { iataCode: 'PVG', name: 'Shanghai Pudong', address: { cityName: 'Shanghai', countryName: 'China' } },
  { iataCode: 'HKG', name: 'Hong Kong', address: { cityName: 'Hong Kong', countryName: 'Hong Kong' } },
  { iataCode: 'SIN', name: 'Singapore Changi', address: { cityName: 'Singapore', countryName: 'Singapore' } },
  { iataCode: 'BKK', name: 'Bangkok Suvarnabhumi', address: { cityName: 'Bangkok', countryName: 'Thailand' } },
  { iataCode: 'KUL', name: 'Kuala Lumpur', address: { cityName: 'Kuala Lumpur', countryName: 'Malaysia' } },
  { iataCode: 'CGK', name: 'Jakarta', address: { cityName: 'Jakarta', countryName: 'Indonesia' } },
  { iataCode: 'MNL', name: 'Manila', address: { cityName: 'Manila', countryName: 'Philippines' } },
  { iataCode: 'DEL', name: 'New Delhi', address: { cityName: 'New Delhi', countryName: 'India' } },
  { iataCode: 'BOM', name: 'Mumbai', address: { cityName: 'Mumbai', countryName: 'India' } },

  // Middle East & Africa
  { iataCode: 'DXB', name: 'Dubai', address: { cityName: 'Dubai', countryName: 'United Arab Emirates' } },
  { iataCode: 'DOH', name: 'Doha', address: { cityName: 'Doha', countryName: 'Qatar' } },
  { iataCode: 'AUH', name: 'Abu Dhabi', address: { cityName: 'Abu Dhabi', countryName: 'United Arab Emirates' } },
  { iataCode: 'CAI', name: 'Cairo', address: { cityName: 'Cairo', countryName: 'Egypt' } },
  { iataCode: 'ACC', name: 'Kotoka International Airport', address: { cityName: 'Accra', countryName: 'Ghana' } },
  { iataCode: 'JNB', name: 'Johannesburg', address: { cityName: 'Johannesburg', countryName: 'South Africa' } },
  { iataCode: 'CPT', name: 'Cape Town', address: { cityName: 'Cape Town', countryName: 'South Africa' } },

  // Oceania
  { iataCode: 'SYD', name: 'Sydney', address: { cityName: 'Sydney', countryName: 'Australia' } },
  { iataCode: 'MEL', name: 'Melbourne', address: { cityName: 'Melbourne', countryName: 'Australia' } },
  { iataCode: 'BNE', name: 'Brisbane', address: { cityName: 'Brisbane', countryName: 'Australia' } },
  { iataCode: 'PER', name: 'Perth', address: { cityName: 'Perth', countryName: 'Australia' } },
  { iataCode: 'AKL', name: 'Auckland', address: { cityName: 'Auckland', countryName: 'New Zealand' } },

  // South America
  { iataCode: 'GRU', name: 'São Paulo', address: { cityName: 'São Paulo', countryName: 'Brazil' } },
  { iataCode: 'GIG', name: 'Rio de Janeiro', address: { cityName: 'Rio de Janeiro', countryName: 'Brazil' } },
  { iataCode: 'EZE', name: 'Buenos Aires', address: { cityName: 'Buenos Aires', countryName: 'Argentina' } },
  { iataCode: 'SCL', name: 'Santiago', address: { cityName: 'Santiago', countryName: 'Chile' } },
  { iataCode: 'LIM', name: 'Lima', address: { cityName: 'Lima', countryName: 'Peru' } }
];

export class AirportService {
  private static airportCache: Map<string, Airport[]> = new Map();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static cacheTimestamp: Map<string, number> = new Map();

  /**
   * Get all popular airports for dropdown
   */
  static getPopularAirports(): Airport[] {
    return POPULAR_AIRPORTS;
  }

  /**
   * Search airports with caching
   */
  static async searchAirports(keyword: string): Promise<Airport[]> {
    if (!keyword || keyword.length < 2) {
      return this.getPopularAirports();
    }

    const cacheKey = keyword.toLowerCase();
    const now = Date.now();
    
    // Check cache
    if (this.airportCache.has(cacheKey) && 
        this.cacheTimestamp.has(cacheKey) &&
        (now - this.cacheTimestamp.get(cacheKey)!) < this.CACHE_DURATION) {
      return this.airportCache.get(cacheKey)!;
    }

    try {
      // Search using Amadeus API
      const results = await AmadeusService.searchAirports(keyword);
      
      // Cache results
      this.airportCache.set(cacheKey, results);
      this.cacheTimestamp.set(cacheKey, now);
      
      return results;
    } catch (error) {
      console.error('Airport search failed, falling back to popular airports:', error);
      
      // Fallback: filter popular airports by keyword
      return this.getPopularAirports().filter(airport => 
        airport.name.toLowerCase().includes(keyword.toLowerCase()) ||
        airport.iataCode.toLowerCase().includes(keyword.toLowerCase()) ||
        airport.address?.cityName?.toLowerCase().includes(keyword.toLowerCase())
      );
    }
  }

  /**
   * Get airport by IATA code
   */
  static getAirportByCode(iataCode: string): Airport | undefined {
    return POPULAR_AIRPORTS.find(airport => 
      airport.iataCode.toUpperCase() === iataCode.toUpperCase()
    );
  }

  /**
   * Format airport display name
   */
  static formatAirportName(airport: Airport): string {
    const city = airport.address?.cityName || '';
    const country = airport.address?.countryName || '';
    
    if (city && country) {
      return `${airport.name} (${airport.iataCode}) - ${city}, ${country}`;
    } else if (city) {
      return `${airport.name} (${airport.iataCode}) - ${city}`;
    } else {
      return `${airport.name} (${airport.iataCode})`;
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    this.airportCache.clear();
    this.cacheTimestamp.clear();
  }
}
