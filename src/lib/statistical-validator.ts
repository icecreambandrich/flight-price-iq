import { HistoricalDataManager, ValidationResult, BacktestResult } from './historical-data-manager';
import { ABTestingFramework } from './ab-testing';

export interface StatisticalConfidenceMetrics {
  trueConfidence: number; // Statistically validated confidence
  sampleSize: number;
  validationPeriod: string;
  meanAbsoluteError: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
  dataQuality: {
    realDataPercentage: number;
    temporalCoverage: number; // How many months of data
    routeCoverage: number; // How many routes covered
  };
  lastValidation: string;
}

export interface EnhancedPredictionWithValidation {
  // Original prediction fields
  currentPrice: number;
  currency: string;
  timestamp: string;
  probabilityIncrease: number;
  probabilityDecrease: number;
  recommendation: 'BUY_NOW' | 'WAIT';
  historicalContext: string;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  
  // Enhanced statistical validation
  statisticalConfidence: StatisticalConfidenceMetrics;
  validatedConfidence: number; // The actual statistically validated confidence
  errorBounds: {
    expectedError: number;
    maxError: number;
    minError: number;
  };
  
  // A/B test variant info
  abTestVariant?: string;
  abTestMetrics?: {
    variantSuccessRate: number;
    totalTests: number;
  };
}

export class StatisticalValidator {
  private static validationCache: ValidationResult | null = null;
  private static lastValidationTime: Date | null = null;
  private static readonly VALIDATION_CACHE_HOURS = 24;

  /**
   * Initialize statistical validation system
   */
  static async initializeValidation(): Promise<void> {
    console.log('Initializing statistical validation system...');
    
    // Check if we need to refresh validation
    if (this.needsValidationRefresh()) {
      await this.performFullValidation();
    } else {
      console.log('Using cached validation results');
    }
  }

  /**
   * Perform complete statistical validation
   */
  static async performFullValidation(): Promise<ValidationResult> {
    console.log('Performing full statistical validation...');
    
    // Step 1: Collect real historical data (6+ months)
    const routes = ['LHR-JFK', 'LHR-KUL', 'LHR-CPH', 'LHR-DXB', 'LHR-SYD'];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // 6 months back
    
    console.log('Collecting historical data...');
    const historicalData = await HistoricalDataManager.collectRealHistoricalData(
      routes,
      startDate,
      endDate
    );
    
    // Step 2: Perform backtesting
    console.log('Performing backtesting...');
    const backtestResults = await HistoricalDataManager.performBacktesting(
      historicalData,
      90 // Test last 90 days
    );
    
    // Step 3: Calculate validation metrics
    console.log('Calculating validation metrics...');
    const validationResult = HistoricalDataManager.calculateValidationMetrics(backtestResults);
    
    // Cache results
    this.validationCache = validationResult;
    this.lastValidationTime = new Date();
    
    console.log(`Validation complete. True accuracy: ${validationResult.accuracy}%`);
    return validationResult;
  }

  /**
   * Get statistically validated prediction with true confidence
   */
  static async getValidatedPrediction(
    currentPrice: number,
    origin: string,
    destination: string,
    departureDate: string,
    userId: string = 'anonymous'
  ): Promise<EnhancedPredictionWithValidation> {
    
    // Ensure validation is initialized
    if (!this.validationCache) {
      await this.initializeValidation();
    }

    // Get A/B test variant for user
    const abVariant = ABTestingFramework.assignUserToVariant(userId);
    
    // Calculate base prediction (using existing enhanced prediction logic)
    const basePrediction = await this.calculateBasePrediction(
      currentPrice, origin, destination, departureDate
    );
    
    // Apply A/B test variant
    const variantPrediction = ABTestingFramework.applyVariantToPrediction(
      basePrediction,
      abVariant
    );

    // Calculate statistical confidence metrics
    const statisticalMetrics = this.calculateStatisticalMetrics();
    
    // Calculate error bounds based on validation
    const errorBounds = this.calculateErrorBounds(currentPrice);
    
    // Get A/B test metrics for this variant
    const abMetrics = ABTestingFramework.calculateTestMetrics()
      .find(m => m.variantId === abVariant.id);

    const validatedPrediction: EnhancedPredictionWithValidation = {
      ...variantPrediction,
      statisticalConfidence: statisticalMetrics,
      validatedConfidence: statisticalMetrics.trueConfidence,
      errorBounds,
      abTestVariant: abVariant.id,
      abTestMetrics: abMetrics ? {
        variantSuccessRate: abMetrics.successRate,
        totalTests: abMetrics.totalRecommendations
      } : undefined
    };

    return validatedPrediction;
  }

