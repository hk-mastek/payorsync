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
  Line,
  Area
} from "recharts";
import {
  generateVarianceData,
  generateWriteOffData,
  calculateWriteOffKPIs,
  getWriteOffFunnelData,
  getWriteOffByRootCause,
  getWriteOffAgingAnalysis,
  getWriteOffByPayor,
  getWriteOffByReason,
  PAYORS
} from "@shared/dashboardData";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
const FUNNEL_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#22c55e', '#ef4444'];

export default function WriteOffs() {
  const [selectedPayor, setSelectedPayor] = useState<string>("all");
  const [selectedReason, setSelectedReason] = useState<string>("all");

  const varianceData = useMemo(() => generateVarianceData(), []);
  const writeOffData = useMemo(() => generateWriteOffData(varianceData), [varianceData]);

  const filteredWriteOffs = useMemo(() => {
    return writeOffData.filter(w => {
      if (selectedPayor !== "all" && w.payorId !== selectedPayor) return false;
      if (selectedReason !== "all" && w.writeOffReason !== selectedReason) return false;
      return true;
    });
  }, [writeOffData, selectedPayor, selectedReason]);

  const kpis = useMemo(() => {
    const totalVarianceAmount = varianceData.reduce((s, v) => s + v.varianceAmount, 0);
    return calculateWriteOffKPIs(filteredWriteOffs, varianceData.length, totalVarianceAmount);
  }, [filteredWriteOffs, varianceData]);

  const funnelData = useMemo(() => getWriteOffFunnelData(varianceData), [varianceData]);
  const rootCauseData = useMemo(() => getWriteOffByRootCause(filteredWriteOffs), [filteredWriteOffs]);
  const agingData = useMemo(() => getWriteOffAgingAnalysis(filteredWriteOffs), [filteredWriteOffs]);
  const payorData = useMemo(() => getWriteOffByPayor(filteredWriteOffs), [filteredWriteOffs]);
  const reasonData = useMemo(() => getWriteOffByReason(filteredWriteOffs), [filteredWriteOffs]);

  const uniqueReasons = useMemo(() => {
    const reasons = new Set(writeOffData.map(w => w.writeOffReason));
    return Array.from(reasons).sort();
  }, [writeOffData]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const predictiveInsights = useMemo(() => {
    const avgDays = kpis.avgDaysToWriteOff;
    const atRiskAmount = varianceData
      .filter(v => v.status === 'Open' && v.agingDays > 90)
      .reduce((s, v) => s + v.varianceAmount, 0);
    const atRiskCount = varianceData.filter(v => v.status === 'Open' && v.agingDays > 90).length;
    
    return {
      atRiskAmount,
      atRiskCount,
      projectedWriteOffs: Math.round(atRiskCount * 0.4),
      projectedAmount: Math.round(atRiskAmount * 0.4),
      timelyFilingRisk: varianceData.filter(v => v.agingDays > 150 && v.status !== 'Resolved').length,
    };
  }, [varianceData, kpis]);

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
                {uniqueReasons.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
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
              <div className="text-2xl font-bold" data-testid="text-total-writeoff-amount">{formatCurrency(kpis.totalWriteOffAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.writeOffCount} write-offs ({kpis.writeOffRate}% of variances)
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Days to Write-Off</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-days">{kpis.avgDaysToWriteOff} days</div>
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
              <div className="text-2xl font-bold" data-testid="text-recovery-potential">{formatCurrency(kpis.potentialRecovery)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.recoverableCount} write-offs with recovery potential
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Write-Off Funnel
              </CardTitle>
              <CardDescription>Variance lifecycle from identification to resolution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number, name: string, props: any) => [
                        `${props.payload.count} variances (${formatCurrency(props.payload.amount)})`,
                        props.payload.stage
                      ]}
                    />
                    <Funnel
                      dataKey="count"
                      data={funnelData}
                      isAnimationActive
                    >
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                      ))}
                      <LabelList position="right" fill="#666" stroke="none" dataKey="stage" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Predictive Insights
              </CardTitle>
              <CardDescription>Variances at risk of becoming write-offs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">At-Risk Variances</p>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80">Aging 90+ days, still open</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400" data-testid="text-at-risk-count">{predictiveInsights.atRiskCount}</p>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80">{formatCurrency(predictiveInsights.atRiskAmount)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-400">Projected Write-Offs</p>
                    <p className="text-sm text-amber-600/80 dark:text-amber-400/80">Based on historical patterns</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400" data-testid="text-projected-writeoffs">{predictiveInsights.projectedWriteOffs}</p>
                    <p className="text-sm text-amber-600/80 dark:text-amber-400/80">{formatCurrency(predictiveInsights.projectedAmount)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                  <div>
                    <p className="font-medium text-purple-700 dark:text-purple-400">Timely Filing Risk</p>
                    <p className="text-sm text-purple-600/80 dark:text-purple-400/80">150+ days, unresolved</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400" data-testid="text-timely-filing-risk">{predictiveInsights.timelyFilingRisk}</p>
                    <p className="text-sm text-purple-600/80 dark:text-purple-400/80">Immediate action needed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Write-Off by Root Cause
              </CardTitle>
              <CardDescription>Amount written off by variance category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rootCauseData} layout="vertical" margin={{ left: 100, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="category" 
                      tick={{ fontSize: 11 }}
                      width={95}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => [formatCurrency(value), 'Write-Off Amount']}
                      labelFormatter={(label) => {
                        const item = rootCauseData.find(r => r.category === label);
                        return item ? `${label} (${item.count} write-offs)` : label;
                      }}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                      {rootCauseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <Clock className="h-5 w-5" />
                Write-Off Aging Analysis
              </CardTitle>
              <CardDescription>Distribution by aging at time of write-off</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={agingData} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="bucket" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number, name: string) => [
                        name === 'amount' ? formatCurrency(value) : value,
                        name === 'amount' ? 'Amount' : 'Count'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="amount" fill="#3b82f6" name="Amount" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="count" stroke="#ef4444" name="Count" strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Write-Off by Reason</CardTitle>
              <CardDescription>Primary reasons for write-offs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="reason"
                      label={({ reason, percent }) => `${reason.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {reasonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    />
                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Payors by Write-Off</CardTitle>
              <CardDescription>Payors with highest write-off amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payorData.slice(0, 10)} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="payorName" 
                      tick={{ fontSize: 10 }}
                      width={75}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number, name: string) => [formatCurrency(value), 'Write-Off Amount']}
                      labelFormatter={(label) => {
                        const payor = payorData.find(p => p.payorName === label);
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
          <CardHeader>
            <CardTitle>Write-Off Summary</CardTitle>
            <CardDescription>Detailed breakdown of write-off reasons with recovery analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Reason</th>
                    <th className="text-right py-3 px-4 font-medium">Count</th>
                    <th className="text-right py-3 px-4 font-medium">Amount</th>
                    <th className="text-right py-3 px-4 font-medium">% of Total</th>
                    <th className="text-left py-3 px-4 font-medium">Recovery Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reasonData.map((row, idx) => {
                    const pct = (row.amount / kpis.totalWriteOffAmount) * 100;
                    const recoverable = row.reason === 'Contractual Adjustment' || row.reason === 'Appeal Exhausted';
                    return (
                      <tr key={row.reason} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                        <td className="py-3 px-4">{row.reason}</td>
                        <td className="text-right py-3 px-4">{row.count}</td>
                        <td className="text-right py-3 px-4 font-medium">{formatCurrency(row.amount)}</td>
                        <td className="text-right py-3 px-4">{pct.toFixed(1)}%</td>
                        <td className="py-3 px-4">
                          {recoverable ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              Potential Recovery
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                              Final
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}