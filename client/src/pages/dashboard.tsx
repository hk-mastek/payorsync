import { useState, useMemo, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight, 
  ArrowDownRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Lightbulb,
  AlertCircle,
  Users,
  MapPin,
  BarChart3,
  X,
  Loader2,
  WifiOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Line,
  Area,
  AreaChart,
  Cell,
  Legend,
  PieChart,
  Pie
} from "recharts";
import {
  STATES,
  ROOT_CAUSES,
  STATUSES,
} from "@shared/dashboardData";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import {
  useAllVariances,
  useVariances,
  useVarianceDetails,
  groupByPayorType,
  groupByPayorWithType,
  groupByState,
  groupByRootCause,
  groupByAgingBucket,
  getTrendData,
  calculateKPIs,
  calculatePayorScorecards as calculatePayorScorecardsFromVariances,
  calculateOrgMetrics as calculateOrgMetricsFromVariances,
  type VarianceRecord,
  type PayorScorecard,
} from "@/hooks/useVariances";

const COLORS = [
  'hsl(196, 100%, 37%)',
  'hsl(173, 58%, 39%)',
  'hsl(12, 76%, 61%)',
  'hsl(43, 74%, 66%)',
  'hsl(27, 87%, 67%)',
  'hsl(280, 65%, 60%)',
  'hsl(220, 70%, 50%)',
  'hsl(160, 60%, 45%)',
];

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

const ROOT_CAUSE_EXPLANATIONS: Record<string, { title: string; bullets: string[]; actionable: boolean }> = {
  'Authorization Issues': {
    title: 'Prior Authorization - MSP Coordination Issue',
    bullets: [
      'Authorization was likely obtained from wrong payor during 30-month coordination period',
      'Commercial authorization may not have transferred when Medicare became primary',
      'Payor denied claim because auth was issued by secondary instead of current primary',
      'Auth may have expired during the coordination period transition'
    ],
    actionable: true
  },
  'Contractual Disputes': {
    title: 'Contract Rate Mismatch',
    bullets: [
      'Payor applied incorrect fee schedule for the coordination period month',
      'Commercial payor may have used Medicare bundled rates prematurely',
      'Payment reflects post-coordination rates while patient was still in primary period',
      'Fee schedule in payor system may not match executed contract terms'
    ],
    actionable: true
  },
  'Coding Errors': {
    title: 'ESRD Coding Discrepancy',
    bullets: [
      'ESRD coordination modifier (AY, CD, CE) missing or incorrect for period month',
      'Condition code 76 not present to indicate dialysis services',
      'N18.6 diagnosis not sequenced as primary or missing from claim',
      'Place of service code does not match ESRD facility designation'
    ],
    actionable: true
  },
  'Patient Eligibility': {
    title: 'Eligibility - COB During MSP Period',
    bullets: [
      'Payor has incorrect information about primary/secondary status',
      'Coordination of benefits not updated after 30-month transition',
      'Claim billed to Medicare as primary when commercial should still be primary',
      'Patient eligibility file shows wrong coordination period month'
    ],
    actionable: true
  },
  'Medical Necessity': {
    title: 'Medical Necessity - LCD/NCD Requirements',
    bullets: [
      'Documentation does not meet LCD/NCD criteria for dialysis frequency',
      'Physician certification or dialysis prescription not on file',
      'Lab values supporting treatment frequency not documented',
      'Clinical notes insufficient to justify billed services'
    ],
    actionable: true
  },
  'Claim Submission Errors': {
    title: 'Claim Submission - Billing Sequence Issue',
    bullets: [
      'Secondary payor denied because primary EOB/remittance not attached',
      'Claim submitted to Medicare before commercial primary processed',
      'COB information missing or incorrect in claim submission',
      'Duplicate claim flagged due to resubmission during payor transition'
    ],
    actionable: true
  },
  'Timely Filing': {
    title: 'Timely Filing - Deadline Issue',
    bullets: [
      'Claim held pending COB determination exceeded filing deadline',
      'Payor transition delayed submission past timely filing limit',
      'Initial submission to wrong primary caused deadline to pass',
      'Appeal or corrected claim filed after payor deadline expired'
    ],
    actionable: true
  },
  'System/Technical': {
    title: 'Technical - EDI/Clearinghouse Issue',
    bullets: [
      'EDI rejected due to incorrect payer ID during MSP transition',
      'Loop 2300 COB segment formatting error caused rejection',
      'Clearinghouse routing sent claim to wrong payor',
      '999/277CA acknowledgment indicates technical syntax error'
    ],
    actionable: true
  }
};


const PRIORITY_RANK: Record<string, number> = {
  'High': 0,
  'Medium': 1,
  'Low': 2
};

// PayorScorecard, OrgMetrics, and AGING_MIDPOINTS are imported from useVariances

const SCORECARD_THRESHOLDS = {
  denialRate: { green: 5, yellow: 10 },
  netCollectionRate: { green: 96, yellow: 93 },
  daysInAR: { green: 40, yellow: 60 },
  cleanClaimRate: { green: 95, yellow: 90 },
  contractCompliance: { green: 98, yellow: 95 }
};

function getMetricColor(metric: keyof typeof SCORECARD_THRESHOLDS, value: number): string {
  const t = SCORECARD_THRESHOLDS[metric];
  if (metric === 'denialRate' || metric === 'daysInAR') {
    if (value < t.green) return 'text-emerald-600 bg-emerald-50';
    if (value < t.yellow) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  } else {
    if (value > t.green) return 'text-emerald-600 bg-emerald-50';
    if (value > t.yellow) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  }
}

// calculateOverallScore is now in useVariances hook

function getScoreColor(score: string): string {
  if (score.startsWith('A')) return 'text-emerald-600 bg-emerald-100';
  if (score.startsWith('B')) return 'text-blue-600 bg-blue-100';
  if (score.startsWith('C')) return 'text-amber-600 bg-amber-100';
  return 'text-red-600 bg-red-100';
}

// calculateOrgMetrics is now in useVariances hook as calculateOrgMetricsFromVariances

// calculatePayorScorecards is now in useVariances hook as calculatePayorScorecardsFromVariances

function getEDIFormat(rootCauseCategory: string, rootCauseSubcategory: string): { format: string; description: string } {
  if (rootCauseCategory === 'Coding Errors' || rootCauseCategory === 'Claim Submission Errors') {
    return { format: '837', description: 'Corrected Claim Resubmission' };
  }
  if (rootCauseCategory === 'Contractual Disputes' || rootCauseCategory === 'Patient Eligibility') {
    return { format: '837-APPEAL', description: 'Adjustment Request with Supporting Documentation' };
  }
  if (rootCauseCategory === 'Authorization Issues') {
    return { format: '277', description: 'Claim Status Inquiry' };
  }
  if (rootCauseCategory === 'Medical Necessity') {
    return { format: '837-APPEAL', description: 'Reconsideration with Clinical Documentation' };
  }
  return { format: '837', description: 'Corrected Claim' };
}

