import { NextRequest, NextResponse } from 'next/server';
import { AirportService } from '@/lib/airport-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');

    if (!keyword) {
      // Return popular airports if no search keyword
      const popularAirports = AirportService.getPopularAirports();
      return NextResponse.json({
        success: true,
        airports: popularAirports,
        count: popularAirports.length,
        source: 'popular'
      });
    }

    // Search airports using keyword
    const airports = await AirportService.searchAirports(keyword);
    
    return NextResponse.json({
      success: true,
      airports,
      count: airports.length,
      keyword,
      source: airports.length > 0 ? 'amadeus' : 'fallback'
    });

  } catch (error) {
    console.error('Airports API error:', error);
    
    // Fallback to popular airports on error
    const popularAirports = AirportService.getPopularAirports();
    return NextResponse.json({
      success: true,
      airports: popularAirports,
      count: popularAirports.length,
      source: 'fallback',
      error: 'Search failed, showing popular airports'
    });
  }
}
