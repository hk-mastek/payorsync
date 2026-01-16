import { useState, useMemo, useCallback } from "react";
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
  
  const rawStateData = useMemo(() => groupByState(filteredData), [filteredData]);
  const stateData = useMemo(() => rawStateData.map(s => ({
    ...s,
    count: Math.round(s.count * SCALE_FACTOR),
    amount: Math.round(s.amount * SCALE_FACTOR),
  })), [rawStateData, SCALE_FACTOR]);
  
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Root Cause Analysis
              </CardTitle>
              <CardDescription>
                Click a bar to filter • Click outside to clear
                {selectedPayorType !== "all" && (
                  <Badge variant="secondary" className="ml-2">{selectedPayorType}</Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="h-[300px]"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.closest('.recharts-bar-rectangle') && selectedPayorType !== "all") {
                    setSelectedPayorType("all");
                  }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payorTypeData} layout="vertical" margin={{ top: 0, right: 30, left: 120, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis type="category" dataKey="type" stroke="hsl(var(--muted-foreground))" fontSize={11} width={110} />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => [formatCurrency(value), 'Variance']}
                    />
                    <Bar 
                      dataKey="amount" 
                      radius={[0, 4, 4, 0]} 
                      barSize={20}
                      onClick={(data, index, e) => {
                        e?.stopPropagation();
                        if (selectedPayorType === data.type) {
                          setSelectedPayorType("all");
                        } else {
                          setSelectedPayorType(data.type);
                        }
                      }}
                      cursor="pointer"
                    >
                      {payorTypeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={selectedPayorType === entry.type ? 'hsl(196, 100%, 30%)' : COLORS[index % COLORS.length]} 
                          stroke={selectedPayorType === entry.type ? 'hsl(196, 100%, 20%)' : 'none'}
                          strokeWidth={selectedPayorType === entry.type ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Top States by Variance
              </CardTitle>
              <CardDescription>
                Click a bar to filter • Click outside to clear
                {selectedState !== "all" && (
                  <Badge variant="secondary" className="ml-2">{selectedState}</Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="h-[300px]"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.closest('.recharts-bar-rectangle') && selectedState !== "all") {
                    setSelectedState("all");
                  }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateData.slice(0, 15)} layout="vertical" margin={{ left: 60, right: 20, top: 10, bottom: 10 }}>
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
                      width={50}
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
                        if (selectedState === data.state) {
                          setSelectedState("all");
                        } else {
                          setSelectedState(data.state);
                        }
                      }}
                    >
                      {stateData.slice(0, 15).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={selectedState === entry.state ? '#0284c7' : index < 3 ? '#dc2626' : index < 6 ? '#ea580c' : index < 10 ? '#eab308' : '#22c55e'}
                          opacity={selectedState === "all" || selectedState === entry.state ? 1 : 0.4}
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
                    <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50">
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
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          row.priority === 'High' && "border-rose-500 text-rose-600",
                          row.priority === 'Medium' && "border-amber-500 text-amber-600",
                          row.priority === 'Low' && "border-gray-400 text-gray-500"
                        )}>
                          {row.priority}
                        </Badge>
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
    </DashboardLayout>
  );
}