function generateEDIDraft(variance: VarianceRecord): string {
  const ediFormat = getEDIFormat(variance.rootCauseCategory, variance.rootCauseSubcategory);
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const claimId = variance.id.replace('VAR-', 'CLM-');
  
  if (ediFormat.format === '837') {
    return `ISA*00*          *00*          *ZZ*PAYORSYNC      *ZZ*${variance.payorId.padEnd(15)}*${today}*1200*^*00501*000000001*0*P*:~
GS*HC*PAYORSYNC*${variance.payorId}*${today}*1200*1*X*005010X222A1~
ST*837*0001*005010X222A1~
BHT*0019*00*${claimId}*${today}*1200*CH~
NM1*41*2*PAYORSYNC BILLING*****46*123456789~
NM1*40*2*${variance.payorName.substring(0, 35).toUpperCase()}*****46*${variance.payorId}~
HL*1**20*1~
NM1*85*2*DIALYSIS SERVICES CENTER*****XX*1234567890~
HL*2*1*22*0~
NM1*IL*1*${variance.patientName.split(' ').pop()?.toUpperCase()}*${variance.patientName.split(' ')[0]?.toUpperCase()}****MI*MEM123456~
CLM*${claimId}*${variance.billedAmount.toFixed(2)}***11:B:1*Y*A*Y*Y~
HI*ABK:N189~
LX*1~
SV2*0300*HC:90999*${variance.billedAmount.toFixed(2)}*UN*${variance.treatmentCount}~
DTP*472*D8*${variance.dateOfService.replace(/-/g, '')}~
SE*15*0001~
GE*1*1~
IEA*1*000000001~

--- RESUBMISSION NOTES ---
Original Claim ID: ${variance.id}
Root Cause: ${variance.rootCauseCategory} - ${variance.rootCauseSubcategory}
Variance Amount: $${variance.varianceAmount.toFixed(2)}
Action Required: Correct claim data and resubmit`;
  }
  
  if (ediFormat.format === '837-APPEAL') {
    return `ISA*00*          *00*          *ZZ*PAYORSYNC      *ZZ*${variance.payorId.padEnd(15)}*${today}*1200*^*00501*000000001*0*P*:~
GS*HC*PAYORSYNC*${variance.payorId}*${today}*1200*1*X*005010X222A1~
ST*837*0001*005010X222A1~
BHT*0019*18*${claimId}*${today}*1200*CH~
NM1*41*2*PAYORSYNC BILLING*****46*123456789~
NM1*40*2*${variance.payorName.substring(0, 35).toUpperCase()}*****46*${variance.payorId}~
HL*1**20*1~
NM1*85*2*DIALYSIS SERVICES CENTER*****XX*1234567890~
HL*2*1*22*0~
NM1*IL*1*${variance.patientName.split(' ').pop()?.toUpperCase()}*${variance.patientName.split(' ')[0]?.toUpperCase()}****MI*MEM123456~
CLM*${claimId}*${variance.billedAmount.toFixed(2)}***11:B:1*Y*A*Y*Y~
REF*F8*APPEAL~
NTE*ADD*PAYMENT ADJUSTMENT REQUEST: Original payment of $${variance.paidAmount.toFixed(2)} does not match contracted rate. Requesting additional payment of $${variance.varianceAmount.toFixed(2)} per fee schedule agreement.~
HI*ABK:N189~
LX*1~
SV2*0300*HC:90999*${variance.billedAmount.toFixed(2)}*UN*${variance.treatmentCount}~
DTP*472*D8*${variance.dateOfService.replace(/-/g, '')}~
SE*18*0001~
GE*1*1~
IEA*1*000000001~

--- ADJUSTMENT REQUEST NOTES ---
Original Claim ID: ${variance.id}
Expected Payment: $${variance.billedAmount.toFixed(2)}
Actual Payment: $${variance.paidAmount.toFixed(2)}
Underpayment Amount: $${variance.varianceAmount.toFixed(2)}
Contract Reference: Review fee schedule for ${variance.payorName}

REQUIRED ATTACHMENTS:
1. Copy of executed contract with fee schedule
2. Original remittance advice (835) showing underpayment
3. Claim calculation worksheet demonstrating correct reimbursement`;
  }
  
  // 277 format
  return `ISA*00*          *00*          *ZZ*PAYORSYNC      *ZZ*${variance.payorId.padEnd(15)}*${today}*1200*^*00501*000000001*0*P*:~
GS*HN*PAYORSYNC*${variance.payorId}*${today}*1200*1*X*005010X212~
ST*277*0001*005010X212~
BHT*0085*08*${claimId}*${today}*1200~
HL*1**20*1~
NM1*PR*2*${variance.payorName.substring(0, 35).toUpperCase()}*****PI*${variance.payorId}~
HL*2*1*21*1~
NM1*41*2*DIALYSIS SERVICES CENTER*****46*123456789~
HL*3*2*19*0~
NM1*QC*1*${variance.patientName.split(' ').pop()?.toUpperCase()}*${variance.patientName.split(' ')[0]?.toUpperCase()}****MI*MEM123456~
TRN*2*${claimId}*1234567890~
STC*P3:20*${today}**${variance.billedAmount.toFixed(2)}~
REF*1K*${claimId}~
DTP*472*D8*${variance.dateOfService.replace(/-/g, '')}~
SE*13*0001~
GE*1*1~
IEA*1*000000001~

--- STATUS INQUIRY NOTES ---
Claim ID: ${variance.id}
Issue: ${variance.rootCauseCategory} - ${variance.rootCauseSubcategory}
Authorization Status: Requires verification
Action: Request claim status and authorization details`;
}

function isResubmissionEligible(rootCauseCategory: string): boolean {
  return ['Authorization Issues', 'Contractual Disputes', 'Coding Errors', 'Patient Eligibility', 'Medical Necessity', 'Claim Submission Errors'].includes(rootCauseCategory);
}

interface KPICardProps {
  title: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon: React.ReactNode;
  iconColor: string;
  onClick?: () => void;
  positive?: boolean;
}

