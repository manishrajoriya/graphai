// services/aiServices.ts
// Enhanced Market Research Report Interface and API Service

// Main Report Interface
export interface EnhancedMarketResearchReport {
  companyName: string;
  symbol: string;
  lastUpdated: string;
  executiveSummary: {
    overview: string;
    keyHighlights: string[];
    investmentThesis: string;
  };
  financialAnalysis: {
    revenue: string;
    revenueGrowth: string;
    netIncome: string;
    netIncomeGrowth: string;
    eps: string;
    epsGrowth: string;
    peRatio: string;
    pegRatio: string;
    priceToBook: string;
    debtToEquity: string;
    currentRatio: string;
    roe: string;
    roic: string;
    grossMargin: string;
    operatingMargin: string;
    netMargin: string;
    freeCashFlow: string;
    dividendYield: string;
  };
  businessModel: {
    description: string;
    revenueStreams: string[];
    competitiveAdvantages: string[];
    moatStrength: 'Wide' | 'Narrow' | 'None';
    marketPosition: string;
  };
  industryAnalysis: {
    industryName: string;
    marketSize: string;
    growthRate: string;
    lifecycle: 'Emerging' | 'Growth' | 'Mature' | 'Declining';
    trends: string[];
    regulatoryEnvironment: string;
    cyclicality: 'Low' | 'Medium' | 'High';
  };
  management: {
    ceoName: string;
    leadershipQuality: 'Excellent' | 'Good' | 'Average' | 'Poor';
    trackRecord: string;
    governanceScore: string;
    insiderOwnership: string;
  };
  competitors: {
    directCompetitors: string[];
    marketShare: string;
    competitivePosition: 'Leader' | 'Strong' | 'Moderate' | 'Weak';
  };
  growthAnalysis: {
    historicalGrowth: string;
    futureGrowthDrivers: string[];
    growthPotential: 'High' | 'Medium' | 'Low';
    projectedGrowthRate: string;
    catalysts: string[];
  };
  riskAssessment: {
    businessRisks: string[];
    financialRisks: string[];
    marketRisks: string[];
    regulatoryRisks: string[];
    operationalRisks: string[];
    riskLevel: 'Low' | 'Medium' | 'High';
  };
  esgFactors: {
    environmentalScore: string;
    socialScore: string;
    governanceScore: string;
    overallESGRating: 'A' | 'B' | 'C' | 'D' | 'F';
    sustainabilityInitiatives: string[];
  };
  valuation: {
    currentPrice: string;
    fairValueEstimate: string;
    upside: string;
    valuationMethod: string;
    keyMetrics: {
      dcfValue: string;
      comparableValue: string;
      assetValue: string;
    };
  };
  technicalAnalysis: {
    trend: 'Bullish' | 'Bearish' | 'Neutral';
    support: string;
    resistance: string;
    momentum: string;
    volatility: 'Low' | 'Medium' | 'High';
  };
  recommendation: {
    rating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
    targetPrice: string;
    timeHorizon: string;
    confidence: 'High' | 'Medium' | 'Low';
    rationale: string;
  };
  keyMetrics: {
    beta: string;
    marketCap: string;
    enterpriseValue: string;
    sharesOutstanding: string;
    float: string;
  };
}

// Legacy interface for backward compatibility
export interface MarketResearchReport {
  companyName: string;
  symbol: string;
  summary: string;
  financials: {
    revenue: string;
    netIncome: string;
    eps: string;
    peRatio: string;
  };
  growthPotential: string;
  competitors: string[];
  risks: string;
  recommendation: 'Buy' | 'Hold' | 'Sell';
}

// API Response Types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  details?: any;
  timestamp?: string;
}

export interface APIError {
  error: string;
  details?: any;
  timestamp: string;
}

// Configuration
export const API_CONFIG = {
  BASE_URL: 'https://your-deno-deployment-url.deno.dev', // Replace with your actual Deno Deploy URL
  ENDPOINTS: {
    MARKET_RESEARCH: '/api/market-research',
  },
  TIMEOUT: 60000, // 60 seconds
};

