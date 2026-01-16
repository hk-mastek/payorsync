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
const FUNNEL_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#ef4444'];

const STATIC_KPI = {
  totalWriteOffAmount: 7820000,
  writeOffCount: 850,
  writeOffRate: 2.8,
  avgDaysToWriteOff: 198,
  potentialRecovery: 2740000,
  recoverableCount: 298,
  avgWriteOffAmount: 9200,
  medianWriteOffAmount: 1850,
  recoveryRate: 42,
};

const STATIC_FUNNEL = [
  { stage: 'Total Variances', count: 30357, amount: 279000000 },
  { stage: 'Under Review', count: 12143, amount: 111600000 },
  { stage: 'Appealed', count: 5893, amount: 54180000 },
  { stage: 'Written Off', count: 850, amount: 7820000 },
];

const STATIC_PREDICTIVE = {
  atRiskCount: 298,
  atRiskAmount: 2740000,
  projectedWriteOffs: 119,
  projectedAmount: 1096000,
  timelyFilingRisk: 272,
};

const STATIC_ROOT_CAUSE = [
  { category: 'Timely Filing Exceeded', count: 272, amount: 2500000 },
  { category: 'Appeal Exhausted', count: 204, amount: 1880000 },
  { category: 'Patient Responsibility', count: 153, amount: 1410000 },
  { category: 'Documentation Deficiency', count: 102, amount: 940000 },
  { category: 'Contractual/Regulatory', count: 68, amount: 626000 },
  { category: 'Small Balance Write-Off', count: 34, amount: 313000 },
  { category: 'Other', count: 17, amount: 156000 },
];

const STATIC_AGING = [
  { bucket: '0-90', count: 51, amount: 469000 },
  { bucket: '91-180', count: 153, amount: 1408000 },
  { bucket: '181-270', count: 238, amount: 2190000 },
  { bucket: '271-365', count: 272, amount: 2503000 },
  { bucket: '366-450', count: 102, amount: 938000 },
  { bucket: '451+', count: 34, amount: 313000 },
];

const STATIC_REASONS = [
  { reason: 'Timely Filing Exceeded', count: 272, amount: 2500000 },
  { reason: 'Appeal Exhausted', count: 204, amount: 1880000 },
  { reason: 'Patient Responsibility Uncollectible', count: 153, amount: 1410000 },
  { reason: 'Documentation Deficiency', count: 102, amount: 940000 },
  { reason: 'Contractual/Regulatory', count: 68, amount: 626000 },
  { reason: 'Small Balance Write-Off', count: 34, amount: 313000 },
  { reason: 'Other', count: 17, amount: 156000 },
];

const STATIC_PAYORS = [
  { payorName: 'Medicare Traditional', count: 255, amount: 2190000, rate: 2.1 },
  { payorName: 'Medicare Advantage', count: 230, amount: 2350000, rate: 3.4 },
  { payorName: 'Commercial', count: 170, amount: 1800000, rate: 3.8 },
  { payorName: 'Medicaid', count: 153, amount: 1170000, rate: 2.4 },
  { payorName: 'Other Government', count: 42, amount: 312000, rate: 2.6 },
];

const STATIC_PREVENTABLE = [
  { status: 'Preventable', count: 298, amount: 2740000 },
  { status: 'Non-Preventable', count: 552, amount: 5080000 },
];

export default function WriteOffs2() {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${Math.round(value / 1000)}K`;
    return `$${Math.round(value)}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Write-Off Analysis 2</h1>
          <p className="text-muted-foreground mt-1">Track write-off trends, recovery potential, and root cause analysis</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Write-Offs</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-writeoff-amount">{formatCurrency(STATIC_KPI.totalWriteOffAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {STATIC_KPI.writeOffCount} records ({STATIC_KPI.writeOffRate}% rate)
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
                Median: ${STATIC_KPI.medianWriteOffAmount.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
              <RefreshCw className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-recovery-rate">{STATIC_KPI.recoveryRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                On appealed claims
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Write-Off Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-amount">${STATIC_KPI.avgWriteOffAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Per write-off record
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
                        name === 'amount' ? `$${(value / 1000000).toFixed(2)}M` : value.toLocaleString(),
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
                        return payor ? `${label} (${payor.count} records, ${payor.rate}% rate)` : label;
                      }}
                    />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Preventable vs Non-Preventable</CardTitle>
              <CardDescription className="text-xs">Classification of write-off preventability</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={STATIC_PREVENTABLE}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="status"
                    >
                      <Cell fill="#ef4444" />
                      <Cell fill="#22c55e" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    />
                    <Legend 
                      layout="horizontal" 
                      align="center" 
                      verticalAlign="bottom" 
                      wrapperStyle={{ fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Preventable
                  </span>
                  <span className="font-medium">{STATIC_PREVENTABLE[0].count} ({Math.round(STATIC_PREVENTABLE[0].count / STATIC_KPI.writeOffCount * 100)}%)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Non-Preventable
                  </span>
                  <span className="font-medium">{STATIC_PREVENTABLE[1].count} ({Math.round(STATIC_PREVENTABLE[1].count / STATIC_KPI.writeOffCount * 100)}%)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
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
      </div>
    </DashboardLayout>
  );
}