function KPICard({ title, value, trend, trendLabel, icon, iconColor, onClick, positive }: KPICardProps) {
  const isPositiveTrend = positive !== undefined ? (positive ? trend > 0 : trend < 0) : trend > 0;
  
  return (
    <Card 
      className={cn("hover:shadow-md transition-all cursor-pointer", onClick && "hover:ring-2 hover:ring-primary/20")}
      onClick={onClick}
      data-testid={`kpi-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", iconColor)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center mt-1">
          <span className={cn("flex items-center mr-1", isPositiveTrend ? "text-emerald-600" : "text-rose-600")}>
            {trend > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
            {Math.abs(trend)}%
          </span>
          {trendLabel}
        </p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isInsightsOpen, setIsInsightsOpen] = useState(true);
  const [selectedPayorType, setSelectedPayorType] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRootCause, setSelectedRootCause] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [detailView, setDetailView] = useState<'payor' | 'state' | 'rootCause' | null>(null);
  const [detailItem, setDetailItem] = useState<string | null>(null);
  const [sunburstSelectedType, setSunburstSelectedType] = useState<string | null>(null);
  const [highlightedState, setHighlightedState] = useState<string | null>(null);
  const [selectedVariance, setSelectedVariance] = useState<VarianceRecord | null>(null);
  const [showResubmissionDraft, setShowResubmissionDraft] = useState(false);
  
  // Fetch variance details from API when a variance is selected
  // Use uuid if available, otherwise use id
  const {
    data: varianceDetails, 
    isLoading: isDetailsLoading 
  } = useVarianceDetails(selectedVariance?.uuid || selectedVariance?.id || null);

  const [sortColumn, setSortColumn] = useState<string>('varianceAmount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [scorecardSortColumn, setScorecardSortColumn] = useState<string>('varianceCount');
  const [scorecardSortDirection, setScorecardSortDirection] = useState<'asc' | 'desc'>('desc');
  const [scorecardPageSize, setScorecardPageSize] = useState(10);
  const [scorecardPage, setScorecardPage] = useState(1);
  const [scorecardPayorTypeFilter, setScorecardPayorTypeFilter] = useState<string>("all");
  const [scorecardSearch, setScorecardSearch] = useState<string>("");
  
  // ===== API DATA FETCHING =====
  // Fetch dashboard summary from external API (http://localhost:8000/api/v1/dashboard/summary)
  const { data: apiData, isLoading: isApiLoading, isError: isApiError, refetch: refetchApi } = useDashboardSummary();
  
  // Fetch ALL variance data from API (for charts/aggregations)
  const {
    data: variancesData, 
    isLoading: isVariancesLoading, 
    isError: isVariancesError, 
    refetch: refetchVariances 
  } = useAllVariances();

  // Fetch PAGINATED variance data for the table (server-side pagination)
  const { 
    data: paginatedVariancesData, 
    isLoading: isPaginatedLoading,
    refetch: refetchPaginatedVariances 
  } = useVariances({
    page: currentPage,
    pageSize: pageSize,
    payorType: selectedPayorType,
    state: selectedState,
    status: selectedStatus,
    rootCause: selectedRootCause,
    search: searchQuery,
    sortColumn: sortColumn,
    sortDirection: sortDirection,
  });

  // Update lastUpdated when API data changes
  useEffect(() => {
    if (apiData || variancesData) {
      setLastUpdated(new Date());
    }
  }, [apiData, variancesData]);

  // All variance data from API (for charts and aggregations)
  const allData = useMemo(() => {
    return variancesData?.variances || [];
  }, [variancesData]);
  
  // Paginated variance data for the table
  const paginatedData = useMemo(() => {
    return paginatedVariancesData?.variances || [];
  }, [paginatedVariancesData]);
  
  // Server-side pagination info
  const totalCount = paginatedVariancesData?.totalCount || 0;
  const totalPages = paginatedVariancesData?.totalPages || 1;
  
  // Check if any data is loading or has errors
  const isLoading = isApiLoading || isVariancesLoading;
  const hasError = isApiError && isVariancesError;
  
  const filteredData = useMemo(() => {
    return allData.filter(v => {
      if (selectedPayorType !== "all" && v.payorType !== selectedPayorType) return false;
      if (selectedState !== "all" && v.state !== selectedState) return false;
      if (selectedStatus !== "all" && v.status !== selectedStatus) return false;
      if (selectedRootCause !== "all" && v.rootCauseCategory !== selectedRootCause) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return v.id.toLowerCase().includes(query) ||
               v.payorName.toLowerCase().includes(query) ||
               v.patientName.toLowerCase().includes(query);
      }
      return true;
    });
  }, [allData, selectedPayorType, selectedState, selectedStatus, selectedRootCause, searchQuery]);
  
  // Separate data source for state chart - applies all filters EXCEPT state filter
  // This ensures the chart always shows all 50 states for comparison
  const stateChartData = useMemo(() => {
    return allData.filter(v => {
      if (selectedPayorType !== "all" && v.payorType !== selectedPayorType) return false;
      if (selectedStatus !== "all" && v.status !== selectedStatus) return false;
      if (selectedRootCause !== "all" && v.rootCauseCategory !== selectedRootCause) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return v.id.toLowerCase().includes(query) ||
               v.payorName.toLowerCase().includes(query) ||
               v.patientName.toLowerCase().includes(query);
      }
      return true;
    });
  }, [allData, selectedPayorType, selectedStatus, selectedRootCause, searchQuery]);
  
  // ===== KPIs: API DATA =====
  const rawKpis = useMemo(() => calculateKPIs(filteredData), [filteredData]);
  const kpis = useMemo(() => {
    if (apiData?.kpis) {
      return apiData.kpis;
    }
    // Use calculated KPIs from variance data
    return {
      totalOpenVariances: rawKpis.totalOpenVariances,
      totalVarianceAmount: rawKpis.totalVarianceAmount,
      newThisWeek: rawKpis.newThisWeek,
      resolvedThisWeek: rawKpis.resolvedThisWeek,
      avgDaysToResolution: rawKpis.avgDaysToResolution,
      recoveryRate: rawKpis.recoveryRate,
    };
  }, [apiData, rawKpis]);

  // ===== PAYOR TYPE DATA: API DATA =====
  const rawPayorTypeData = useMemo(() => groupByPayorType(filteredData), [filteredData]);
  const payorTypeData = useMemo(() => {
    if (apiData?.payorTypeData) {
      return apiData.payorTypeData;
    }
    // Use calculated data from variances
    return rawPayorTypeData;
  }, [apiData, rawPayorTypeData]);

  // Sunburst data for payor distribution chart
  const rawSunburstData = useMemo(() => groupByPayorWithType(filteredData), [filteredData]);
  const sunburstInnerData = useMemo(() => {
    // Use API payor type data for inner ring if available
    if (apiData?.payorTypeData) {
      return apiData.payorTypeData.map((t, idx) => ({
        name: t.type,
        value: t.amount,
        count: t.count,
        fill: COLORS[idx % COLORS.length],
      }));
    }
    // Use calculated data from variances
    return rawSunburstData.map((t, idx) => ({
      name: t.type,
      value: t.amount,
      count: t.count,
      fill: COLORS[idx % COLORS.length],
    }));
  }, [apiData, rawSunburstData]);

  // Outer ring uses variance data (individual payors)
  const sunburstOuterData = useMemo(() => {
    if (!sunburstSelectedType) return [];
    const selectedTypeData = rawSunburstData.find(t => t.type === sunburstSelectedType);
    if (!selectedTypeData) return [];
    return selectedTypeData.payors.slice(0, 10).map((p, idx) => ({
      name: p.name,
      value: p.amount,
      count: p.count,
      fill: `hsl(${196 + idx * 15}, ${70 - idx * 3}%, ${40 + idx * 4}%)`,
    }));
  }, [rawSunburstData, sunburstSelectedType]);

  // ===== STATE DATA: API DATA =====
  const rawStateData = useMemo(() => groupByState(stateChartData), [stateChartData]);
  const stateData = useMemo(() => {
    if (apiData?.stateData) {
      return apiData.stateData.sort((a, b) => b.amount - a.amount);
    }
    // Use calculated data from variances
    return rawStateData.sort((a, b) => b.amount - a.amount);
  }, [apiData, rawStateData]);

  // Clear highlighted state if it's no longer in the filtered data
  useEffect(() => {
    if (highlightedState && !stateData.some(s => s.state === highlightedState)) {
      setHighlightedState(null);
    }
  }, [stateData, highlightedState]);

  // ===== ROOT CAUSE DATA: API DATA =====
  const rawRootCauseData = useMemo(() => groupByRootCause(filteredData), [filteredData]);
  const rootCauseData = useMemo(() => {
    if (apiData?.rootCauseData) {
      return apiData.rootCauseData;
    }
    // Use calculated data from variances
    return rawRootCauseData;
  }, [apiData, rawRootCauseData]);

  // ===== AGING DATA: API DATA =====
  const rawAgingData = useMemo(() => groupByAgingBucket(filteredData), [filteredData]);
  const agingData = useMemo(() => {
    if (apiData?.agingData) {
      return apiData.agingData;
    }
    // Use calculated data from variances
    return rawAgingData;
  }, [apiData, rawAgingData]);

  // ===== TREND DATA: From variance data =====
  const rawTrendData = useMemo(() => getTrendData(allData), [allData]);
  const trendData = useMemo(() => rawTrendData, [rawTrendData]);

  // Note: sortedData and paginatedData are now handled by server-side pagination
  // The paginatedData comes directly from useVariances hook above

  const orgMetrics = useMemo(() => calculateOrgMetricsFromVariances(allData), [allData]);
  
  // ===== PAYOR SCORECARDS: API DATA =====
  const generatedPayorScorecards = useMemo(() => calculatePayorScorecardsFromVariances(allData), [allData]);
  const allPayorScorecards = useMemo(() => {
    if (apiData?.payorScorecards) {
      return apiData.payorScorecards;
    }
    // Use calculated data from variances
    return generatedPayorScorecards;
  }, [apiData, generatedPayorScorecards]);
  
  const filteredScorecards = useMemo(() => {
    return allPayorScorecards.filter(s => {
      if (scorecardPayorTypeFilter !== "all" && s.payorType !== scorecardPayorTypeFilter) return false;
      if (scorecardSearch) {
        return s.payorName.toLowerCase().includes(scorecardSearch.toLowerCase());
      }
      return true;
    });
  }, [allPayorScorecards, scorecardPayorTypeFilter, scorecardSearch]);
  
  const payorScorecards = useMemo(() => {
    return [...filteredScorecards].sort((a, b) => {
      let aVal: any = a[scorecardSortColumn as keyof PayorScorecard];
      let bVal: any = b[scorecardSortColumn as keyof PayorScorecard];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return scorecardSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return scorecardSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredScorecards, scorecardSortColumn, scorecardSortDirection]);
  
  const paginatedScorecards = useMemo(() => {
    const start = (scorecardPage - 1) * scorecardPageSize;
    return payorScorecards.slice(start, start + scorecardPageSize);
  }, [payorScorecards, scorecardPage, scorecardPageSize]);
  
  const scorecardTotalPages = Math.ceil(payorScorecards.length / scorecardPageSize);
  
  const scorecardPayorTypes = useMemo(() => {
    const types = new Set(allPayorScorecards.map(s => s.payorType));
    return Array.from(types).sort();
  }, [allPayorScorecards]);
  
  // Handle refresh with API refetch
  const handleRefresh = useCallback(() => {
    refetchApi();
    refetchVariances();
    refetchPaginatedVariances();
    setLastUpdated(new Date());
  }, [refetchApi, refetchVariances, refetchPaginatedVariances]);

  const clearFilters = () => {
    setSelectedPayorType("all");
    setSelectedState("all");
    setSelectedStatus("all");
    setSelectedRootCause("all");
    setSearchQuery("");
    setHighlightedState(null);
  };
  
  const hasActiveFilters = selectedPayorType !== "all" || selectedState !== "all" || 
    selectedStatus !== "all" || selectedRootCause !== "all" || searchQuery !== "";

  const treemapData = rootCauseData.map(rc => ({
    name: rc.category,
    size: rc.amount,
    count: rc.count,
    children: rc.subcategories.map(sub => ({
      name: sub.name,
      size: sub.amount,
      count: sub.count,
    })),
  }));

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Executive Payment Variance Dashboard</h1>
            <p className="text-muted-foreground mt-1">ESRD Revenue Cycle Performance Overview</p>
          </div>
          <div className="flex items-center gap-3">
            {/* API Status Indicator */}
            {isLoading && (
              <Badge variant="outline" className="gap-1 text-blue-600 border-blue-200 bg-blue-50">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </Badge>
            )}
            {hasError && (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50" title="API unavailable">
                <WifiOff className="h-3 w-3" />
                Offline Mode
              </Badge>
            )}
            {!isLoading && !hasError && (apiData || variancesData) && (
              <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50">
                <CheckCircle className="h-3 w-3" />
                Live
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} data-testid="button-refresh">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-export">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Collapsible open={isInsightsOpen} onOpenChange={setIsInsightsOpen}>
          <Card className="border-l-4 border-l-primary">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <CardTitle>AI-Generated Executive Insights</CardTitle>
                    {apiData?.aiInsights && (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">Live</Badge>
                    )}
                  </div>
                  {isInsightsOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {isLoading ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6"> {/* Key Insights */} <div> <h4 className="font-semibold flex items-center gap-2 mb-3"> <BarChart3 className="h-4 w-4 text-blue-500" /> Key Insights This Week </h4> <div className="space-y-2 text-sm text-muted-foreground"> {apiData?.aiInsights?.keyInsights && apiData.aiInsights.keyInsights .split(/[\n•]/) .filter((line) => line.trim()) .map((insight, idx) => ( <p key={idx}> • {insight.trim().replace(/^[-•]\s*/, "")} </p> ))} </div> </div> {/* Action Required */} <div> <h4 className="font-semibold flex items-center gap-2 mb-3"> <AlertCircle className="h-4 w-4 text-amber-500" /> Action Required </h4> <div className="space-y-2 text-sm"> {apiData?.aiInsights?.actionRequired && apiData.aiInsights.actionRequired .split(/[\n•]/) .filter((line) => line.trim()) .map((action, idx) => ( <p key={idx} className={idx < 2 ? "text-amber-600" : "text-rose-600"} > • {action.trim().replace(/^[-•]\s*/, "")} </p> ))} </div> </div> {/* Positive Trends */} <div> <h4 className="font-semibold flex items-center gap-2 mb-3"> <TrendingUp className="h-4 w-4 text-emerald-500" /> Positive Trends </h4> <div className="space-y-2 text-sm"> {apiData?.aiInsights?.positiveTrends && apiData.aiInsights.positiveTrends .split(/[\n•]/) .filter((line) => line.trim()) .map((trend, idx) => ( <p key={idx} className="text-emerald-600"> • {trend.trim().replace(/^[-•]\s*/, "")} </p> ))} </div> </div> </div>                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <KPICard
            title="Total Open Variances"
            value={formatNumber(kpis.totalOpenVariances)}
            trend={4.2}
            trendLabel="vs prior week"
            icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
            iconColor="bg-amber-100"
            positive={false}
          />
          <KPICard
            title="Total Variance Amount"
            value={formatCurrency(kpis.totalVarianceAmount)}
            trend={-2.1}
            trendLabel="vs prior week"
            icon={<DollarSign className="h-4 w-4 text-rose-600" />}
            iconColor="bg-rose-100"
            positive={false}
          />
          <KPICard
            title="New This Week"
            value={formatNumber(kpis.newThisWeek)}
            trend={12.5}
            trendLabel="vs prior week"
            icon={<FileText className="h-4 w-4 text-blue-600" />}
            iconColor="bg-blue-100"
            positive={false}
          />
          <KPICard
            title="Resolved This Week"
            value={formatNumber(kpis.resolvedThisWeek)}
            trend={8.3}
            trendLabel="vs prior week"
            icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
            iconColor="bg-emerald-100"
            positive={true}
          />
          <KPICard
            title="Avg Days to Resolution"
            value={`${kpis.avgDaysToResolution} days`}
            trend={-5.2}
            trendLabel="vs prior month"
            icon={<Clock className="h-4 w-4 text-purple-600" />}
            iconColor="bg-purple-100"
            positive={false}
          />
          <KPICard
            title="Recovery Rate"
            value={`${kpis.recoveryRate}%`}
            trend={3.2}
            trendLabel="vs prior month"
            icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
            iconColor="bg-emerald-100"
            positive={true}
          />
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={selectedPayorType} onValueChange={(v) => { setSelectedPayorType(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]" data-testid="filter-payor-type">
                <SelectValue placeholder="Payor Type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Payor Types</SelectItem>
                <SelectItem value="Medicare Traditional">Medicare Traditional</SelectItem>
                <SelectItem value="Medicare Advantage">Medicare Advantage</SelectItem>
                <SelectItem value="Medicaid">Medicaid</SelectItem>
                <SelectItem value="Medicaid Managed Care">Medicaid Managed Care</SelectItem>
                <SelectItem value="Commercial PPO">Commercial PPO</SelectItem>
                <SelectItem value="Commercial HMO">Commercial HMO</SelectItem>
                <SelectItem value="Commercial EPO">Commercial EPO</SelectItem>
                <SelectItem value="VA">VA</SelectItem>
                <SelectItem value="TRICARE">TRICARE</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedState} onValueChange={(v) => { setSelectedState(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]" data-testid="filter-state">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All States</SelectItem>
                {STATES.map(s => (
                  <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px]" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedRootCause} onValueChange={(v) => { setSelectedRootCause(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]" data-testid="filter-root-cause">
                <SelectValue placeholder="Root Cause" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Root Causes</SelectItem>
                {ROOT_CAUSES.map(rc => (
                  <SelectItem key={rc.category} value={rc.category}>{rc.category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Search ID, Payor, Patient..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-[200px]"
              data-testid="input-search"
            />
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1" data-testid="button-clear-filters">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
            
            <div className="ml-auto text-sm text-muted-foreground">
              Showing {formatNumber(filteredData.length)} of {formatNumber(allData.length)} variances
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Variance by State
              </CardTitle>
              <CardDescription>
                Click a bar to highlight • Click outside to clear
                {highlightedState && (
                  <Badge variant="secondary" className="ml-2">{highlightedState}</Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div 
                  style={{ height: `${stateData.length * 28}px`, minHeight: '400px' }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest('.recharts-bar-rectangle') && highlightedState) {
                      setHighlightedState(null);
                      setSelectedState("all");
                    }
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stateData} layout="vertical" margin={{ left: 40, right: 20, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => formatCurrency(value)}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="state" 
                        tick={{ fontSize: 11 }}
                        width={35}
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number, name: string) => [formatCurrency(value), 'Variance Amount']}
                        labelFormatter={(label) => {
                          const state = stateData.find(s => s.state === label);
                          return state ? `${state.stateName} (${state.count} variances)` : label;
                        }}
                      />
                      <Bar 
                        dataKey="amount" 
                        radius={[0, 4, 4, 0]}
                        cursor="pointer"
                        onClick={(data, index, e) => {
                          e?.stopPropagation();
                          if (highlightedState === data.state) {
                            setHighlightedState(null);
                            setSelectedState("all");
                          } else {
                            setHighlightedState(data.state);
                            setSelectedState(data.state);
                          }
                        }}
                      >
                        {stateData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={highlightedState === entry.state ? '#0284c7' : '#3b82f6'}
                            opacity={!highlightedState || highlightedState === entry.state ? 1 : 0.25}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Payor Distribution
              {(selectedState !== "all" || selectedStatus !== "all" || selectedRootCause !== "all") && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({[
                    selectedState !== "all" && selectedState,
                    selectedStatus !== "all" && selectedStatus,
                    selectedRootCause !== "all" && selectedRootCause
                  ].filter(Boolean).join(", ")})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Click a segment to drill down into individual payors
              {sunburstSelectedType && (
                <Badge variant="secondary" className="ml-2">{sunburstSelectedType}</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sunburstInnerData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={sunburstSelectedType ? 80 : 120}
                    paddingAngle={1}
                    onClick={(data) => {
                      if (sunburstSelectedType === data.name) {
                        setSunburstSelectedType(null);
                      } else {
                        setSunburstSelectedType(data.name);
                      }
                    }}
                    cursor="pointer"
                  >
                    {sunburstInnerData.map((entry, index) => (
                      <Cell 
                        key={`inner-${index}`} 
                        fill={entry.fill}
                        opacity={sunburstSelectedType && sunburstSelectedType !== entry.name ? 0.3 : 1}
                        stroke={sunburstSelectedType === entry.name ? '#000' : 'none'}
                        strokeWidth={sunburstSelectedType === entry.name ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  {sunburstSelectedType && sunburstOuterData.length > 0 && (
                    <Pie
                      data={sunburstOuterData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={160}
                      paddingAngle={1}
                      label={({ name, percent }) => `${name.length > 20 ? name.substring(0, 20) + '...' : name}`}
                      labelLine={{ stroke: '#666', strokeWidth: 1 }}
                    >
                      {sunburstOuterData.map((entry, index) => (
                        <Cell key={`outer-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  )}
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number, name: string, props: any) => [
                      `${formatCurrency(value)} (${props.payload.count.toLocaleString()} variances)`,
                      name
                    ]}
                  />
                  {!sunburstSelectedType && (
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
            </div>
            {sunburstSelectedType && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSunburstSelectedType(null)}
                  data-testid="button-payor-reset"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payor Performance Scorecard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Payor Performance Scorecard
            </CardTitle>
            <CardDescription>
              Key performance metrics by payor calculated from variance data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-muted-foreground mb-1">Avg Denial Rate</div>
                  <div className={cn("text-2xl font-bold", getMetricColor('denialRate', orgMetrics.denialRate).split(' ')[0])}>
                    {orgMetrics.denialRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Benchmark: &lt;5%</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-muted-foreground mb-1">Net Collection Rate</div>
                  <div className={cn("text-2xl font-bold", getMetricColor('netCollectionRate', orgMetrics.netCollectionRate).split(' ')[0])}>
                    {orgMetrics.netCollectionRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Benchmark: &gt;96%</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-muted-foreground mb-1">Avg Days in A/R</div>
                  <div className={cn("text-2xl font-bold", getMetricColor('daysInAR', orgMetrics.avgDaysInAR).split(' ')[0])}>
                    {orgMetrics.avgDaysInAR}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Benchmark: &lt;40 days</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-muted-foreground mb-1">Clean Claim Rate</div>
                  <div className={cn("text-2xl font-bold", getMetricColor('cleanClaimRate', orgMetrics.cleanClaimRate).split(' ')[0])}>
                    {orgMetrics.cleanClaimRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Benchmark: &gt;95%</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-muted-foreground mb-1">Contract Compliance</div>
                  <div className={cn("text-2xl font-bold", getMetricColor('contractCompliance', orgMetrics.contractCompliance).split(' ')[0])}>
                    {orgMetrics.contractCompliance.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Benchmark: &gt;98%</div>
                </CardContent>
              </Card>
            </div>

            {/* Payor Scorecard Table */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={scorecardPayorTypeFilter} onValueChange={(v) => { setScorecardPayorTypeFilter(v); setScorecardPage(1); }}>
                    <SelectTrigger className="w-[180px]" data-testid="scorecard-payor-type-filter">
                      <SelectValue placeholder="All Payor Types" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Payor Types</SelectItem>
                      {scorecardPayorTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Search payors..."
                  value={scorecardSearch}
                  onChange={(e) => { setScorecardSearch(e.target.value); setScorecardPage(1); }}
                  className="w-[200px]"
                  data-testid="scorecard-search-input"
                />
                {(scorecardPayorTypeFilter !== "all" || scorecardSearch) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => { setScorecardPayorTypeFilter("all"); setScorecardSearch(""); setScorecardPage(1); }}
                    data-testid="scorecard-clear-filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
                <div className="flex-1" />
                <div className="text-sm text-muted-foreground">
                  {payorScorecards.length} payors • Page {scorecardPage} of {Math.max(1, scorecardTotalPages)}
                </div>
                <Select value={String(scorecardPageSize)} onValueChange={(v) => { setScorecardPageSize(Number(v)); setScorecardPage(1); }}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="10">10 rows</SelectItem>
                    <SelectItem value="25">25 rows</SelectItem>
                    <SelectItem value="50">50 rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ScrollArea className="h-[400px]">
                <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (scorecardSortColumn === 'payorName') {
                            setScorecardSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                          } else {
                            setScorecardSortColumn('payorName');
                            setScorecardSortDirection('asc');
                          }
                          setScorecardPage(1);
                        }}
                      >
                        <div className="flex items-center gap-1">
                          Payor
                          {scorecardSortColumn === 'payorName' ? (scorecardSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                        </div>
                      </TableHead>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead 
                        className="text-right w-[80px] cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (scorecardSortColumn === 'varianceCount') {
                            setScorecardSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                          } else {
                            setScorecardSortColumn('varianceCount');
                            setScorecardSortDirection('desc');
                          }
                          setScorecardPage(1);
                        }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-end gap-1">
                              Variances
                              {scorecardSortColumn === 'varianceCount' ? (scorecardSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Total number of payment variances identified for this payor</p></TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead 
                        className="text-center w-[90px] cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (scorecardSortColumn === 'denialRate') {
                            setScorecardSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                          } else {
                            setScorecardSortColumn('denialRate');
                            setScorecardSortDirection('asc');
                          }
                          setScorecardPage(1);
                        }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-1">
                              Denial %
                              {scorecardSortColumn === 'denialRate' ? (scorecardSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>% of variances from Authorization Issues, Medical Necessity, or Coding Errors. Lower is better (&lt;5% target)</p></TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead 
                        className="text-center w-[90px] cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (scorecardSortColumn === 'netCollectionRate') {
                            setScorecardSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                          } else {
                            setScorecardSortColumn('netCollectionRate');
                            setScorecardSortDirection('desc');
                          }
                          setScorecardPage(1);
                        }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-1">
                              Net Coll %
                              {scorecardSortColumn === 'netCollectionRate' ? (scorecardSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>(Billed - Variance) / Billed. Higher is better (&gt;96% target)</p></TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead 
                        className="text-center w-[80px] cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (scorecardSortColumn === 'daysInAR') {
                            setScorecardSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                          } else {
                            setScorecardSortColumn('daysInAR');
                            setScorecardSortDirection('asc');
                          }
                          setScorecardPage(1);
                        }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-1">
                              Days A/R
                              {scorecardSortColumn === 'daysInAR' ? (scorecardSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Average aging days for open variances. Lower is better (&lt;40 days target)</p></TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead 
                        className="text-center w-[90px] cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (scorecardSortColumn === 'cleanClaimRate') {
                            setScorecardSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                          } else {
                            setScorecardSortColumn('cleanClaimRate');
                            setScorecardSortDirection('desc');
                          }
                          setScorecardPage(1);
                        }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-1">
                              Clean %
                              {scorecardSortColumn === 'cleanClaimRate' ? (scorecardSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>% of variances resolved within 180 days. Higher is better (&gt;95% target)</p></TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead 
                        className="text-center w-[90px] cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (scorecardSortColumn === 'contractCompliance') {
                            setScorecardSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                          } else {
                            setScorecardSortColumn('contractCompliance');
                            setScorecardSortDirection('desc');
                          }
                          setScorecardPage(1);
                        }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-1">
                              Contract %
                              {scorecardSortColumn === 'contractCompliance' ? (scorecardSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>100% minus contractual dispute rate. Higher is better (&gt;98% target)</p></TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead 
                        className="text-right w-[100px] cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (scorecardSortColumn === 'writeOffAmount') {
                            setScorecardSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                          } else {
                            setScorecardSortColumn('writeOffAmount');
                            setScorecardSortDirection('desc');
                          }
                          setScorecardPage(1);
                        }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-end gap-1">
                              Write-Offs
                              {scorecardSortColumn === 'writeOffAmount' ? (scorecardSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Total variance amount written off as uncollectable</p></TooltipContent>
                        </Tooltip>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedScorecards.map((payor) => (
                      <TableRow 
                        key={payor.payorName}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedPayorType("all");
                          setSearchQuery(payor.payorName);
                          setCurrentPage(1);
                        }}
                        data-testid={`scorecard-row-${payor.payorName.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <TableCell className="font-medium max-w-[200px] truncate" title={payor.payorName}>
                          {payor.payorName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {payor.payorType.replace('Commercial ', '').replace('Medicare ', 'MA-').substring(0, 12)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{payor.varianceCount}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getMetricColor('denialRate', payor.denialRate))}>
                            {payor.denialRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getMetricColor('netCollectionRate', payor.netCollectionRate))}>
                            {payor.netCollectionRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getMetricColor('daysInAR', payor.daysInAR))}>
                            {payor.daysInAR}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getMetricColor('cleanClaimRate', payor.cleanClaimRate))}>
                            {payor.cleanClaimRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getMetricColor('contractCompliance', payor.contractCompliance))}>
                            {payor.contractCompliance.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(payor.writeOffAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </TooltipProvider>
              </ScrollArea>
              {scorecardTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScorecardPage(p => Math.max(1, p - 1))}
                    disabled={scorecardPage === 1}
                    data-testid="scorecard-prev-page"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {scorecardPage} of {scorecardTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScorecardPage(p => Math.min(scorecardTotalPages, p + 1))}
                    disabled={scorecardPage === scorecardTotalPages}
                    data-testid="scorecard-next-page"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Root Cause Analysis
                {(selectedPayorType !== "all" || selectedState !== "all" || selectedStatus !== "all") && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({[
                      selectedPayorType !== "all" && selectedPayorType,
                      selectedState !== "all" && selectedState,
                      selectedStatus !== "all" && selectedStatus
                    ].filter(Boolean).join(", ")})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Click a segment to filter • Click outside to clear
                {selectedRootCause !== "all" && (
                  <Badge variant="secondary" className="ml-2">{selectedRootCause}</Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="h-[300px]"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.closest('.recharts-pie-sector') && selectedRootCause !== "all") {
                    setSelectedRootCause("all");
                  }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rootCauseData}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={40}
                      paddingAngle={2}
                      onClick={(data, index, e) => {
                        e?.stopPropagation();
                        if (selectedRootCause === data.category) {
                          setSelectedRootCause("all");
                        } else {
                          setSelectedRootCause(data.category);
                        }
                      }}
                      cursor="pointer"
                    >
                      {rootCauseData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke={selectedRootCause === entry.category ? 'hsl(var(--foreground))' : 'none'}
                          strokeWidth={selectedRootCause === entry.category ? 3 : 0}
                          opacity={selectedRootCause === "all" || selectedRootCause === entry.category ? 1 : 0.4}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => [formatCurrency(value), 'Variance']}
                    />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      formatter={(value) => <span className="text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aging Analysis</CardTitle>
              <CardDescription>Variance amount by age bucket</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agingData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="bucket" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10} 
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11} 
                      tickFormatter={(v) => formatCurrency(v)}
                      width={60}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {agingData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index < 2 ? 'hsl(173, 58%, 39%)' : index < 4 ? 'hsl(43, 74%, 66%)' : 'hsl(12, 76%, 61%)'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>12-Month Trend Analysis</CardTitle>
            <CardDescription>New vs resolved variances and cumulative open amount over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(12, 76%, 61%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(12, 76%, 61%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(173, 58%, 39%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="new" 
                    stroke="hsl(12, 76%, 61%)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorNew)" 
                    name="New Variances" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="hsl(173, 58%, 39%)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorResolved)" 
                    name="Resolved" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Net Change"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Variance Details
                  {isPaginatedLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {(selectedPayorType !== "all" || selectedState !== "all" || selectedStatus !== "all" || selectedRootCause !== "all") && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({[
                        selectedPayorType !== "all" && selectedPayorType,
                        selectedState !== "all" && selectedState,
                        selectedStatus !== "all" && selectedStatus,
                        selectedRootCause !== "all" && selectedRootCause
                      ].filter(Boolean).join(", ")})
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {formatNumber(totalCount)} variances • Page {currentPage} of {totalPages}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="25">25 rows</SelectItem>
                    <SelectItem value="50">50 rows</SelectItem>
                    <SelectItem value="100">100 rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="w-[100px] cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (sortColumn === 'id') {
                          setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('id');
                          setSortDirection('asc');
                        }
                        setCurrentPage(1);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        ID
                        {sortColumn === 'id' ? (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (sortColumn === 'payorName') {
                          setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('payorName');
                          setSortDirection('asc');
                        }
                        setCurrentPage(1);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Payor
                        {sortColumn === 'payorName' ? (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-[60px] cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (sortColumn === 'state') {
                          setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('state');
                          setSortDirection('asc');
                        }
                        setCurrentPage(1);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        State
                        {sortColumn === 'state' ? (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (sortColumn === 'rootCauseCategory') {
                          setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('rootCauseCategory');
                          setSortDirection('asc');
                        }
                        setCurrentPage(1);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Root Cause
                        {sortColumn === 'rootCauseCategory' ? (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (sortColumn === 'billedAmount') {
                          setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('billedAmount');
                          setSortDirection('desc');
                        }
                        setCurrentPage(1);
                      }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Billed
                        {sortColumn === 'billedAmount' ? (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (sortColumn === 'varianceAmount') {
                          setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('varianceAmount');
                          setSortDirection('desc');
                        }
                        setCurrentPage(1);
                      }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Variance
                        {sortColumn === 'varianceAmount' ? (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-[80px] cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (sortColumn === 'agingDays') {
                          setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('agingDays');
                          setSortDirection('desc');
                        }
                        setCurrentPage(1);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Age
                        {sortColumn === 'agingDays' ? (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-[100px] cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (sortColumn === 'status') {
                          setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('status');
                          setSortDirection('asc');
                        }
                        setCurrentPage(1);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortColumn === 'status' ? (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-[70px] cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (sortColumn === 'priority') {
                          setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('priority');
                          setSortDirection('asc');
                        }
                        setCurrentPage(1);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Priority
                        {sortColumn === 'priority' ? (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (sortColumn === 'patientName') {
                          setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('patientName');
                          setSortDirection('asc');
                        }
                        setCurrentPage(1);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Patient
                        {sortColumn === 'patientName' ? (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row) => (
                    <TableRow 
                      key={row.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => { setSelectedVariance(row); setShowResubmissionDraft(false); }}
                      data-testid={`variance-row-${row.variance_id || row.id}`}
                    >
                      <TableCell className="font-mono text-xs">{row.variance_id || row.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[200px]">{row.payorName}</span>
                          <span className="text-xs text-muted-foreground">{row.payorType}</span>
                        </div>
                      </TableCell>
                      <TableCell>{row.state}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{row.rootCauseCategory}</span>
                          <span className="text-xs text-muted-foreground">{row.rootCauseSubcategory}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">${row.billedAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-rose-600">-${row.varianceAmount.toFixed(2)}</TableCell>
                      <TableCell className={cn(
                        "font-medium",
                        row.agingDays > 120 ? "text-rose-600" : 
                        row.agingDays > 60 ? "text-amber-600" : "text-muted-foreground"
                      )}>
                        {row.agingDays}d
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-xs relative pl-4",
                          row.status === 'Resolved' && "bg-emerald-100 text-emerald-700 border-emerald-300",
                          row.status === 'Written Off' && "bg-gray-100 text-gray-600 border-gray-300",
                          row.status === 'Open' && "bg-blue-50 text-blue-700 border-blue-300",
                          row.status === 'In Progress' && "bg-amber-50 text-amber-700 border-amber-300",
                          row.status === 'Under Appeal' && "bg-purple-50 text-purple-700 border-purple-300"
                        )}>
                          <span className={cn(
                            "absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                            row.status === 'Resolved' && "bg-emerald-500",
                            row.status === 'Written Off' && "bg-gray-400",
                            row.status === 'Open' && "bg-blue-500",
                            row.status === 'In Progress' && "bg-amber-500",
                            row.status === 'Under Appeal' && "bg-purple-500"
                          )} />
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.status === 'Resolved' ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Badge variant="outline" className={cn(
                            "text-xs relative pl-4",
                            row.priority === 'High' && "border-rose-500 text-rose-600 bg-rose-50",
                            row.priority === 'Medium' && "border-amber-500 text-amber-600 bg-amber-50",
                            row.priority === 'Low' && "border-gray-400 text-gray-500 bg-gray-50"
                          )}>
                            <span className={cn(
                              "absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                              row.priority === 'High' && "bg-rose-500",
                              row.priority === 'Medium' && "bg-amber-500",
                              row.priority === 'Low' && "bg-gray-400"
                            )} />
                            {row.priority}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{row.patientName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {formatNumber(totalCount)}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isPaginatedLoading}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                        disabled={isPaginatedLoading}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isPaginatedLoading}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Sheet open={!!selectedVariance} onOpenChange={(open) => { if (!open) { setSelectedVariance(null); setShowResubmissionDraft(false); } }}>
        <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
          {selectedVariance && (
            <>
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Variance Details
                  {isDetailsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </SheetTitle>
                <SheetDescription>
                  {selectedVariance.variance_id || selectedVariance.id} - {selectedVariance.payorName}
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 py-6">
                {/* Use API data if available, fallback to selected variance data */}
                {(() => {
                  const displayVariance = varianceDetails?.variance || selectedVariance;
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Patient</p>
                          <p className="font-medium">{displayVariance.patientName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Date of Service</p>
                          <p className="font-medium">{displayVariance.dateOfService}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Billed Amount</p>
                          <p className="font-medium">${displayVariance.billedAmount?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Paid Amount</p>
                          <p className="font-medium">${displayVariance.paidAmount?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Variance</p>
                          <p className="font-medium text-rose-600">-${displayVariance.varianceAmount?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Aging</p>
                          <p className={cn(
                            "font-medium",
                            (displayVariance.agingDays || 0) > 120 ? "text-rose-600" :
                            (displayVariance.agingDays || 0) > 60 ? "text-amber-600" : ""
                          )}>{displayVariance.agingDays || 0} days</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Payor Type</p>
                          <p className="font-medium">{displayVariance.payorType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">State</p>
                          <p className="font-medium">{displayVariance.stateName || displayVariance.state}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <Badge variant="outline" className={cn(
                            "relative pl-4",
                            displayVariance.status === 'Resolved' && "bg-emerald-100 text-emerald-700 border-emerald-300",
                            displayVariance.status === 'Written Off' && "bg-gray-100 text-gray-600 border-gray-300",
                            displayVariance.status === 'Open' && "bg-blue-50 text-blue-700 border-blue-300",
                            displayVariance.status === 'In Progress' && "bg-amber-50 text-amber-700 border-amber-300",
                            displayVariance.status === 'Under Appeal' && "bg-purple-50 text-purple-700 border-purple-300"
                          )}>
                            <span className={cn(
                              "absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                              displayVariance.status === 'Resolved' && "bg-emerald-500",
                              displayVariance.status === 'Written Off' && "bg-gray-400",
                              displayVariance.status === 'Open' && "bg-blue-500",
                              displayVariance.status === 'In Progress' && "bg-amber-500",
                              displayVariance.status === 'Under Appeal' && "bg-purple-500"
                            )} />
                            {displayVariance.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Treatment Count</p>
                          <p className="font-medium">{displayVariance.treatmentCount || 1}</p>
                        </div>
                      </div>

                      {/* Show claim dates */}
                      <div className="space-y-2 pt-2 border-t">
                        <h4 className="font-semibold text-sm">Claim Timeline</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Claim Submission Date</p>
                            <p className="font-medium">{displayVariance.claimSubmissionDate || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Variance Identified Date</p>
                            <p className="font-medium">{displayVariance.varianceIdentifiedDate || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Show notes from API if available */}
                {varianceDetails?.notes && varianceDetails.notes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="font-semibold text-sm">Notes</h4>
                    <div className="space-y-1">
                      {varianceDetails.notes.map((note, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">• {note}</p>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show history from API if available */}
                {varianceDetails?.history && varianceDetails.history.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="font-semibold text-sm">Activity History</h4>
                    <div className="space-y-2">
                      {varianceDetails.history.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">{entry.date}</span>
                          <span className="font-medium">{entry.action}</span>
                          <span className="text-muted-foreground">{entry.user}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show related claims from API if available */}
                {varianceDetails?.relatedClaims && varianceDetails.relatedClaims.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="font-semibold text-sm">Related Claims</h4>
                    <div className="space-y-2">
                      {varianceDetails.relatedClaims.map((claim, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                          <span className="font-mono">{claim.claimId}</span>
                          <span className="text-muted-foreground">{claim.date}</span>
                          <span className="font-medium">${claim.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Root Cause Analysis
                  </h4>
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{selectedVariance.rootCauseCategory}</Badge>
                        <span className="text-sm text-muted-foreground">{selectedVariance.rootCauseSubcategory}</span>
                      </div>
                      <p className="text-sm font-medium mb-2">
                        {ROOT_CAUSE_EXPLANATIONS[selectedVariance.rootCauseCategory]?.title || selectedVariance.rootCauseCategory}
                      </p>
                      <ul className="text-sm space-y-1">
                        {ROOT_CAUSE_EXPLANATIONS[selectedVariance.rootCauseCategory]?.bullets?.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-muted-foreground">{bullet}</span>
                          </li>
                        )) || (
                          <li className="text-muted-foreground">Further investigation required</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                {selectedVariance.status !== 'Resolved' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Priority Assessment
                      {isDetailsLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </h4>
                    {(() => {
                      // Use data from variance details API if available
                      const displayVariance = varianceDetails?.variance || selectedVariance;
                      const highPriorityNotes = displayVariance.highPriorityNotes;
                      const displayPriority = displayVariance.priority;
                      
                      return (
                        <Card className={cn(
                          "border-2",
                          displayPriority === 'High' && "border-rose-200 bg-rose-50/30",
                          displayPriority === 'Medium' && "border-amber-200 bg-amber-50/30",
                          displayPriority === 'Low' && "border-gray-200 bg-gray-50/30"
                        )}>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className={cn(
                                "relative pl-4",
                                displayPriority === 'High' && "border-rose-500 text-rose-600 bg-rose-50",
                                displayPriority === 'Medium' && "border-amber-500 text-amber-600 bg-amber-50",
                                displayPriority === 'Low' && "border-gray-400 text-gray-500 bg-gray-50"
                              )}>
                                <span className={cn(
                                  "absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                                  displayPriority === 'High' && "bg-rose-500",
                                  displayPriority === 'Medium' && "bg-amber-500",
                                  displayPriority === 'Low' && "bg-gray-400"
                                )} />
                                {displayPriority} Priority
                              </Badge>
                            </div>
                            
                            {/* Show high_priority notes from API if available */}
                            {highPriorityNotes ? (
                              <div className="space-y-2">
                                {highPriorityNotes.split('\n').filter(line => line.trim()).map((line, i) => (
                                  <p key={i} className="text-sm text-muted-foreground">
                                    {line.trim()}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <>
                                <ul className="text-sm space-y-1 mb-3">

                                </ul>
                                <p className="text-sm font-medium">
                                </p>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </div>
                )}
                
                {selectedVariance.status !== 'Resolved' && isResubmissionEligible(selectedVariance.rootCauseCategory) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blue-500" />
                      Resubmission Options
                    </h4>
                    <Card className="bg-blue-50/30 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium">EDI {getEDIFormat(selectedVariance.rootCauseCategory, selectedVariance.rootCauseSubcategory).format} Format</p>
                            <p className="text-xs text-muted-foreground">
                              {getEDIFormat(selectedVariance.rootCauseCategory, selectedVariance.rootCauseSubcategory).description}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => setShowResubmissionDraft(!showResubmissionDraft)}
                            data-testid="button-generate-edi"
                          >
                            {showResubmissionDraft ? 'Hide Draft' : 'Generate Draft'}
                          </Button>
                        </div>
                        {showResubmissionDraft && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-muted-foreground">EDI Draft Preview</p>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(generateEDIDraft(selectedVariance));
                                }}
                                data-testid="button-copy-edi"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <ScrollArea className="h-[200px] rounded border bg-slate-900 p-3">
                              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                                {generateEDIDraft(selectedVariance)}
                              </pre>
                            </ScrollArea>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    className="flex-1" 
                    onClick={() => { setSelectedVariance(null); setShowResubmissionDraft(false); }}
                    data-testid="button-close-detail"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