// Enhanced API Service Class
export class MarketResearchService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_CONFIG.BASE_URL, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Generate enhanced market research report
   */
  async generateEnhancedReport(companyName: string): Promise<EnhancedMarketResearchReport> {
    if (!companyName || companyName.trim().length === 0) {
      throw new Error('Company name is required');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.MARKET_RESEARCH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: companyName.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: APIError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const report: EnhancedMarketResearchReport = await response.json();
      
      // Validate required fields
      this.validateReport(report);
      
      return report;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
      
      throw error;
    }
  }

  /**
   * Generate legacy format report for backward compatibility
   */
  async generateLegacyReport(companyName: string): Promise<MarketResearchReport> {
    const enhancedReport = await this.generateEnhancedReport(companyName);
    
    // Convert enhanced report to legacy format
    return this.convertToLegacyFormat(enhancedReport);
  }

  /**
   * Validate report structure
   */
  private validateReport(report: any): void {
    const requiredFields = [
      'companyName',
      'symbol',
      'executiveSummary',
      'financialAnalysis',
      'recommendation'
    ];

    for (const field of requiredFields) {
      if (!report[field]) {
        throw new Error(`Invalid report: missing required field '${field}'`);
      }
    }

    if (!report.recommendation.rating) {
      throw new Error('Invalid report: missing recommendation rating');
    }
  }

  /**
   * Convert enhanced report to legacy format
   */
  private convertToLegacyFormat(enhanced: EnhancedMarketResearchReport): MarketResearchReport {
    return {
      companyName: enhanced.companyName,
      symbol: enhanced.symbol,
      summary: enhanced.executiveSummary.overview,
      financials: {
        revenue: enhanced.financialAnalysis.revenue,
        netIncome: enhanced.financialAnalysis.netIncome,
        eps: enhanced.financialAnalysis.eps,
        peRatio: enhanced.financialAnalysis.peRatio,
      },
      growthPotential: enhanced.growthAnalysis.projectedGrowthRate,
      competitors: enhanced.competitors.directCompetitors,
      risks: enhanced.riskAssessment.businessRisks.join(', '),
      recommendation: this.convertRecommendation(enhanced.recommendation.rating),
    };
  }

  /**
   * Convert enhanced recommendation to legacy format
   */
  private convertRecommendation(rating: string): 'Buy' | 'Hold' | 'Sell' {
    switch (rating.toLowerCase()) {
      case 'strong buy':
      case 'buy':
        return 'Buy';
      case 'hold':
        return 'Hold';
      case 'sell':
      case 'strong sell':
        return 'Sell';
      default:
        return 'Hold';
    }
  }

  /**
   * Health check for the API service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const marketResearchService = new MarketResearchService();

// Utility functions
export const formatCurrency = (value: string): string => {
  if (!value || value === 'N/A') return value;
  
  // Extract number from string
  const numMatch = value.match(/[\d,.]+/);
  if (!numMatch) return value;
  
  const num = parseFloat(numMatch[0].replace(/,/g, ''));
  if (isNaN(num)) return value;
  
  // Format based on magnitude
  if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  
  return `$${num.toFixed(2)}`;
};

export const formatPercentage = (value: string): string => {
  if (!value || value === 'N/A') return value;
  
  const numMatch = value.match(/-?[\d,.]+/);
  if (!numMatch) return value;
  
  const num = parseFloat(numMatch[0].replace(/,/g, ''));
  if (isNaN(num)) return value;
  
  return `${num.toFixed(1)}%`;
};

export const getRecommendationColor = (rating: string): string => {
  switch (rating.toLowerCase()) {
    case 'strong buy':
      return '#10b981';
    case 'buy':
      return '#22c55e';
    case 'hold':
      return '#f59e0b';
    case 'sell':
      return '#f97316';
    case 'strong sell':
      return '#ef4444';
    default:
      return '#9ca3af';
  }
};

export const getRiskLevelColor = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'low':
      return '#10b981';
    case 'medium':
      return '#f59e0b';
    case 'high':
      return '#ef4444';
    default:
      return '#9ca3af';
  }
};

export const getESGRatingColor = (rating: string): string => {
  switch (rating.toUpperCase()) {
    case 'A':
      return '#10b981';
    case 'B':
      return '#22c55e';
    case 'C':
      return '#f59e0b';
    case 'D':
      return '#f97316';
    case 'F':
      return '#ef4444';
    default:
      return '#9ca3af';
  }
};

// Error classes
export class MarketResearchError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MarketResearchError';
  }
}

export class NetworkError extends MarketResearchError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends MarketResearchError {
  constructor(message: string = 'Validation error occurred') {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends MarketResearchError {
  constructor(message: string = 'Request timeout') {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

// Export types for convenience
export type RecommendationRating = 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type ESGRating = 'A' | 'B' | 'C' | 'D' | 'F';
export type MoatStrength = 'Wide' | 'Narrow' | 'None';
export type IndustryLifecycle = 'Emerging' | 'Growth' | 'Mature' | 'Declining';
export type LeadershipQuality = 'Excellent' | 'Good' | 'Average' | 'Poor';
export type CompetitivePosition = 'Leader' | 'Strong' | 'Moderate' | 'Weak';
export type GrowthPotential = 'High' | 'Medium' | 'Low';
export type TechnicalTrend = 'Bullish' | 'Bearish' | 'Neutral';
export type Volatility = 'Low' | 'Medium' | 'High';