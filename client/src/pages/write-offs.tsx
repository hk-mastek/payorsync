import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign,
  TrendingDown,
  Clock,
  RefreshCw,
  AlertTriangle,
  Target,
  Filter
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
  PieChart,
  Pie,
  Legend,
  ComposedChart,
  Line
} from "recharts";
import { PAYORS } from "@shared/dashboardData";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
const FUNNEL_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#22c55e', '#ef4444'];

const STATIC_KPI = {
  totalWriteOffAmount: 1850000,
  writeOffCount: 312,
  writeOffRate: 13.9,
  avgDaysToWriteOff: 127,
  potentialRecovery: 425000,
  recoverableCount: 89,
};

const STATIC_FUNNEL = [
  { stage: 'Total Variances', count: 2250, amount: 18500000 },
  { stage: 'Under Review', count: 875, amount: 7200000 },
  { stage: 'Appealed', count: 425, amount: 3500000 },
  { stage: 'Written Off', count: 312, amount: 1850000 },
];

const STATIC_PREDICTIVE = {
  atRiskCount: 156,
  atRiskAmount: 1280000,
  projectedWriteOffs: 62,
  projectedAmount: 512000,
  timelyFilingRisk: 43,
};

const STATIC_ROOT_CAUSE = [
  { category: 'Rate Discrepancy', count: 78, amount: 485000 },
  { category: 'Coding Error', count: 65, amount: 378000 },
  { category: 'Auth Denial', count: 52, amount: 312000 },
  { category: 'Timely Filing', count: 48, amount: 295000 },
  { category: 'Medical Necessity', count: 35, amount: 198000 },
  { category: 'Coverage Terminated', count: 34, amount: 182000 },
];

const STATIC_AGING = [
  { bucket: '0-30', count: 12, amount: 45000 },
  { bucket: '31-60', count: 28, amount: 125000 },
  { bucket: '61-90', count: 45, amount: 215000 },
  { bucket: '91-120', count: 68, amount: 385000 },
  { bucket: '121-180', count: 89, amount: 520000 },
  { bucket: '181-365', count: 52, amount: 385000 },
  { bucket: '365+', count: 18, amount: 175000 },
];

const STATIC_REASONS = [
  { reason: 'Timely Filing Expired', count: 78, amount: 462000 },
  { reason: 'Appeal Exhausted', count: 69, amount: 407000 },
  { reason: 'Contractual Adjustment', count: 56, amount: 333000 },
  { reason: 'Patient Responsibility', count: 37, amount: 222000 },
  { reason: 'Coordination of Benefits', count: 31, amount: 185000 },
  { reason: 'Provider Error', count: 25, amount: 148000 },
  { reason: 'Payer Insolvency', count: 10, amount: 56000 },
  { reason: 'Small Balance', count: 6, amount: 37000 },
];

const STATIC_PAYORS = [
  { payorName: 'Aetna', count: 48, amount: 285000, avgDays: 132 },
  { payorName: 'UnitedHealth', count: 42, amount: 248000, avgDays: 118 },
  { payorName: 'Cigna', count: 38, amount: 225000, avgDays: 142 },
  { payorName: 'Humana', count: 35, amount: 198000, avgDays: 125 },
  { payorName: 'Blue Cross', count: 32, amount: 188000, avgDays: 135 },
  { payorName: 'Medicare', count: 28, amount: 165000, avgDays: 108 },
  { payorName: 'Anthem', count: 25, amount: 148000, avgDays: 145 },
  { payorName: 'Kaiser', count: 22, amount: 132000, avgDays: 122 },
  { payorName: 'Molina', count: 18, amount: 108000, avgDays: 138 },
  { payorName: 'Centene', count: 14, amount: 85000, avgDays: 128 },
];

