import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';

// API Response Types matching the external API
export interface DashboardKPIs {
  total_open_variances: number;
  total_variance_amount: number;
  resolved_this_week: number;
  avg_days_to_resolution: number;
  recovery_rate: number;
}

export interface PayorTypeData {
  payor_type: string;
  count: number;
  total_amount: number;
}

export interface RootCauseData {
  root_cause: string;
  count: number;
  total_amount: number;
}

export interface AgingData {
  aging_bucket: string;
  count: number;
  total_amount: number;
}

export interface StateData {
  state: string;
  count: number;
  total_amount: number;
}

export interface PayorScorecardData {
  payor_name: string;
  payor_type: string;
  total_variances: number;
  total_variance_amount: number;
  denial_rate: number;
  clean_claim_rate: number;
  overall_score: string;
}

export interface AIInsightsData {
  key_insights: string;
  action_required: string;
  positive_trends: string;
}

export interface DashboardSummaryResponse {
  kpis: DashboardKPIs;
  by_payor_type: PayorTypeData[];
  by_root_cause: RootCauseData[];
  by_aging: AgingData[];
  by_state: StateData[];
  payor_scorecard: PayorScorecardData[];
  ai_insights?: AIInsightsData;
}

// State name mapping for display purposes (static - not provided by API)
export const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District of Columbia',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
  'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana',
  'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon',
  'PA': 'Pennsylvania', 'PR': 'Puerto Rico', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
};

// Payor type display name mapping (API uses snake_case)
export const PAYOR_TYPE_DISPLAY_NAMES: Record<string, string> = {
  'medicare_traditional': 'Medicare Traditional',
  'medicare_advantage': 'Medicare Advantage',
  'medicaid': 'Medicaid',
  'commercial': 'Commercial',
  'medicaid_managed_care': 'Medicaid Managed Care',
  'commercial_ppo': 'Commercial PPO',
  'commercial_hmo': 'Commercial HMO',
  'commercial_epo': 'Commercial EPO',
  'va': 'VA',
  'tricare': 'TRICARE',
};

// API base URL is now centralized in @/config/api

