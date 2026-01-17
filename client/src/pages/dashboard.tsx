import { useState, useMemo, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
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
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  Cell,
  Legend,
  Treemap,
  PieChart,
  Pie
} from "recharts";
import {
  generateVarianceData,
  calculateKPIs,
  groupByPayorType,
  groupByPayorWithType,
  groupByState,
  groupByRootCause,
  groupByAgingBucket,
  getTrendData,
  PAYORS,
  STATES,
  ROOT_CAUSES,
  STATUSES,
  type VarianceRecord
} from "@shared/dashboardData";

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

const ROOT_CAUSE_EXPLANATIONS: Record<string, { title: string; explanation: string; actionable: boolean }> = {
  'Authorization Issues': {
    title: 'Prior Authorization - MSP Coordination Period Problem',
    explanation: 'Authorization issues in ESRD commonly occur during the 30-month Medicare Secondary Payer (MSP) coordination period when coverage transitions from commercial to Medicare primary. Authorizations obtained from the commercial plan may not transfer when Medicare becomes primary, or the wrong payor was contacted for authorization. Verify the patient\'s dialysis start date to determine coordination month, then confirm authorizations are current for the correct primary payor.',
    actionable: true
  },
  'Contractual Disputes': {
    title: 'Contract Rate Mismatch - Fee Schedule Transition',
    explanation: 'Payment does not align with contracted rates, which is common during the MSP 30-month transition when commercial contracts and Medicare rates overlap. The commercial payor may have incorrectly applied Medicare bundled rates during their primary period, or vice versa. Document the patient\'s coordination month and compare the payment against the applicable fee schedule in the executed contract for that period.',
    actionable: true
  },
  'Coding Errors': {
    title: 'Coding Discrepancy - ESRD Modifier/Code Issue',
    explanation: 'ESRD claims require specific coding including condition codes (76 for dialysis), modifiers (AY, CD, CE for coordination period), and appropriate HCPCS codes for dialysis services. This variance may indicate missing ESRD-specific modifiers, incorrect place of service (POS 65 for ESRD), or diagnosis code sequencing issues. Verify N18.6 (ESRD) is the primary diagnosis and modifiers correctly reflect the patient\'s coordination period status.',
    actionable: true
  },
  'Patient Eligibility': {
    title: 'Eligibility Issue - Coordination of Benefits During MSP Period',
    explanation: 'Patient eligibility variances in ESRD frequently stem from coordination of benefits (COB) confusion during the 30-month transition period. The payor may have incorrect information about whether commercial or Medicare is primary. Verify the patient\'s dialysis start date, calculate their current coordination month, and confirm the correct billing order. COB issues often resolve when the primary/secondary payor sequence is corrected.',
    actionable: true
  },
  'Medical Necessity': {
    title: 'Medical Necessity - LCD/NCD Documentation Requirements',
    explanation: 'Medical necessity denials for ESRD services typically involve Local Coverage Determination (LCD) or National Coverage Determination (NCD) requirements. Ensure documentation includes the dialysis prescription, lab values supporting treatment frequency, and physician certification. During the MSP coordination period, both commercial and Medicare may have different medical necessity documentation requirements.',
    actionable: true
  },
  'Claim Submission Errors': {
    title: 'Claim Submission Error - ESRD Billing Sequence Issue',
    explanation: 'Claim submission errors in ESRD often involve billing sequence problems during the 30-month coordination period. Common issues include submitting to Medicare before the commercial primary has processed (during months 1-30), missing COB information, or duplicate claims when resubmitting after the payor handover. Verify the correct primary payor received the claim first and EOB/remittance from primary is attached for secondary billing.',
    actionable: true
  },
  'Timely Filing': {
    title: 'Timely Filing - Coordination Period Deadline Confusion',
    explanation: 'Timely filing issues in ESRD can occur when claims are held pending coordination of benefits determination during the 30-month transition. Each payor has different filing deadlines (commercial plans vary; Medicare is typically 12 months). If the primary payor determination was delayed, document the timeline and request a timely filing exception based on COB resolution date rather than date of service.',
    actionable: true
  },
  'System/Technical': {
    title: 'System/Technical - EDI or Clearinghouse Issue',
    explanation: 'Technical rejections for ESRD claims may involve EDI formatting issues specific to dialysis billing, clearinghouse routing errors during payor transitions, or payer system limitations with coordination period claims. Check the 277CA or 999 acknowledgment for specific rejection codes. Common issues include incorrect payer ID during MSP transitions or loop 2300 COB segment errors.',
    actionable: true
  }
};

