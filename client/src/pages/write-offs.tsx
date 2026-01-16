import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingDown,
  Clock,
  RefreshCw,
  AlertTriangle,
  Target
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

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
const FUNNEL_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#22c55e', '#ef4444'];

const STATIC_KPI = {
  totalWriteOffAmount: 599400000,
  writeOffCount: 101088,
  writeOffRate: 13.9,
  avgDaysToWriteOff: 127,
  potentialRecovery: 137700000,
  recoverableCount: 28836,
};

const STATIC_FUNNEL = [
  { stage: 'Total Variances', count: 729000, amount: 5994000000 },
  { stage: 'Under Review', count: 283500, amount: 2332800000 },
  { stage: 'Appealed', count: 137700, amount: 1134000000 },
  { stage: 'Written Off', count: 101088, amount: 599400000 },
];

const STATIC_PREDICTIVE = {
  atRiskCount: 50544,
  atRiskAmount: 414720000,
  projectedWriteOffs: 20088,
  projectedAmount: 165888000,
  timelyFilingRisk: 13932,
};

const STATIC_ROOT_CAUSE = [
  { category: 'Rate Discrepancy', count: 25272, amount: 157140000 },
  { category: 'Coding Error', count: 21060, amount: 122472000 },
  { category: 'Auth Denial', count: 16848, amount: 101088000 },
  { category: 'Timely Filing', count: 15552, amount: 95580000 },
  { category: 'Medical Necessity', count: 11340, amount: 64152000 },
  { category: 'Coverage Terminated', count: 11016, amount: 58968000 },
];

const STATIC_AGING = [
  { bucket: '0-30', count: 3888, amount: 14580000 },
  { bucket: '31-60', count: 9072, amount: 40500000 },
  { bucket: '61-90', count: 14580, amount: 69660000 },
  { bucket: '91-120', count: 22032, amount: 124740000 },
  { bucket: '121-180', count: 28836, amount: 168480000 },
  { bucket: '181-365', count: 16848, amount: 124740000 },
  { bucket: '365+', count: 5832, amount: 56700000 },
];

const STATIC_REASONS = [
  { reason: 'Timely Filing Expired', count: 25272, amount: 149688000 },
  { reason: 'Appeal Exhausted', count: 22356, amount: 131868000 },
  { reason: 'Contractual Adjustment', count: 18144, amount: 107892000 },
  { reason: 'Patient Responsibility', count: 11988, amount: 71928000 },
  { reason: 'Coordination of Benefits', count: 10044, amount: 59940000 },
  { reason: 'Provider Error', count: 8100, amount: 47952000 },
  { reason: 'Payer Insolvency', count: 3240, amount: 18144000 },
  { reason: 'Small Balance', count: 1944, amount: 11988000 },
];

const STATIC_PAYORS = [
  { payorName: 'Aetna', count: 15552, amount: 92340000, avgDays: 132 },
  { payorName: 'UnitedHealth', count: 13608, amount: 80352000, avgDays: 118 },
  { payorName: 'Cigna', count: 12312, amount: 72900000, avgDays: 142 },
  { payorName: 'Humana', count: 11340, amount: 64152000, avgDays: 125 },
  { payorName: 'Blue Cross', count: 10368, amount: 60912000, avgDays: 135 },
  { payorName: 'Medicare', count: 9072, amount: 53460000, avgDays: 108 },
  { payorName: 'Anthem', count: 8100, amount: 47952000, avgDays: 145 },
  { payorName: 'Kaiser', count: 7128, amount: 42768000, avgDays: 122 },
  { payorName: 'Molina', count: 5832, amount: 34992000, avgDays: 138 },
  { payorName: 'Centene', count: 4536, amount: 27540000, avgDays: 128 },
];

export default function WriteOffs() {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${Math.round(value / 1000000)}M`;
    if (value >= 1000) return `$${Math.round(value / 1000)}K`;
    return `$${Math.round(value)}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Write-Off Analysis</h1>
          <p className="text-muted-foreground mt-1">Track write-off trends, recovery potential, and root cause analysis</p>
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
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80">High number of re-submissions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400" data-testid="text-projected-writeoffs">{STATIC_PREDICTIVE.projectedWriteOffs}</p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80">${Math.round(STATIC_PREDICTIVE.projectedAmount / 1000)}K</p>
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
                        name === 'amount' ? `$${(value / 1000000).toFixed(1)}M` : value.toLocaleString(),
                        name === 'amount' ? 'Amount' : 'Count'
                      ]}
                      labelFormatter={(label) => {
                        const bucket = STATIC_AGING.find(a => a.bucket === label);
                        return bucket ? `${label} days (${bucket.count.toLocaleString()} write-offs)` : `${label} days`;
                      }}
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