async function fetchDashboardSummary(): Promise<DashboardSummaryResponse> {
  const response = await fetch(API_ENDPOINTS.dashboardSummary);

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard summary: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Transformed types matching dashboard component expectations
export interface TransformedKPIs {
  totalOpenVariances: number;
  totalVarianceAmount: number;
  newThisWeek: number; // STATIC - not provided by API
  resolvedThisWeek: number;
  avgDaysToResolution: number;
  recoveryRate: number;
}

export interface TransformedPayorType {
  type: string;
  count: number;
  amount: number;
}

export interface TransformedRootCause {
  category: string;
  count: number;
  amount: number;
  subcategories: { name: string; count: number; amount: number }[]; // STATIC - not provided by API
}

export interface TransformedAging {
  bucket: string;
  count: number;
  amount: number;
}

export interface TransformedState {
  state: string;
  stateName: string; // Enriched from static mapping
  count: number;
  amount: number;
}

export interface TransformedPayorScorecard {
  payorName: string;
  payorType: string;
  varianceCount: number;
  denialRate: number;
  netCollectionRate: number;  // STATIC - not provided by API (calculated estimate)
  daysInAR: number;           // STATIC - not provided by API (calculated estimate)
  cleanClaimRate: number;
  contractCompliance: number; // STATIC - not provided by API (calculated estimate)
  overallScore: string;
  writeOffAmount: number;     // STATIC - not provided by API (calculated estimate)
  openVarianceCount: number;  // STATIC - not provided by API (calculated estimate)
  totalVarianceAmount: number;
}

export interface TransformedAIInsights {
  keyInsights: string;
  actionRequired: string;
  positiveTrends: string;
}

export interface TransformedDashboardData {
  kpis: TransformedKPIs;
  payorTypeData: TransformedPayorType[];
  rootCauseData: TransformedRootCause[];
  agingData: TransformedAging[];
  stateData: TransformedState[];
  payorScorecards: TransformedPayorScorecard[];
  aiInsights: TransformedAIInsights | null;
  // Flags indicating which data is from API vs static
  dataSource: {
    kpis: { fromApi: string[]; static: string[] };
    payorScorecards: { fromApi: string[]; static: string[] };
  };
}

// Root cause subcategories mapping (STATIC - not provided by API)
const ROOT_CAUSE_SUBCATEGORIES: Record<string, string[]> = {
  'Authorization Issues': ['Missing auth', 'Expired auth', 'Auth limit exceeded'],
  'Contractual Disputes': ['Rate discrepancy', 'Fee schedule mismatch', 'Contract not loaded'],
  'Coding Errors': ['Incorrect CPT', 'Incorrect ICD-10', 'Modifier issues'],
  'Patient Eligibility': ['Coverage terminated', 'COB issues', 'Wrong plan'],
  'Medical Necessity': ['LCD/NCD denial', 'Documentation insufficient'],
  'Claim Submission Errors': ['Duplicate claim', 'Missing information', 'Late filing'],
  'Timely Filing': ['Past deadline', 'Appeal deadline missed'],
  'System/Technical': ['EDI rejection', 'Payer system error', 'Clearinghouse issue'],
};

// Transform API response to dashboard component format
function transformDashboardData(data: DashboardSummaryResponse): TransformedDashboardData {
  // Transform KPIs
  const kpis: TransformedKPIs = {
    totalOpenVariances: data.kpis.total_open_variances,
    totalVarianceAmount: data.kpis.total_variance_amount,
    newThisWeek: Math.round(data.kpis.resolved_this_week * 1.15), // STATIC: estimated ~15% more new than resolved
    resolvedThisWeek: data.kpis.resolved_this_week,
    avgDaysToResolution: data.kpis.avg_days_to_resolution,
    recoveryRate: data.kpis.recovery_rate,
  };

  // Transform payor type data
  const payorTypeData: TransformedPayorType[] = data.by_payor_type.map(p => ({
    type: PAYOR_TYPE_DISPLAY_NAMES[p.payor_type] || p.payor_type,
    count: p.count,
    amount: p.total_amount,
  }));

  // Transform root cause data (add static subcategories)
  const rootCauseData: TransformedRootCause[] = data.by_root_cause.map(rc => {
    const subcategoryNames = ROOT_CAUSE_SUBCATEGORIES[rc.root_cause] || ['Other'];
    // Distribute count/amount across subcategories (STATIC estimation)
    const subcategoryCount = subcategoryNames.length;
    const baseCount = Math.floor(rc.count / subcategoryCount);
    const baseAmount = rc.total_amount / subcategoryCount;

    return {
      category: rc.root_cause,
      count: rc.count,
      amount: rc.total_amount,
      subcategories: subcategoryNames.map((name, idx) => ({
        name,
        count: idx === 0 ? rc.count - (baseCount * (subcategoryCount - 1)) : baseCount,
        amount: idx === 0 ? rc.total_amount - (baseAmount * (subcategoryCount - 1)) : baseAmount,
      })),
    };
  });

  // Transform aging data
  const agingData: TransformedAging[] = data.by_aging.map(a => ({
    bucket: a.aging_bucket,
    count: a.count,
    amount: a.total_amount,
  }));

  // Transform state data (enrich with state names)
  const stateData: TransformedState[] = data.by_state.map(s => ({
    state: s.state,
    stateName: STATE_NAMES[s.state] || s.state,
    count: s.count,
    amount: s.total_amount,
  }));

  // Transform payor scorecard data (add estimated static fields)
  const payorScorecards: TransformedPayorScorecard[] = data.payor_scorecard.map(ps => {
    // Calculate estimated values for fields not provided by API
    const denialImpact = ps.denial_rate * 0.15;
    const estimatedNetCollectionRate = Math.max(70, Math.min(98, 95 - denialImpact * 0.3));
    const estimatedDaysInAR = Math.max(25, Math.min(90, 45 + ps.denial_rate * 0.5));
    const estimatedContractCompliance = Math.max(80, Math.min(99, 100 - ps.denial_rate * 0.3));
    const estimatedWriteOffAmount = ps.total_variance_amount * (ps.denial_rate > 50 ? 0.15 : 0.08);
    const estimatedOpenVarianceCount = Math.round(ps.total_variances * 0.7);

    return {
      payorName: ps.payor_name,
      payorType: PAYOR_TYPE_DISPLAY_NAMES[ps.payor_type] || ps.payor_type,
      varianceCount: ps.total_variances,
      denialRate: ps.denial_rate,
      netCollectionRate: estimatedNetCollectionRate,  // STATIC
      daysInAR: Math.round(estimatedDaysInAR),        // STATIC
      cleanClaimRate: ps.clean_claim_rate,
      contractCompliance: estimatedContractCompliance, // STATIC
      overallScore: ps.overall_score,
      writeOffAmount: estimatedWriteOffAmount,         // STATIC
      openVarianceCount: estimatedOpenVarianceCount,   // STATIC
      totalVarianceAmount: ps.total_variance_amount,
    };
  });

  // Transform AI insights data
  const aiInsights: TransformedAIInsights | null = data.ai_insights ? {
    keyInsights: data.ai_insights.key_insights,
    actionRequired: data.ai_insights.action_required,
    positiveTrends: data.ai_insights.positive_trends,
  } : null;

  return {
    kpis,
    payorTypeData,
    rootCauseData,
    agingData,
    stateData,
    payorScorecards,
    aiInsights,
    dataSource: {
      kpis: {
        fromApi: ['totalOpenVariances', 'totalVarianceAmount', 'resolvedThisWeek', 'avgDaysToResolution', 'recoveryRate'],
        static: ['newThisWeek'],
      },
      payorScorecards: {
        fromApi: ['payorName', 'payorType', 'varianceCount', 'denialRate', 'cleanClaimRate', 'overallScore', 'totalVarianceAmount'],
        static: ['netCollectionRate', 'daysInAR', 'contractCompliance', 'writeOffAmount', 'openVarianceCount'],
      },
    },
  };
}

export function useDashboardSummary() {
  return useQuery<TransformedDashboardData, Error>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const data = await fetchDashboardSummary();
      return transformDashboardData(data);
    },
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Export the raw API hook for cases where untransformed data is needed
export function useRawDashboardSummary() {
  return useQuery<DashboardSummaryResponse, Error>({
    queryKey: ['dashboardSummaryRaw'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 3,
  });
}