export default function WriteOffs() {
  const [selectedPayor, setSelectedPayor] = useState<string>("all");
  const [selectedReason, setSelectedReason] = useState<string>("all");

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${Math.round(value / 1000000)}M`;
    if (value >= 1000) return `$${Math.round(value / 1000)}K`;
    return `$${Math.round(value)}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Write-Off Analysis</h1>
            <p className="text-muted-foreground mt-1">Track write-off trends, recovery potential, and root cause analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPayor} onValueChange={setSelectedPayor}>
              <SelectTrigger className="w-[180px]" data-testid="select-payor-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Payor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payors</SelectItem>
                {PAYORS.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger className="w-[200px]" data-testid="select-reason-filter">
                <SelectValue placeholder="Filter by Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                {STATIC_REASONS.map(r => (
                  <SelectItem key={r.reason} value={r.reason}>{r.reason}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Write-Offs</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-writeoff-amount">${Math.round(STATIC_KPI.totalWriteOffAmount / 1000000 * 10) / 10}M</div>
              <p className="text-xs text-muted-foreground mt-1">
                {STATIC_KPI.writeOffCount} write-offs ({STATIC_KPI.writeOffRate}% of variances)
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Days to Write-Off</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-days">{STATIC_KPI.avgDaysToWriteOff} days</div>
              <p className="text-xs text-muted-foreground mt-1">
                From variance identification to write-off
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recovery Potential</CardTitle>
              <RefreshCw className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-recovery-potential">${Math.round(STATIC_KPI.potentialRecovery / 1000)}K</div>
              <p className="text-xs text-muted-foreground mt-1">
                {STATIC_KPI.recoverableCount} write-offs with recovery potential
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-4 w-4" />
                Write-Off Funnel
              </CardTitle>
              <CardDescription className="text-xs">Variance lifecycle from identification to resolution</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart margin={{ top: 10, right: 80, bottom: 10, left: 10 }}>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                      formatter={(value: number, name: string, props: any) => [
                        `${props.payload.count.toLocaleString()} (${formatCurrency(props.payload.amount)})`,
                        props.payload.stage
                      ]}
                    />
                    <Funnel
                      dataKey="count"
                      data={STATIC_FUNNEL}
                      isAnimationActive
                    >
                      {STATIC_FUNNEL.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                      ))}
                      <LabelList 
                        position="right" 
                        fill="#666" 
                        stroke="none" 
                        dataKey="stage" 
                        fontSize={11}
                      />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Predictive Insights
              </CardTitle>
              <CardDescription className="text-xs">Variances at risk of becoming write-offs</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400 text-sm">At-Risk Variances</p>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80">Aging 90+ days, still open</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-700 dark:text-red-400" data-testid="text-at-risk-count">{STATIC_PREDICTIVE.atRiskCount}</p>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80">${Math.round(STATIC_PREDICTIVE.atRiskAmount / 1000000 * 10) / 10}M</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-400 text-sm">Projected Write-Offs</p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80">Based on historical patterns</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400" data-testid="text-projected-writeoffs">{STATIC_PREDICTIVE.projectedWriteOffs}</p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80">${Math.round(STATIC_PREDICTIVE.projectedAmount / 1000)}K</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                  <div>
                    <p className="font-medium text-purple-700 dark:text-purple-400 text-sm">Timely Filing Risk</p>
                    <p className="text-xs text-purple-600/80 dark:text-purple-400/80">150+ days, unresolved</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-700 dark:text-purple-400" data-testid="text-timely-filing-risk">{STATIC_PREDICTIVE.timelyFilingRisk}</p>
                    <p className="text-xs text-purple-600/80 dark:text-purple-400/80">Immediate action needed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Write-Off by Root Cause
              </CardTitle>
              <CardDescription className="text-xs">Amount written off by variance category</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={STATIC_ROOT_CAUSE} layout="vertical" margin={{ left: 5, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="category" 
                      tick={{ fontSize: 10 }}
                      width={85}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                      labelFormatter={(label) => {
                        const item = STATIC_ROOT_CAUSE.find(r => r.category === label);
                        return item ? `${label} (${item.count} write-offs)` : label;
                      }}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                      {STATIC_ROOT_CAUSE.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Write-Off Aging Analysis
              </CardTitle>
              <CardDescription className="text-xs">Distribution by aging at time of write-off</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={STATIC_AGING} margin={{ left: 5, right: 35, top: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="bucket" 
                      tick={{ fontSize: 9 }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 10 }}
                      width={45}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10 }}
                      width={30}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                      formatter={(value: number, name: string) => [
                        name === 'amount' ? formatCurrency(value) : value,
                        name === 'amount' ? 'Amount' : 'Count'
                      ]}
                    />
                    <Bar yAxisId="left" dataKey="amount" fill="#3b82f6" name="Amount" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="count" stroke="#ef4444" name="Count" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Write-Off by Reason</CardTitle>
              <CardDescription className="text-xs">Primary reasons for write-offs</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={STATIC_REASONS}
                      cx="35%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="reason"
                    >
                      {STATIC_REASONS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle" 
                      wrapperStyle={{ fontSize: '10px', right: 0 }}
                      formatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Payors by Write-Off</CardTitle>
              <CardDescription className="text-xs">Payors with highest write-off amounts</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={STATIC_PAYORS} layout="vertical" margin={{ left: 5, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="payorName" 
                      tick={{ fontSize: 10 }}
                      width={70}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                      labelFormatter={(label) => {
                        const payor = STATIC_PAYORS.find(p => p.payorName === label);
                        return payor ? `${label} (${payor.count} write-offs, avg ${payor.avgDays} days)` : label;
                      }}
                    />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Write-Off Summary</CardTitle>
            <CardDescription className="text-xs">Detailed breakdown of write-off reasons with recovery analysis</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-writeoff-summary">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-xs">Reason</th>
                    <th className="text-right py-2 px-3 font-medium text-xs">Count</th>
                    <th className="text-right py-2 px-3 font-medium text-xs">Amount</th>
                    <th className="text-right py-2 px-3 font-medium text-xs">% of Total</th>
                    <th className="text-left py-2 px-3 font-medium text-xs">Recovery Status</th>
                  </tr>
                </thead>
                <tbody>
                  {STATIC_REASONS.map((row, idx) => {
                    const pct = (row.amount / STATIC_KPI.totalWriteOffAmount) * 100;
                    const recoverable = row.reason === 'Contractual Adjustment' || row.reason === 'Appeal Exhausted';
                    return (
                      <tr key={row.reason} className={idx % 2 === 0 ? 'bg-muted/30' : ''} data-testid={`row-reason-${idx}`}>
                        <td className="py-2 px-3 text-xs">{row.reason}</td>
                        <td className="text-right py-2 px-3 text-xs">{row.count}</td>
                        <td className="text-right py-2 px-3 font-medium text-xs">${Math.round(row.amount / 1000)}K</td>
                        <td className="text-right py-2 px-3 text-xs">{Math.round(pct)}%</td>
                        <td className="py-2 px-3">
                          {recoverable ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                              Potential Recovery
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                              Final
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td className="py-2 px-3 text-xs">Total</td>
                    <td className="text-right py-2 px-3 text-xs">{STATIC_KPI.writeOffCount}</td>
                    <td className="text-right py-2 px-3 text-xs">${Math.round(STATIC_KPI.totalWriteOffAmount / 1000000 * 10) / 10}M</td>
                    <td className="text-right py-2 px-3 text-xs">100%</td>
                    <td className="py-2 px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}