const PRIORITY_EXPLANATIONS: Record<string, { criteria: string[]; recommendation: string }> = {
  'High': {
    criteria: [
      'Variance amount exceeds $500',
      'Aging over 90 days (approaching timely filing limits)',
      'High recovery potential based on root cause',
      'Pattern indicates systemic issue'
    ],
    recommendation: 'Prioritize immediate action. Escalate to supervisor if unresolved within 5 business days.'
  },
  'Medium': {
    criteria: [
      'Variance amount between $100 and $500',
      'Aging between 30-90 days',
      'Moderate recovery potential',
      'Requires standard follow-up procedures'
    ],
    recommendation: 'Address within standard workflow. Target resolution within 2 weeks.'
  },
  'Low': {
    criteria: [
      'Variance amount under $100',
      'Recently identified (under 30 days)',
      'Lower recovery potential or patient responsibility',
      'May resolve through normal payment cycles'
    ],
    recommendation: 'Monitor and batch process. Review if status unchanged after 30 days.'
  }
};

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
  const [lastUpdated] = useState(new Date());
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
  
  const SCALE_FACTOR = 324;
  const WEEKLY_VARIANCES = 13696;
  const allData = useMemo(() => generateVarianceData(2250), []);
  
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
  
  const rawKpis = useMemo(() => calculateKPIs(filteredData), [filteredData]);
  const kpis = useMemo(() => ({
    totalOpenVariances: Math.round(rawKpis.totalOpenVariances * SCALE_FACTOR),
    totalVarianceAmount: Math.round(rawKpis.totalVarianceAmount * SCALE_FACTOR),
    newThisWeek: WEEKLY_VARIANCES,
    resolvedThisWeek: Math.round(WEEKLY_VARIANCES * 0.72),
    avgDaysToResolution: rawKpis.avgDaysToResolution,
    recoveryRate: rawKpis.recoveryRate,
  }), [rawKpis, SCALE_FACTOR, WEEKLY_VARIANCES]);
  
  const rawPayorTypeData = useMemo(() => groupByPayorType(filteredData), [filteredData]);
  const payorTypeData = useMemo(() => rawPayorTypeData.map(p => ({
    ...p,
    count: Math.round(p.count * SCALE_FACTOR),
    amount: Math.round(p.amount * SCALE_FACTOR),
  })), [rawPayorTypeData, SCALE_FACTOR]);
  
  const rawSunburstData = useMemo(() => groupByPayorWithType(filteredData), [filteredData]);
  const sunburstInnerData = useMemo(() => rawSunburstData.map((t, idx) => ({
    name: t.type,
    value: Math.round(t.amount * SCALE_FACTOR),
    count: Math.round(t.count * SCALE_FACTOR),
    fill: COLORS[idx % COLORS.length],
  })), [rawSunburstData, SCALE_FACTOR]);
  
  const sunburstOuterData = useMemo(() => {
    if (!sunburstSelectedType) return [];
    const selectedTypeData = rawSunburstData.find(t => t.type === sunburstSelectedType);
    if (!selectedTypeData) return [];
    const typeIndex = rawSunburstData.findIndex(t => t.type === sunburstSelectedType);
    const baseColor = COLORS[typeIndex % COLORS.length];
    return selectedTypeData.payors.slice(0, 10).map((p, idx) => ({
      name: p.name,
      value: Math.round(p.amount * SCALE_FACTOR),
      count: Math.round(p.count * SCALE_FACTOR),
      fill: `hsl(${196 + idx * 15}, ${70 - idx * 3}%, ${40 + idx * 4}%)`,
    }));
  }, [rawSunburstData, sunburstSelectedType, SCALE_FACTOR]);
  
  const rawStateData = useMemo(() => groupByState(stateChartData), [stateChartData]);
  const stateData = useMemo(() => rawStateData.map(s => ({
    ...s,
    count: Math.round(s.count * SCALE_FACTOR),
    amount: Math.round(s.amount * SCALE_FACTOR),
  })).sort((a, b) => b.amount - a.amount), [rawStateData, SCALE_FACTOR]);
  
  // Clear highlighted state if it's no longer in the filtered data
  useEffect(() => {
    if (highlightedState && !stateData.some(s => s.state === highlightedState)) {
      setHighlightedState(null);
    }
  }, [stateData, highlightedState]);
  
  const rawRootCauseData = useMemo(() => groupByRootCause(filteredData), [filteredData]);
  const rootCauseData = useMemo(() => rawRootCauseData.map(rc => ({
    ...rc,
    count: Math.round(rc.count * SCALE_FACTOR),
    amount: Math.round(rc.amount * SCALE_FACTOR),
    subcategories: rc.subcategories.map(sub => ({
      ...sub,
      count: Math.round(sub.count * SCALE_FACTOR),
      amount: Math.round(sub.amount * SCALE_FACTOR),
    })),
  })), [rawRootCauseData, SCALE_FACTOR]);
  
  const rawAgingData = useMemo(() => groupByAgingBucket(filteredData), [filteredData]);
  const agingData = useMemo(() => rawAgingData.map(a => ({
    ...a,
    count: Math.round(a.count * SCALE_FACTOR),
    amount: Math.round(a.amount * SCALE_FACTOR),
  })), [rawAgingData, SCALE_FACTOR]);
  
  const rawTrendData = useMemo(() => getTrendData(allData), [allData]);
  const trendData = useMemo(() => rawTrendData.map(t => ({
    ...t,
    new: Math.round(t.new * SCALE_FACTOR),
    resolved: Math.round(t.resolved * SCALE_FACTOR),
    amount: Math.round(t.amount * SCALE_FACTOR),
    net: Math.round(t.net * SCALE_FACTOR),
  })), [rawTrendData, SCALE_FACTOR]);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);
  
  const totalPages = Math.ceil(filteredData.length / pageSize);
  
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
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-refresh">
              <RefreshCw className="h-4 w-4" />
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
                  </div>
                  {isInsightsOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      Key Insights This Week
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Medicare Advantage variances increased 23% driven by Humana authorization denials</li>
                      <li>• Texas region showing 45% higher variance rate than national average</li>
                      <li>• Coding errors resolution time improved by 5 days after new training program</li>
                      <li>• Top 10 payors account for 68% of total variance dollars</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Action Required
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="text-amber-600">• 351 variances approaching timely filing deadline (next 14 days)</li>
                      <li className="text-amber-600">• 134 high-priority variances unassigned</li>
                      <li className="text-rose-600">• Cigna contract rate discrepancy affecting 68 claims - escalation recommended</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Positive Trends
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="text-emerald-600">• Overall resolution rate improved 3.2% month-over-month</li>
                      <li className="text-emerald-600">• Average days to resolution decreased from 38 to 34 days</li>
                      <li className="text-emerald-600">• Recovery rate at highest level in 6 months</li>
                    </ul>
                  </div>
                </div>
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
            
            <Select value={selectedPayorType} onValueChange={setSelectedPayorType}>
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
            
            <Select value={selectedState} onValueChange={setSelectedState}>
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
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
            
            <Select value={selectedRootCause} onValueChange={setSelectedRootCause}>
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
                      <Tooltip 
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
              Payor Distribution (Sunburst)
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
                  <Tooltip 
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
                  data-testid="button-sunburst-reset"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Root Cause Analysis</CardTitle>
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
                    <Tooltip 
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
                    <Tooltip 
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
                  <Tooltip 
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
                <CardTitle>Variance Details</CardTitle>
                <CardDescription>
                  {formatNumber(filteredData.length)} variances • Page {currentPage} of {totalPages}
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
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Payor</TableHead>
                    <TableHead className="w-[60px]">State</TableHead>
                    <TableHead>Root Cause</TableHead>
                    <TableHead className="text-right">Billed</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="w-[80px]">Age</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[70px]">Priority</TableHead>
                    <TableHead>Patient</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row) => (
                    <TableRow 
                      key={row.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => { setSelectedVariance(row); setShowResubmissionDraft(false); }}
                      data-testid={`variance-row-${row.id}`}
                    >
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
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
                        <Badge variant={
                          row.status === 'Resolved' ? 'secondary' :
                          row.status === 'Open' ? 'outline' :
                          row.status === 'Under Appeal' ? 'default' : 'outline'
                        } className={cn(
                          "text-xs",
                          row.status === 'Resolved' && "bg-emerald-100 text-emerald-700",
                          row.status === 'Written Off' && "bg-gray-100 text-gray-600"
                        )}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.status === 'Resolved' ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            row.priority === 'High' && "border-rose-500 text-rose-600",
                            row.priority === 'Medium' && "border-amber-500 text-amber-600",
                            row.priority === 'Low' && "border-gray-400 text-gray-500"
                          )}>
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
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {formatNumber(filteredData.length)}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
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
                  disabled={currentPage === totalPages}
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
                </SheetTitle>
                <SheetDescription>
                  {selectedVariance.id} - {selectedVariance.payorName}
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 py-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Patient</p>
                    <p className="font-medium">{selectedVariance.patientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Service</p>
                    <p className="font-medium">{selectedVariance.dateOfService}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Billed Amount</p>
                    <p className="font-medium">${selectedVariance.billedAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid Amount</p>
                    <p className="font-medium">${selectedVariance.paidAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Variance</p>
                    <p className="font-medium text-rose-600">-${selectedVariance.varianceAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Aging</p>
                    <p className={cn(
                      "font-medium",
                      selectedVariance.agingDays > 120 ? "text-rose-600" : 
                      selectedVariance.agingDays > 60 ? "text-amber-600" : ""
                    )}>{selectedVariance.agingDays} days</p>
                  </div>
                </div>
                
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
                      <p className="text-sm font-medium mb-1">
                        {ROOT_CAUSE_EXPLANATIONS[selectedVariance.rootCauseCategory]?.title || selectedVariance.rootCauseCategory}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ROOT_CAUSE_EXPLANATIONS[selectedVariance.rootCauseCategory]?.explanation || 
                         'This variance requires further investigation to determine the root cause and appropriate resolution path.'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {selectedVariance.status !== 'Resolved' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Priority Assessment
                    </h4>
                    <Card className={cn(
                      "border-2",
                      selectedVariance.priority === 'High' && "border-rose-200 bg-rose-50/30",
                      selectedVariance.priority === 'Medium' && "border-amber-200 bg-amber-50/30",
                      selectedVariance.priority === 'Low' && "border-gray-200 bg-gray-50/30"
                    )}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className={cn(
                            selectedVariance.priority === 'High' && "border-rose-500 text-rose-600",
                            selectedVariance.priority === 'Medium' && "border-amber-500 text-amber-600",
                            selectedVariance.priority === 'Low' && "border-gray-400 text-gray-500"
                          )}>
                            {selectedVariance.priority} Priority
                          </Badge>
                        </div>
                        <p className="text-xs font-medium mb-2 text-muted-foreground">Why this priority?</p>
                        <ul className="text-sm space-y-1 mb-3">
                          {PRIORITY_EXPLANATIONS[selectedVariance.priority]?.criteria.map((criterion, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 mt-1 text-emerald-500 flex-shrink-0" />
                              <span className="text-muted-foreground">{criterion}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm font-medium">
                          {PRIORITY_EXPLANATIONS[selectedVariance.priority]?.recommendation}
                        </p>
                      </CardContent>
                    </Card>
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
