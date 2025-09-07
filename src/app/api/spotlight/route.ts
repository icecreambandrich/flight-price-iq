import { NextResponse } from 'next/server';
import { PricePredictionService } from '@/lib/prediction';

export async function GET() {
  try {
    const spotlightRoutes = PricePredictionService.getSpotlightRoutes();
    
    return NextResponse.json({
      success: true,
      routes: spotlightRoutes,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Spotlight routes API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spotlight routes' },
      { status: 500 }
    );
  }
}
