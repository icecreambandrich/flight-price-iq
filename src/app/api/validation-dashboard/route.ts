import { NextRequest, NextResponse } from 'next/server';
import { StatisticalValidator } from '@/lib/statistical-validator';
import { HistoricalDataManager } from '@/lib/historical-data-manager';
import { ABTestingFramework } from '@/lib/ab-testing';

export async function GET() {
  try {
    // Get comprehensive validation summary
    const validationSummary = StatisticalValidator.getValidationSummary();
    const backtestResults = HistoricalDataManager.loadBacktestResults();
    const abTestMetrics = ABTestingFramework.calculateTestMetrics();
    const winningVariant = ABTestingFramework.getWinningVariant();

    return NextResponse.json({
      success: true,
      dashboard: {
        // Statistical Validation Metrics
        validation: validationSummary.validation,
        
        // Backtesting Results Summary
        backtesting: {
          totalTests: backtestResults?.length || 0,
          averageError: backtestResults?.length ? 
            backtestResults.reduce((sum, r) => sum + r.error, 0) / backtestResults.length : 0,
          accuracyByRoute: calculateAccuracyByRoute(backtestResults || []),
          recentResults: backtestResults?.slice(-10) || []
        },

        // A/B Testing Results
        abTesting: {
          variants: ABTestingFramework.getVariants(),
          metrics: abTestMetrics,
          winningVariant: winningVariant.winner,
          isSignificant: winningVariant.significant,
          totalTests: abTestMetrics.reduce((sum, m) => sum + m.totalRecommendations, 0)
        },

        // Data Quality Metrics
        dataQuality: {
          lastValidation: validationSummary.lastValidation,
          needsRefresh: validationSummary.needsRefresh,
          historicalDataPoints: getHistoricalDataCount(),
          realDataPercentage: getRealDataPercentage()
        },

        // System Status
        systemStatus: {
          validationActive: !!validationSummary.validation,
          abTestingActive: abTestMetrics.length > 0,
          dataCollectionActive: true,
          lastUpdate: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Validation dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to load validation dashboard' },
      { status: 500 }
    );
  }
}

// Helper method to calculate accuracy by route
function calculateAccuracyByRoute(backtestResults: any[]) {
  const routeGroups = backtestResults.reduce((groups, result) => {
    if (!groups[result.route]) {
      groups[result.route] = [];
    }
    groups[result.route].push(result);
    return groups;
  }, {} as { [route: string]: any[] });

  const routeAccuracy: { [route: string]: number } = {};
  
  for (const [route, results] of Object.entries(routeGroups)) {
    const correctPredictions = results.filter((r: any) => r.actualOutcome === 'CORRECT').length;
    routeAccuracy[route] = (results as any[]).length > 0 ? 
      Math.round((correctPredictions / (results as any[]).length) * 10000) / 100 : 0;
  }

  return routeAccuracy;
}

// Helper method to get historical data count
function getHistoricalDataCount(): number {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('flight_historical_data');
    return data ? JSON.parse(data).length : 0;
  }
  return 0;
}

// Helper method to get real data percentage
function getRealDataPercentage(): number {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('flight_historical_data');
    if (data) {
      const historicalData = JSON.parse(data);
      const realDataCount = historicalData.filter((d: any) => d.source === 'amadeus').length;
      return historicalData.length > 0 ? 
        Math.round((realDataCount / historicalData.length) * 10000) / 100 : 0;
    }
  }
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'refresh_validation':
        await StatisticalValidator.performFullValidation();
        return NextResponse.json({ success: true, message: 'Validation refreshed' });

      case 'initialize_validation':
        await StatisticalValidator.initializeValidation();
        return NextResponse.json({ success: true, message: 'Validation initialized' });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Validation dashboard POST error:', error);
    return NextResponse.json(
      { error: 'Action failed' },
      { status: 500 }
    );
  }
}
