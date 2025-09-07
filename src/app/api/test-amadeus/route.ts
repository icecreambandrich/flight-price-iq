import { NextResponse } from 'next/server';
import { AmadeusService } from '@/lib/amadeus';

export async function GET() {
  try {
    console.log('Testing Amadeus API connection...');
    
    // Test with a simple flight search using a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
    const departureDateStr = futureDate.toISOString().split('T')[0];
    
    const testParams = {
      originLocationCode: 'LHR',
      destinationLocationCode: 'JFK',
      departureDate: departureDateStr,
      adults: 1,
      currencyCode: 'GBP',
      max: 5
    };

    const flightOffers = await AmadeusService.searchFlights(testParams);
    
    return NextResponse.json({
      success: true,
      message: 'Amadeus API connection successful!',
      testParams,
      resultCount: flightOffers.length,
      sampleOffer: flightOffers[0] || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Amadeus API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Amadeus API connection failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
