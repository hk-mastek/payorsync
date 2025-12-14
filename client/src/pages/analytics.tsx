import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { ArrowDownRight, ArrowUpRight, TrendingUp, AlertCircle, Clock } from "lucide-react";

const revenueTrend = [
  { month: 'Jan', expected: 4200, actual: 4100, denialRate: 2.4 },
  { month: 'Feb', expected: 4500, actual: 4300, denialRate: 4.1 },
  { month: 'Mar', expected: 4800, actual: 4600, denialRate: 3.2 },
  { month: 'Apr', expected: 4600, actual: 4200, denialRate: 5.8 },
  { month: 'May', expected: 5100, actual: 4900, denialRate: 2.1 },
  { month: 'Jun', expected: 5400, actual: 5100, denialRate: 1.9 },
];

const payorPerformance = [
  { name: 'BlueCross', compliance: 98.2, daysToPay: 34, denialRate: 3.2 },
  { name: 'Medicare', compliance: 99.8, daysToPay: 14, denialRate: 1.1 },
  { name: 'United', compliance: 94.5, daysToPay: 45, denialRate: 8.4 },
  { name: 'Aetna', compliance: 96.1, daysToPay: 38, denialRate: 4.5 },
  { name: 'Cigna', compliance: 95.4, daysToPay: 41, denialRate: 5.2 },
];

const clinicalCorrelation = [
  { metric: 'Kt/V > 1.2', correlation: 0.85, impact: 'High' },
  { metric: 'Missed Treatments', correlation: -0.92, impact: 'Critical' },
  { metric: 'Vascular Access Type', correlation: 0.64, impact: 'Medium' },
  { metric: 'Fluid Management', correlation: 0.71, impact: 'High' },
];

const payorMixData = [
  { name: 'Medicare', value: 45, color: 'hsl(var(--chart-1))' },
  { name: 'BlueCross', value: 25, color: 'hsl(var(--chart-2))' },
  { name: 'United', value: 20, color: 'hsl(var(--chart-3))' },
  { name: 'Aetna', value: 10, color: 'hsl(var(--chart-4))' },
];

export default function Analytics() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Analytics & Insights</h1>
          <p className="text-muted-foreground mt-1">Deep dive into financial performance and operational metrics.</p>
        </div>

        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="revenue">Revenue Cycle</TabsTrigger>
            <TabsTrigger value="payor">Payor Performance</TabsTrigger>
            <TabsTrigger value="clinical">Clinical Impact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenue" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-muted-foreground">Net Collection Rate</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">96.4%</div>
                   <p className="text-xs text-muted-foreground flex items-center mt-1">
                     <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                     +1.2% vs benchmark
                   </p>
                 </CardContent>
               </Card>
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-muted-foreground">Days Sales Outstanding</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">38 Days</div>
                   <p className="text-xs text-muted-foreground flex items-center mt-1">
                     <ArrowDownRight className="h-3 w-3 mr-1 text-emerald-500" />
                     -4 days from last qtr
                   </p>
                 </CardContent>
               </Card>
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-muted-foreground">Denial Rate</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">3.8%</div>
                   <p className="text-xs text-muted-foreground flex items-center mt-1">
                     <ArrowUpRight className="h-3 w-3 mr-1 text-red-500" />
                     +0.5% spike in May
                   </p>
                 </CardContent>
               </Card>
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-muted-foreground">Clean Claim Rate</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">94.2%</div>
                   <p className="text-xs text-muted-foreground mt-1">Target: 95%</p>
                 </CardContent>
               </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue vs. Denial Trends</CardTitle>
                  <CardDescription>Correlating revenue volume with denial spikes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--destructive))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} name="Actual Revenue" dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="denialRate" stroke="hsl(var(--destructive))" strokeWidth={2} name="Denial Rate %" dot={true} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payor Mix</CardTitle>
                  <CardDescription>Revenue distribution by source.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={payorMixData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {payorMixData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2 text-sm mt-4">
                    {payorMixData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-mono font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="payor" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payor Scorecard</CardTitle>
                <CardDescription>Benchmarking performance across major insurance providers.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payorPerformance} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[80, 100]} hide />
                      <YAxis type="category" dataKey="name" stroke="hsl(var(--foreground))" fontSize={14} tickLine={false} axisLine={false} width={100} />
                      <Tooltip 
                        cursor={{fill: 'hsl(var(--muted)/0.2)'}}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Bar dataKey="compliance" name="Contract Compliance %" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  {payorPerformance.map((payor) => (
                    <div key={payor.name} className="flex flex-col gap-2 p-4 border rounded-lg bg-card/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">{payor.name}</span>
                        {payor.denialRate > 5 && <AlertCircle className="h-4 w-4 text-destructive" />}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Days to Pay</span>
                        <span className="font-mono">{payor.daysToPay}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Denial Rate</span>
                        <span className={payor.denialRate > 5 ? "text-destructive font-bold" : "font-mono"}>{payor.denialRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clinical" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Clinical Outcomes vs. Reimbursement</CardTitle>
                  <CardDescription>Impact of quality metrics on value-based payments.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {clinicalCorrelation.map((item) => (
                      <div key={item.metric} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.metric}</span>
                          <span className={
                            item.impact === 'Critical' ? "text-destructive font-bold" :
                            item.impact === 'High' ? "text-amber-600 font-semibold" :
                            "text-muted-foreground"
                          }>{item.impact} Impact</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${Math.abs(item.correlation) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.correlation > 0 ? "Positive" : "Negative"} correlation factor of {item.correlation}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
                <CardHeader>
                  <CardTitle className="text-white">AI Insight</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg font-medium leading-relaxed">
                    "Reducing missed treatments by <span className="text-emerald-300 font-bold">5%</span> is projected to decrease hospitalization-related denials by <span className="text-emerald-300 font-bold">12%</span> over the next quarter."
                  </p>
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm text-blue-100">
                      <TrendingUp className="h-4 w-4" />
                      <span>Projected Revenue Impact: <strong>+$145,000 / yr</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}