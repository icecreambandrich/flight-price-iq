# Flight Price Forecast

A Next.js web application that helps travelers decide the best time to book flights using AI-powered price predictions and real-time data from the Amadeus API.

## Features

- **Real-time Flight Data**: Live pricing updated daily
- **7-Day Price Forecast**: AI-powered predictions with confidence ratings
- **Smart Recommendations**: Clear "Buy Now" or "Wait" guidance based on probability analysis
- **Spotlight Routes**: Featured popular routes (London-Malaysia, London-NYC, London-Denmark)
- **Historical Context**: Price positioning within seasonal ranges
- **Confidence Meter**: 0-100% reliability indicator for each prediction
- **Global Coverage**: Worldwide airport-to-airport search capability

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **API Integration**: Amadeus Travel API
- **Deployment**: Vercel
- **Styling**: Tailwind CSS with custom components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Amadeus API credentials (for production)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd flight-price-forecast
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Add your Amadeus API credentials to `.env.local`:
```
AMADEUS_CLIENT_ID=your_client_id_here
AMADEUS_CLIENT_SECRET=your_client_secret_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

- `POST /api/search` - Flight price search and prediction
- `GET /api/spotlight` - Spotlight routes data

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/       # React components
│   ├── FlightSearchForm.tsx
│   ├── PricePredictionCard.tsx
│   └── SpotlightRoutes.tsx
└── lib/             # Utilities and services
    ├── amadeus.ts   # Amadeus API integration
    └── prediction.ts # Price prediction logic
```

## Key Components

### FlightSearchForm
- Airport selection with popular destinations
- Date picker with validation
- Trip type selection (round-trip/one-way)
- Passenger count selection

### PricePredictionCard
- Current price display with timestamp
- Buy/Wait recommendation with reasoning
- Probability indicators for price changes
- Confidence meter (0-100%)
- Historical price range context
- Market positioning visualization

### SpotlightRoutes
- Featured popular routes
- Live price updates
- Quick recommendation overview
- Confidence ratings

## Price Prediction Algorithm

The prediction system analyzes:
- Historical seasonal patterns
- Current price position within typical range
- Booking advance window effects
- Market volatility indicators
- Day-of-week pricing patterns

Recommendations:
- **Buy Now**: ≥80% probability of price increase
- **Wait**: <80% probability of price increase

## Environment Variables

```
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

## Development

### Adding New Routes

1. Add route data to `src/lib/prediction.ts`
2. Update historical data patterns
3. Test predictions with new route

### Customizing Predictions

Modify the prediction algorithm in `src/lib/prediction.ts`:
- Adjust seasonal multipliers
- Update probability calculations
- Change confidence thresholds

## API Integration

### Amadeus Setup

1. Register at [Amadeus for Developers](https://developers.amadeus.com/)
2. Create a new application
3. Get your API credentials
4. Add to environment variables

### Mock Data

For development without API credentials, the app uses mock data that simulates realistic flight prices and patterns.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API integration guide
