import { NextRequest, NextResponse } from 'next/server';

const TRAVELPAYOUTS_API_TOKEN = 'a9629a621c77266bc77dd1c30bc61b37';
const TRS = 457081;
const MARKER = 671136;

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  classOfService: string;
}

function buildWayAwayUrl(params: FlightSearchParams): string {
  const baseUrl = 'https://www.wayaway.io/flights';
  const searchParams = new URLSearchParams({
    origin_iata: params.origin,
    destination_iata: params.destination,
    departure_date: params.departureDate,
    adults: params.passengers.toString(),
    trip_class: params.classOfService.toLowerCase(),
  });

  if (params.returnDate) {
    searchParams.append('return_date', params.returnDate);
  }

  return `${baseUrl}?${searchParams.toString()}`;
}

export async function POST(request: NextRequest) {
  try {
    const flightParams: FlightSearchParams = await request.json();
    
    // Build the WayAway search URL
    const wayAwayUrl = buildWayAwayUrl(flightParams);
    
    // Create partner link via Travelpayouts API
    const travelpayoutsResponse = await fetch('https://api.travelpayouts.com/links/v1/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${TRAVELPAYOUTS_API_TOKEN}`,
      },
      body: JSON.stringify({
        trs: TRS,
        marker: MARKER,
        shorten: false, // Long links as requested
        links: [
          {
            url: wayAwayUrl,
            sub_id: `flight_search_${Date.now()}`, // Easy tracking with timestamp
          },
        ],
      }),
    });

    if (!travelpayoutsResponse.ok) {
      throw new Error(`Travelpayouts API error: ${travelpayoutsResponse.status}`);
    }

    const result = await travelpayoutsResponse.json();
    
    if (result.code === 'success' && result.result.links[0].code === 'success') {
      return NextResponse.json({
        success: true,
        partnerUrl: result.result.links[0].partner_url,
        originalUrl: wayAwayUrl,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.result.links[0].message || 'Failed to create partner link',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Flight search API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
