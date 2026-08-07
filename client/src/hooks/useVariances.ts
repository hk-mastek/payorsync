import { useQuery } from '@tanstack/react-query';
import { STATE_NAMES, PAYOR_TYPE_DISPLAY_NAMES } from './useDashboardSummary';
import { API_ENDPOINTS, buildUrl } from '@/config/api';

// API Response Types for variances endpoint
export interface APIVariance {
  id: string;
  uuid?: string;
  variance_id?: string;  // Display ID for variance
  payor_id: string;
  payor_name: string;
  payor_type: string;
  state: string;
  root_cause_category: string;
  root_cause_subcategory: string;
  billed_amount: number;
  paid_amount: number;
  variance_amount: number;
  variance_percentage: number;
  date_of_service: string;
  claim_submission_date: string;
  variance_identified_date: string;
  status: string;
  aging_bucket: string;
  aging_days: number;
  patient_name: string;
  priority?: string;  // Can be 'high', 'medium', 'low' or other values
  high_priority?: string;  // Detailed priority notes from API (string with bullet points)
  treatment_count: number;
  // Additional fields from detail API
  claim_number?: string;
  facility_name?: string;
  assigned_analyst?: string;
  assigned_to?: string;
  resolution_date?: string;
  resolution_notes?: string;
  recovery_amount?: number;
  days_to_resolution?: number;
}

export interface VariancesListResponse {
  // Support multiple API response formats
  items?: APIVariance[];
  variances?: APIVariance[];
  data?: APIVariance[];
  // Pagination fields - support various naming conventions
  total?: number;
  total_count?: number;
  totalCount?: number;
  page?: number;
  current_page?: number;
  limit?: number;
  page_size?: number;
  pageSize?: number;
  pages?: number;
  total_pages?: number;
  totalPages?: number;
}

export interface VarianceDetailResponse {
  variance: APIVariance;
  // Additional detail fields that might come from the API
  notes?: string[];
  history?: Array<{
    date: string;
    action: string;
    user: string;
  }>;
  related_claims?: Array<{
    claim_id: string;
    date: string;
    amount: number;
  }>;
}

// Transformed types matching dashboard component expectations
export interface VarianceRecord {
  id: string;
  uuid?: string;
  variance_id?: string;  // Display ID for variance
  payorId: string;
  payorName: string;
  payorType: string;
  state: string;
  stateName: string;
  rootCauseCategory: string;
  rootCauseSubcategory: string;
  billedAmount: number;
  paidAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  dateOfService: string;
  claimSubmissionDate: string;
  varianceIdentifiedDate: string;
  status: string;
  agingBucket: string;
  agingDays: number;
  patientName: string;
  priority: 'High' | 'Medium' | 'Low';
  highPriorityNotes?: string;  // Detailed priority notes from API
  treatmentCount: number;
  // Additional detail fields
  claimNumber?: string;
  facilityName?: string;
  assignedAnalyst?: string;
  assignedTo?: string;
  resolutionDate?: string;
  resolutionNotes?: string;
  recoveryAmount?: number;
  daysToResolution?: number;
}

// API base URL is now centralized in @/config/api

// Helper function to determine priority from API data
function determinePriority(apiVariance: APIVariance): 'High' | 'Medium' | 'Low' {
  // If priority field is set, normalize it to proper case
  if (apiVariance.priority) {
    const normalizedPriority = apiVariance.priority.toLowerCase();
    if (normalizedPriority === 'high') return 'High';
    if (normalizedPriority === 'medium') return 'Medium';
    if (normalizedPriority === 'low') return 'Low';
  }

  // If high_priority notes exist, it indicates high priority
  if (apiVariance.high_priority && apiVariance.high_priority.length > 0) {
    return 'High';
  }

  // Default logic based on variance amount and aging days
  if (apiVariance.variance_amount >= 1000 || apiVariance.aging_days >= 120) {
    return 'High';
  }
  if (apiVariance.variance_amount >= 500 || apiVariance.aging_days >= 60) {
    return 'Medium';
  }
  return 'Low';
}