  /**
   * Calculate statistical confidence metrics
   */
  private static calculateStatisticalMetrics(): StatisticalConfidenceMetrics {
    const validation = this.validationCache;
    if (!validation) {
      return this.getDefaultMetrics();
    }

    // Calculate data quality metrics
    const historicalData = HistoricalDataManager.loadBacktestResults() || [];
    const realDataCount = historicalData.filter(d => (d as any).source === 'amadeus').length;
    const realDataPercentage = historicalData.length > 0 ? 
      (realDataCount / historicalData.length) * 100 : 0;

    // Calculate temporal coverage (months of data)
    const dateRange = validation.validationPeriod;
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());

    return {
      trueConfidence: validation.accuracy,
      sampleSize: validation.sampleSize,
      validationPeriod: `${dateRange.start} to ${dateRange.end}`,
      meanAbsoluteError: validation.meanAbsoluteError,
      confidenceInterval: validation.confidenceInterval,
      dataQuality: {
        realDataPercentage: Math.round(realDataPercentage * 100) / 100,
        temporalCoverage: monthsDiff,
        routeCoverage: 5 // We're testing 5 routes
      },
      lastValidation: this.lastValidationTime?.toISOString() || new Date().toISOString()
    };
  }

  /**
   * Calculate error bounds for predictions
   */
  private static calculateErrorBounds(currentPrice: number) {
    const validation = this.validationCache;
    if (!validation) {
      return {
        expectedError: currentPrice * 0.1,
        maxError: currentPrice * 0.2,
        minError: currentPrice * 0.05
      };
    }

    const errorPercentage = validation.meanAbsoluteError / currentPrice;
    
    return {
      expectedError: Math.round(validation.meanAbsoluteError * 100) / 100,
      maxError: Math.round(validation.rootMeanSquareError * 100) / 100,
      minError: Math.round(validation.meanAbsoluteError * 0.5 * 100) / 100
    };
  }

  /**
   * Base prediction calculation (simplified version of enhanced prediction)
   */
  private static async calculateBasePrediction(
    currentPrice: number,
    origin: string,
    destination: string,
    departureDate: string
  ) {
    // Simplified prediction logic - in real implementation, 
    // this would use the full enhanced prediction service
    const departureDateTime = new Date(departureDate);
    const month = departureDateTime.getMonth() + 1;
    const dayOfWeek = departureDateTime.getDay();
    
    // Basic seasonal and day-of-week effects
    const seasonalMultiplier = month >= 6 && month <= 8 ? 1.2 : 
                              month === 12 || month === 1 ? 1.3 : 1.0;
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.1 : 1.0;
    
    const expectedPrice = currentPrice * seasonalMultiplier * weekendMultiplier;
    const probabilityIncrease = expectedPrice > currentPrice ? 0.7 : 0.3;
    
    return {
      currentPrice,
      currency: 'GBP',
      timestamp: new Date().toISOString(),
      probabilityIncrease,
      probabilityDecrease: 1 - probabilityIncrease,
      recommendation: probabilityIncrease > 0.75 ? 'BUY_NOW' as const : 'WAIT' as const,
      historicalContext: `Seasonal analysis for ${month}/${departureDateTime.getFullYear()}`,
      priceRange: {
        min: Math.round(currentPrice * 0.8),
        max: Math.round(currentPrice * 1.2),
        average: currentPrice
      }
    };
  }

  /**
   * Check if validation needs refresh
   */
  private static needsValidationRefresh(): boolean {
    if (!this.lastValidationTime || !this.validationCache) {
      return true;
    }
    
    const hoursSinceValidation = 
      (Date.now() - this.lastValidationTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceValidation >= this.VALIDATION_CACHE_HOURS;
  }

  /**
   * Default metrics when no validation data available
   */
  private static getDefaultMetrics(): StatisticalConfidenceMetrics {
    return {
      trueConfidence: 50, // Conservative default
      sampleSize: 0,
      validationPeriod: 'No validation performed',
      meanAbsoluteError: 0,
      confidenceInterval: {
        lower: 45,
        upper: 55,
        level: 95
      },
      dataQuality: {
        realDataPercentage: 0,
        temporalCoverage: 0,
        routeCoverage: 0
      },
      lastValidation: new Date().toISOString()
    };
  }

  /**
   * Get validation summary for admin dashboard
   */
  static getValidationSummary() {
    const validation = this.validationCache;
    const abMetrics = ABTestingFramework.calculateTestMetrics();
    const winningVariant = ABTestingFramework.getWinningVariant();
    
    return {
      validation,
      abTestMetrics: abMetrics,
      winningVariant,
      lastValidation: this.lastValidationTime,
      needsRefresh: this.needsValidationRefresh()
    };
  }
}
