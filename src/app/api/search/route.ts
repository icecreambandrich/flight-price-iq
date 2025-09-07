import { NextRequest, NextResponse } from 'next/server';
import { AmadeusService } from '@/lib/amadeus';
import { PricePredictionService } from '@/lib/prediction';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, departureDate, returnDate, passengers } = body;

    // Validate required fields
    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required fields: origin, destination, departureDate' },
        { status: 400 }
      );
    }

    // Search flights using Amadeus API
    const searchParams = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate,
      adults: passengers || 1,
      currencyCode: 'GBP',
      max: 10
    };

    try {
      // Get real flight data from Amadeus
      const flightOffers = await AmadeusService.searchFlights(searchParams);
      
      // Get the cheapest price
      const currentPrice = flightOffers.length > 0 
        ? parseFloat(flightOffers[0].price.total)
        : Math.floor(Math.random() * 400) + 200; // Fallback to mock if no results

      // Generate prediction based on real price
      const prediction = PricePredictionService.generatePrediction(
        currentPrice,
        origin,
        destination,
        departureDate
      );

      return NextResponse.json({
        success: true,
        prediction,
        flightOffers: flightOffers.slice(0, 3), // Return top 3 offers
        searchParams
      });

    } catch (amadeusError) {
      console.error('Amadeus API error:', amadeusError);
      
      // Fallback to mock data if Amadeus fails
      const mockPrice = Math.floor(Math.random() * 400) + 200;
      const prediction = PricePredictionService.generatePrediction(
        mockPrice,
        origin,
        destination,
        departureDate
      );

      return NextResponse.json({
        success: true,
        prediction,
        fallbackMode: true,
        searchParams,
        error: 'Using mock data - Amadeus API unavailable'
      });
    }

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Flight search API endpoint',
    methods: ['POST'],
    requiredFields: ['origin', 'destination', 'departureDate']
  });
}