// Transform API variance to component format
function transformVariance(apiVariance: APIVariance): VarianceRecord {
  return {
    id: apiVariance.id,
    uuid: apiVariance.uuid || apiVariance.id,
    variance_id: apiVariance.variance_id || apiVariance.id,
    payorId: apiVariance.payor_id,
    payorName: apiVariance.payor_name,
    payorType: PAYOR_TYPE_DISPLAY_NAMES[apiVariance.payor_type] || apiVariance.payor_type,
    state: apiVariance.state,
    stateName: STATE_NAMES[apiVariance.state] || apiVariance.state,
    rootCauseCategory: apiVariance.root_cause_category,
    rootCauseSubcategory: apiVariance.root_cause_subcategory,
    billedAmount: apiVariance.billed_amount,
    paidAmount: apiVariance.paid_amount,
    varianceAmount: apiVariance.variance_amount,
    variancePercentage: apiVariance.variance_percentage,
    dateOfService: apiVariance.date_of_service,
    claimSubmissionDate: apiVariance.claim_submission_date,
    varianceIdentifiedDate: apiVariance.variance_identified_date,
    status: apiVariance.status,
    agingBucket: apiVariance.aging_bucket,
    agingDays: apiVariance.aging_days,
    patientName: apiVariance.patient_name,
    priority: determinePriority(apiVariance),
    highPriorityNotes: apiVariance.high_priority,  // Pass through the detailed notes
    treatmentCount: apiVariance.treatment_count,
    // Additional detail fields
    claimNumber: apiVariance.claim_number,
    facilityName: apiVariance.facility_name || undefined,
    assignedAnalyst: apiVariance.assigned_analyst,
    assignedTo: apiVariance.assigned_to || undefined,
    resolutionDate: apiVariance.resolution_date || undefined,
    resolutionNotes: apiVariance.resolution_notes || undefined,
    recoveryAmount: apiVariance.recovery_amount || undefined,
    daysToResolution: apiVariance.days_to_resolution || undefined,
  };
}

