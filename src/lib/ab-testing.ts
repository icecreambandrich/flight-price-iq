export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  confidenceThreshold: number; // Different thresholds for BUY_NOW recommendation
  algorithm: 'conservative' | 'aggressive' | 'balanced';
}

export interface ABTestResult {
  variantId: string;
  userId: string;
  route: string;
  recommendation: 'BUY_NOW' | 'WAIT';
  userAction: 'BOUGHT' | 'WAITED' | 'NO_ACTION';
  actualOutcome: 'PRICE_INCREASED' | 'PRICE_DECREASED' | 'UNKNOWN';
  success: boolean; // True if recommendation matched optimal action
  timestamp: string;
  priceAtRecommendation: number;
  priceAfter7Days?: number;
  savings?: number; // Positive if user saved money, negative if they lost
}

export interface ABTestMetrics {
  variantId: string;
  totalRecommendations: number;
  buyNowRecommendations: number;
  waitRecommendations: number;
  successRate: number;
  averageSavings: number;
  userFollowRate: number; // How often users follow recommendations
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export class ABTestingFramework {
  private static readonly TEST_KEY = 'flight_ab_test_data';
  private static readonly USER_VARIANT_KEY = 'flight_user_variant';

  // Define test variants
  private static readonly VARIANTS: ABTestVariant[] = [
    {
      id: 'conservative',
      name: 'Conservative',
      description: 'High confidence threshold (85%) for BUY_NOW recommendations',
      confidenceThreshold: 85,
      algorithm: 'conservative'
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Medium confidence threshold (75%) for BUY_NOW recommendations',
      confidenceThreshold: 75,
      algorithm: 'balanced'
    },
    {
      id: 'aggressive',
      name: 'Aggressive',
      description: 'Lower confidence threshold (65%) for BUY_NOW recommendations',
      confidenceThreshold: 65,
      algorithm: 'aggressive'
    }
  ];

  /**
   * Assign user to A/B test variant
   */
  static assignUserToVariant(userId: string): ABTestVariant {
    // Check if user already has a variant assigned
    const existingVariant = this.getUserVariant(userId);
    if (existingVariant) return existingVariant;

    // Assign based on user ID hash for consistent assignment
    const hash = this.hashUserId(userId);
    const variantIndex = hash % this.VARIANTS.length;
    const variant = this.VARIANTS[variantIndex];

    // Save assignment
    this.saveUserVariant(userId, variant);
    return variant;
  }

  /**
   * Apply A/B test variant to prediction
   */
  static applyVariantToPrediction(
    prediction: any,
    variant: ABTestVariant
  ): any {
    const modifiedPrediction = { ...prediction };

    // Adjust recommendation based on variant
    switch (variant.algorithm) {
      case 'conservative':
        // Only recommend BUY_NOW if very confident and price is low
        if (prediction.confidence >= variant.confidenceThreshold && 
            prediction.probabilityIncrease >= 0.8) {
          modifiedPrediction.recommendation = 'BUY_NOW';
        } else {
          modifiedPrediction.recommendation = 'WAIT';
        }
        break;

      case 'aggressive':
        // Recommend BUY_NOW more often
        if (prediction.confidence >= variant.confidenceThreshold || 
            prediction.probabilityIncrease >= 0.6) {
          modifiedPrediction.recommendation = 'BUY_NOW';
        } else {
          modifiedPrediction.recommendation = 'WAIT';
        }
        break;

      case 'balanced':
      default:
        // Standard logic
        if (prediction.confidence >= variant.confidenceThreshold && 
            prediction.probabilityIncrease >= 0.75) {
          modifiedPrediction.recommendation = 'BUY_NOW';
        } else {
          modifiedPrediction.recommendation = 'WAIT';
        }
        break;
    }

    // Add variant info to prediction
    modifiedPrediction.abTestVariant = variant.id;
    modifiedPrediction.abTestThreshold = variant.confidenceThreshold;

    return modifiedPrediction;
  }

  /**
   * Record A/B test result
   */
  static recordTestResult(result: ABTestResult): void {
    const existingResults = this.loadTestResults();
    existingResults.push(result);
    this.saveTestResults(existingResults);
  }

  /**
   * Track user action on recommendation
   */
  static trackUserAction(
    userId: string,
    route: string,
    recommendation: 'BUY_NOW' | 'WAIT',
    userAction: 'BOUGHT' | 'WAITED' | 'NO_ACTION',
    priceAtRecommendation: number
  ): void {
    const variant = this.getUserVariant(userId);
    if (!variant) return;

    const result: ABTestResult = {
      variantId: variant.id,
      userId,
      route,
      recommendation,
      userAction,
      actualOutcome: 'UNKNOWN', // Will be updated later
      success: false, // Will be calculated later
      timestamp: new Date().toISOString(),
      priceAtRecommendation
    };

    this.recordTestResult(result);

    // Schedule follow-up to check actual price outcome
    this.scheduleOutcomeCheck(result);
  }

  /**
   * Calculate A/B test metrics for each variant
   */
  static calculateTestMetrics(): ABTestMetrics[] {
    const results = this.loadTestResults();
    const metrics: ABTestMetrics[] = [];

    for (const variant of this.VARIANTS) {
      const variantResults = results.filter(r => r.variantId === variant.id);
      
      if (variantResults.length === 0) {
        metrics.push({
          variantId: variant.id,
          totalRecommendations: 0,
          buyNowRecommendations: 0,
          waitRecommendations: 0,
          successRate: 0,
          averageSavings: 0,
          userFollowRate: 0,
          confidenceInterval: { lower: 0, upper: 0 }
        });
        continue;
      }

      const totalRecommendations = variantResults.length;
      const buyNowRecommendations = variantResults.filter(r => r.recommendation === 'BUY_NOW').length;
      const waitRecommendations = totalRecommendations - buyNowRecommendations;
      
      const successfulResults = variantResults.filter(r => r.success);
      const successRate = successfulResults.length / totalRecommendations;
      
      const resultsWithSavings = variantResults.filter(r => r.savings !== undefined);
      const averageSavings = resultsWithSavings.length > 0 
        ? resultsWithSavings.reduce((sum, r) => sum + (r.savings || 0), 0) / resultsWithSavings.length
        : 0;

      const followedRecommendations = variantResults.filter(r => 
        (r.recommendation === 'BUY_NOW' && r.userAction === 'BOUGHT') ||
        (r.recommendation === 'WAIT' && r.userAction === 'WAITED')
      ).length;
      const userFollowRate = followedRecommendations / totalRecommendations;

      // Calculate 95% confidence interval for success rate
      const standardError = Math.sqrt((successRate * (1 - successRate)) / totalRecommendations);
      const marginOfError = 1.96 * standardError;

      metrics.push({
        variantId: variant.id,
        totalRecommendations,
        buyNowRecommendations,
        waitRecommendations,
        successRate: Math.round(successRate * 10000) / 100,
        averageSavings: Math.round(averageSavings * 100) / 100,
        userFollowRate: Math.round(userFollowRate * 10000) / 100,
        confidenceInterval: {
          lower: Math.max(0, Math.round((successRate - marginOfError) * 10000) / 100),
          upper: Math.min(100, Math.round((successRate + marginOfError) * 10000) / 100)
        }
      });
    }

    return metrics;
  }

  /**
   * Get winning variant based on statistical significance
   */
  static getWinningVariant(): { winner: ABTestVariant | null; significant: boolean } {
    const metrics = this.calculateTestMetrics();
    
    if (metrics.length < 2) {
      return { winner: null, significant: false };
    }

    // Sort by success rate
    const sortedMetrics = metrics.sort((a, b) => b.successRate - a.successRate);
    const best = sortedMetrics[0];
    const second = sortedMetrics[1];

    // Check if difference is statistically significant
    // Simple check: confidence intervals don't overlap
    const significant = best.confidenceInterval.lower > second.confidenceInterval.upper;

    const winner = significant ? this.VARIANTS.find(v => v.id === best.variantId) || null : null;

    return { winner, significant };
  }

  /**
   * Helper methods
   */
  private static hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private static scheduleOutcomeCheck(result: ABTestResult): void {
    // In a real implementation, this would schedule a job to check prices after 7 days
    // For demo purposes, we'll simulate this
    setTimeout(() => {
      this.checkActualOutcome(result);
    }, 1000); // Simulate immediate check for demo
  }

  private static checkActualOutcome(result: ABTestResult): void {
    // In reality, this would fetch current prices and compare
    // For demo, we'll simulate outcomes
    const priceChange = (Math.random() - 0.5) * 100; // Random price change
    const newPrice = result.priceAtRecommendation + priceChange;
    
    const actualOutcome: 'PRICE_INCREASED' | 'PRICE_DECREASED' = 
      newPrice > result.priceAtRecommendation ? 'PRICE_INCREASED' : 'PRICE_DECREASED';

    // Determine if recommendation was successful
    const success = 
      (result.recommendation === 'BUY_NOW' && actualOutcome === 'PRICE_INCREASED') ||
      (result.recommendation === 'WAIT' && actualOutcome === 'PRICE_DECREASED');

    const savings = result.recommendation === 'BUY_NOW' 
      ? (newPrice - result.priceAtRecommendation) // Savings if bought early
      : (result.priceAtRecommendation - newPrice); // Savings if waited

    // Update the result
    const updatedResult = {
      ...result,
      actualOutcome,
      success,
      priceAfter7Days: newPrice,
      savings
    };

    // Update stored results
    const results = this.loadTestResults();
    const index = results.findIndex(r => 
      r.userId === result.userId && 
      r.timestamp === result.timestamp
    );
    
    if (index >= 0) {
      results[index] = updatedResult;
      this.saveTestResults(results);
    }
  }

  // Storage methods
  private static saveUserVariant(userId: string, variant: ABTestVariant): void {
    if (typeof window !== 'undefined') {
      const assignments = this.loadUserVariants();
      assignments[userId] = variant;
      localStorage.setItem(this.USER_VARIANT_KEY, JSON.stringify(assignments));
    }
  }

  private static getUserVariant(userId: string): ABTestVariant | null {
    if (typeof window !== 'undefined') {
      const assignments = this.loadUserVariants();
      return assignments[userId] || null;
    }
    return null;
  }

  private static loadUserVariants(): { [userId: string]: ABTestVariant } {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(this.USER_VARIANT_KEY);
      return data ? JSON.parse(data) : {};
    }
    return {};
  }

  private static saveTestResults(results: ABTestResult[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TEST_KEY, JSON.stringify(results));
    }
  }

  private static loadTestResults(): ABTestResult[] {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(this.TEST_KEY);
      return data ? JSON.parse(data) : [];
    }
    return [];
  }

  // Public method to get all variants for admin interface
  static getVariants(): ABTestVariant[] {
    return [...this.VARIANTS];
  }
}