// Fetch variance list from API
interface FetchVariancesParams {
  page?: number;
  pageSize?: number;
  payorType?: string;
  state?: string;
  status?: string;
  rootCause?: string;
  search?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

async function fetchVariances(params: FetchVariancesParams = {}): Promise<{
  variances: VarianceRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const url = buildUrl(API_ENDPOINTS.variances, {
    page: params.page,
    page_size: params.pageSize,
    payor_type: params.payorType !== 'all' ? params.payorType : undefined,
    state: params.state !== 'all' ? params.state : undefined,
    status: params.status !== 'all' ? params.status : undefined,
    root_cause: params.rootCause !== 'all' ? params.rootCause : undefined,
    search: params.search,
    sort_by: params.sortColumn,
    sort_dir: params.sortDirection,
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch variances: ${response.status} ${response.statusText}`);
  }

  const data: VariancesListResponse = await response.json();

  // Handle different response formats for the variance array
  const varianceArray = data.items || data.variances || data.data || [];

  // Handle different response formats for pagination
  const total = data.total ?? data.total_count ?? data.totalCount ?? varianceArray.length;
  const currentPage = data.page ?? data.current_page ?? params.page ?? 1;
  const limit = data.limit ?? data.page_size ?? data.pageSize ?? params.pageSize ?? 25;
  const pages = data.pages ?? data.total_pages ?? data.totalPages ?? Math.ceil(total / limit);

  return {
    variances: varianceArray.map(transformVariance),
    totalCount: total,
    page: currentPage,
    pageSize: limit,
    totalPages: pages,
  };
}

// Fetch variance details from API
async function fetchVarianceDetails(identifier: string): Promise<{
  variance: VarianceRecord;
  notes?: string[];
  history?: Array<{ date: string; action: string; user: string }>;
  relatedClaims?: Array<{ claimId: string; date: string; amount: number }>;
}> {
  const response = await fetch(API_ENDPOINTS.varianceDetail(identifier));

  if (!response.ok) {
    throw new Error(`Failed to fetch variance details: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Handle different response formats:
  // 1. Response with variance object: { variance: {...}, notes: [...], history: [...] }
  // 2. Response with variance data directly: { id: "...", patient_name: "...", ... }
  const varianceData = data.variance || data;
  
  return {
    variance: transformVariance(varianceData),
    notes: data.notes,
    history: data.history,
    relatedClaims: data.related_claims?.map((rc: any) => ({
      claimId: rc.claim_id,
      date: rc.date,
      amount: rc.amount,
    })),
  };
}

// Hook for fetching variance list
export function useVariances(params: FetchVariancesParams = {}) {
  return useQuery({
    queryKey: ['variances', params],
    queryFn: () => fetchVariances(params),
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook for fetching all variances (for charts/aggregations)
export function useAllVariances() {
  return useQuery({
    queryKey: ['variances', 'all'],
    queryFn: () => fetchVariances({ pageSize: 10000 }), // Fetch all for client-side processing
    staleTime: 60000, // Consider data stale after 60 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook for fetching variance details
export function useVarianceDetails(identifier: string | null) {
  return useQuery({
    queryKey: ['varianceDetails', identifier],
    queryFn: () => fetchVarianceDetails(identifier!),
    enabled: !!identifier, // Only fetch when identifier is provided
    staleTime: 30000,
    retry: 2,
  });
}

// Utility functions for client-side filtering and aggregation
export function groupByPayorType(data: VarianceRecord[]) {
  const groups: Record<string, { count: number; amount: number }> = {};
  data.forEach(v => {
    if (!groups[v.payorType]) groups[v.payorType] = { count: 0, amount: 0 };
    groups[v.payorType].count++;
    groups[v.payorType].amount += v.varianceAmount;
  });
  return Object.entries(groups)
    .map(([type, data]) => ({ type, ...data }))
    .sort((a, b) => b.amount - a.amount);
}

export function groupByPayorWithType(data: VarianceRecord[]) {
  const typeGroups: Record<string, { count: number; amount: number; payors: Record<string, { name: string; count: number; amount: number }> }> = {};
  data.forEach(v => {
    if (!typeGroups[v.payorType]) {
      typeGroups[v.payorType] = { count: 0, amount: 0, payors: {} };
    }
    typeGroups[v.payorType].count++;
    typeGroups[v.payorType].amount += v.varianceAmount;

    if (!typeGroups[v.payorType].payors[v.payorId]) {
      typeGroups[v.payorType].payors[v.payorId] = { name: v.payorName, count: 0, amount: 0 };
    }
    typeGroups[v.payorType].payors[v.payorId].count++;
    typeGroups[v.payorType].payors[v.payorId].amount += v.varianceAmount;
  });

  return Object.entries(typeGroups)
    .map(([type, data]) => ({
      type,
      count: data.count,
      amount: data.amount,
      payors: Object.entries(data.payors)
        .map(([id, payor]) => ({ id, ...payor }))
        .sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function groupByState(data: VarianceRecord[]) {
  const groups: Record<string, { count: number; amount: number; stateName: string }> = {};
  data.forEach(v => {
    if (!groups[v.state]) groups[v.state] = { count: 0, amount: 0, stateName: v.stateName };
    groups[v.state].count++;
    groups[v.state].amount += v.varianceAmount;
  });
  return Object.entries(groups)
    .map(([state, data]) => ({ state, ...data }))
    .sort((a, b) => b.amount - a.amount);
}

export function groupByRootCause(data: VarianceRecord[]) {
  const groups: Record<string, { count: number; amount: number; subcategories: Record<string, { count: number; amount: number }> }> = {};
  data.forEach(v => {
    if (!groups[v.rootCauseCategory]) {
      groups[v.rootCauseCategory] = { count: 0, amount: 0, subcategories: {} };
    }
    groups[v.rootCauseCategory].count++;
    groups[v.rootCauseCategory].amount += v.varianceAmount;

    if (!groups[v.rootCauseCategory].subcategories[v.rootCauseSubcategory]) {
      groups[v.rootCauseCategory].subcategories[v.rootCauseSubcategory] = { count: 0, amount: 0 };
    }
    groups[v.rootCauseCategory].subcategories[v.rootCauseSubcategory].count++;
    groups[v.rootCauseCategory].subcategories[v.rootCauseSubcategory].amount += v.varianceAmount;
  });
  return Object.entries(groups)
    .map(([category, data]) => ({
      category,
      count: data.count,
      amount: data.amount,
      subcategories: Object.entries(data.subcategories).map(([name, sub]) => ({ name, ...sub })),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function groupByAgingBucket(data: VarianceRecord[]) {
  const bucketOrder = ['0-30 days', '31-60 days', '61-90 days', '91-120 days', '121-180 days', '181-365 days', '365+ days'];
  const groups: Record<string, { count: number; amount: number }> = {};
  bucketOrder.forEach(b => groups[b] = { count: 0, amount: 0 });

  data.forEach(v => {
    if (groups[v.agingBucket]) {
      groups[v.agingBucket].count++;
      groups[v.agingBucket].amount += v.varianceAmount;
    }
  });

  return bucketOrder.map(bucket => ({ bucket, ...groups[bucket] }));
}

export function getTrendData(data: VarianceRecord[]) {
  const months: Record<string, { new: number; resolved: number; amount: number }> = {};

  // Get current year and create months dynamically
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const trendMonths: string[] = [];

  for (let i = -1; i <= 11; i++) {
    const date = new Date(currentYear, currentDate.getMonth() + i - 11, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    trendMonths.push(key);
    months[key] = { new: 0, resolved: 0, amount: 0 };
  }

  data.forEach(v => {
    const month = v.varianceIdentifiedDate.slice(0, 7);
    if (months[month]) {
      months[month].new++;
      if (v.status === 'Resolved') months[month].resolved++;
      months[month].amount += v.varianceAmount;
    }
  });

  return trendMonths.map(month => ({
    month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    ...months[month],
    net: months[month].new - months[month].resolved,
  }));
}

export function calculateKPIs(data: VarianceRecord[]) {
  const openVariances = data.filter(v => v.status !== 'Resolved' && v.status !== 'Written Off');
  const resolvedVariances = data.filter(v => v.status === 'Resolved');
  const writtenOff = data.filter(v => v.status === 'Written Off');

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const newThisWeek = data.filter(v => new Date(v.varianceIdentifiedDate) >= weekAgo).length;
  const resolvedThisWeek = resolvedVariances.filter(v => {
    const date = new Date(v.varianceIdentifiedDate);
    date.setDate(date.getDate() + v.agingDays);
    return date >= weekAgo;
  }).length;

  const totalVarianceAmount = openVariances.reduce((sum, v) => sum + v.varianceAmount, 0);
  const avgDaysToResolution = resolvedVariances.length > 0
    ? resolvedVariances.reduce((sum, v) => sum + v.agingDays, 0) / resolvedVariances.length
    : 0;

  const totalRecoverable = [...resolvedVariances, ...writtenOff].reduce((sum, v) => sum + v.varianceAmount, 0);
  const recovered = resolvedVariances.reduce((sum, v) => sum + v.varianceAmount, 0);
  const recoveryRate = totalRecoverable > 0 ? (recovered / totalRecoverable) * 100 : 0;

  return {
    totalOpenVariances: openVariances.length,
    totalVarianceAmount,
    newThisWeek,
    resolvedThisWeek,
    avgDaysToResolution: Math.round(avgDaysToResolution * 10) / 10,
    recoveryRate: Math.round(recoveryRate * 10) / 10,
  };
}

// Calculate payor scorecards from variance data
const AGING_MIDPOINTS: Record<string, number> = {
  '0-30 days': 15,
  '31-60 days': 45,
  '61-90 days': 75,
  '91-120 days': 105,
  '121-180 days': 150,
  '181-365 days': 273,
  '365+ days': 400
};

function calculateOverallScore(denial: number, collection: number, ar: number, clean: number, compliance: number): string {
  let greenCount = 0;
  let redCount = 0;

  if (denial < 5) greenCount++; else if (denial > 10) redCount++;
  if (collection > 96) greenCount++; else if (collection < 93) redCount++;
  if (ar < 40) greenCount++; else if (ar > 60) redCount++;
  if (clean > 95) greenCount++; else if (clean < 90) redCount++;
  if (compliance > 98) greenCount++; else if (compliance < 95) redCount++;

  if (greenCount === 5) return 'A';
  if (greenCount === 4) return 'B+';
  if (greenCount === 3) return 'B';
  if (greenCount === 2 && redCount === 0) return 'B-';
  if (greenCount === 2) return 'C+';
  if (greenCount === 1 && redCount <= 1) return 'C';
  if (greenCount === 1) return 'C-';
  if (redCount <= 2) return 'D';
  return 'F';
}

export interface PayorScorecard {
  payorName: string;
  payorType: string;
  varianceCount: number;
  denialRate: number;
  netCollectionRate: number;
  daysInAR: number;
  cleanClaimRate: number;
  contractCompliance: number;
  overallScore: string;
  writeOffAmount: number;
  openVarianceCount: number;
  totalVarianceAmount: number;
}

export function calculatePayorScorecards(variances: VarianceRecord[]): PayorScorecard[] {
  const payorGroups: Record<string, VarianceRecord[]> = {};

  variances.forEach(v => {
    if (!payorGroups[v.payorName]) payorGroups[v.payorName] = [];
    payorGroups[v.payorName].push(v);
  });

  return Object.entries(payorGroups)
    .filter(([_, payorVariances]) => payorVariances.length >= 10)
    .map(([payorName, payorVariances]) => {
      const payorType = payorVariances[0]?.payorType || 'Unknown';
      const totalVariances = payorVariances.length;

      const denialVariances = payorVariances.filter(v =>
        ['Authorization Issues', 'Medical Necessity', 'Coding Errors'].includes(v.rootCauseCategory)
      );
      const rawDenialRate = (denialVariances.length / totalVariances) * 100;
      const denialRate = Math.min(rawDenialRate, 65);

      const totalBilled = payorVariances.reduce((sum, v) => sum + v.billedAmount, 0);
      const totalVariance = payorVariances.reduce((sum, v) => sum + v.varianceAmount, 0);
      const writtenOff = payorVariances.filter(v => v.status === 'Written Off');
      const totalWriteOff = writtenOff.reduce((sum, v) => sum + v.varianceAmount, 0);

      const rawNetCollectionRate = totalBilled > 0 ? ((totalBilled - totalVariance) / totalBilled) * 100 : 0;
      const denialImpact = denialRate * 0.15;
      const netCollectionRate = Math.max(70, Math.min(98, rawNetCollectionRate - denialImpact * 0.3));

      const openVariances = payorVariances.filter(v =>
        ['Open', 'In Progress', 'Under Appeal'].includes(v.status)
      );
      const totalAgingDays = openVariances.reduce((sum, v) => sum + (AGING_MIDPOINTS[v.agingBucket] || v.agingDays), 0);
      const rawDaysInAR = openVariances.length > 0 ? Math.round(totalAgingDays / openVariances.length) : 30;
      const daysInAR = Math.max(25, Math.min(90, rawDaysInAR));

      const resolvedVariances = payorVariances.filter(v => v.status === 'Resolved');
      const cleanClaims = resolvedVariances.filter(v =>
        !['181-365 days', '365+ days'].includes(v.agingBucket)
      );
      const rawCleanClaimRate = totalVariances > 0 ? (cleanClaims.length / totalVariances) * 100 : 0;
      const cleanClaimRate = Math.max(75, Math.min(98, rawCleanClaimRate + (100 - denialRate) * 0.2));

      const contractualVariances = payorVariances.filter(v => v.rootCauseCategory === 'Contractual Disputes');
      const rawContractCompliance = 100 - ((contractualVariances.length / totalVariances) * 100);
      const contractCompliance = Math.max(80, Math.min(99, rawContractCompliance));

      return {
        payorName,
        payorType,
        varianceCount: totalVariances,
        denialRate,
        netCollectionRate,
        daysInAR,
        cleanClaimRate,
        contractCompliance,
        overallScore: calculateOverallScore(denialRate, netCollectionRate, daysInAR, cleanClaimRate, contractCompliance),
        writeOffAmount: totalWriteOff,
        openVarianceCount: openVariances.length,
        totalVarianceAmount: totalVariance
      };
    }).sort((a, b) => {
      const scoreOrder = ['A', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
      return scoreOrder.indexOf(a.overallScore) - scoreOrder.indexOf(b.overallScore);
    });
}

export function calculateOrgMetrics(variances: VarianceRecord[]) {
  const totalVariances = variances.length;
  if (totalVariances === 0) return { denialRate: 0, netCollectionRate: 0, avgDaysInAR: 0, cleanClaimRate: 0, contractCompliance: 0 };

  const denialRelated = variances.filter(v =>
    ['Authorization Issues', 'Medical Necessity', 'Coding Errors'].includes(v.rootCauseCategory)
  ).length;

  const openVariances = variances.filter(v =>
    ['Open', 'In Progress', 'Under Appeal'].includes(v.status)
  );

  const resolvedVariances = variances.filter(v => v.status === 'Resolved');

  const totalBilled = variances.reduce((sum, v) => sum + v.billedAmount, 0);
  const totalVariance = variances.reduce((sum, v) => sum + v.varianceAmount, 0);

  const totalAgingDays = openVariances.reduce((sum, v) => sum + (AGING_MIDPOINTS[v.agingBucket] || v.agingDays), 0);
  const avgDaysInAR = openVariances.length > 0 ? Math.round(totalAgingDays / openVariances.length) : 0;

  const cleanClaims = resolvedVariances.filter(v =>
    !['181-365 days', '365+ days'].includes(v.agingBucket)
  );

  const contractualVariances = variances.filter(v => v.rootCauseCategory === 'Contractual Disputes');

  return {
    denialRate: (denialRelated / totalVariances) * 100,
    netCollectionRate: totalBilled > 0 ? ((totalBilled - totalVariance) / totalBilled) * 100 : 0,
    avgDaysInAR,
    cleanClaimRate: (resolvedVariances.length / totalVariances) * 100,
    contractCompliance: 100 - ((contractualVariances.length / totalVariances) * 100)
  };
}

