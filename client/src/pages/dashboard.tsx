import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  Activity,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

const reimbursementData = [
  { month: "Jan", expected: 4200, actual: 4100 },
  { month: "Feb", expected: 4500, actual: 4300 },
  { month: "Mar", expected: 4800, actual: 4600 },
  { month: "Apr", expected: 4600, actual: 4200 },
  { month: "May", expected: 5100, actual: 4900 },
  { month: "Jun", expected: 5400, actual: 5100 },
];

const varianceByPayor = [
  { name: "BlueCross", value: 12500 },
  { name: "Aetna", value: 8400 },
  { name: "Medicare", value: 15600 },
  { name: "United", value: 6200 },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Financial Overview</h1>
            <p className="text-muted-foreground mt-1">Monitor contract performance and payment variances across all payors.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span>Last 30 Days</span>
            </Button>
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              <span>Export Report</span>
            </Button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expected</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2.4M</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <span className="text-emerald-600 flex items-center mr-1">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> +12%
                </span>
                from last month
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Variances</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">142</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <span className="text-rose-600 flex items-center mr-1">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> +4%
                </span>
                new this week
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recovery Yield</CardTitle>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">88.4%</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <span className="text-emerald-600 flex items-center mr-1">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> +2.1%
                </span>
                compliance rate
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Contracts</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <span className="text-muted-foreground flex items-center mr-1">
                  2 expiring soon
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Reimbursement Trends</CardTitle>
              <CardDescription>
                Comparison of expected vs. actual reimbursement over the last 6 months.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reimbursementData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="expected" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorExpected)" name="Expected" />
                    <Area type="monotone" dataKey="actual" stroke="hsl(var(--chart-2))" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" name="Actual" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Underpayments by Payor</CardTitle>
              <CardDescription>
                Top payors contributing to variance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={varianceByPayor} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} barSize={32} name="Variance Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Recent Variances List */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Variance Alerts</CardTitle>
                  <CardDescription>High priority payment discrepancies requiring attention.</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/variances">View All</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: "V-1023", patient: "JD-9921", payor: "BlueCross", desc: "Dialysis bundled rate mismatch", amount: "-$240.00", status: "Open" },
                  { id: "V-1024", patient: "AS-1102", payor: "Medicare", desc: "Denied claim: Authorization missing", amount: "-$1,200.00", status: "Investigating" },
                  { id: "V-1025", patient: "RK-5501", payor: "Aetna", desc: "Incorrect fee schedule applied", amount: "-$85.50", status: "Open" },
                  { id: "V-1026", patient: "TM-2291", payor: "United", desc: "Partial payment received", amount: "-$125.00", status: "Resolved" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <div className="font-medium">{item.desc}</div>
                        <div className="text-sm text-muted-foreground flex gap-2 mt-0.5">
                          <span className="font-mono">{item.id}</span>
                          <span>•</span>
                          <span>{item.payor}</span>
                          <span>•</span>
                          <span>{item.patient}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">{item.amount}</div>
                      <Badge variant={item.status === "Resolved" ? "secondary" : "outline"} className="mt-1 text-xs">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Live Activity</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
               <div className="space-y-6 border-l ml-3 pl-6">
                 {[
                   { text: "System detected 3 new variances", time: "10 mins ago", type: "alert" },
                   { text: "Arbor Holmes resolved V-1026", time: "45 mins ago", type: "success" },
                   { text: "Medicare 2025 Fee Schedule updated", time: "2 hours ago", type: "info" },
                   { text: "Exported Q2 Financial Report", time: "4 hours ago", type: "info" },
                 ].map((item, i) => (
                   <div key={i} className="relative">
                     <div className={cn(
                       "absolute -left-[30px] top-1 h-2 w-2 rounded-full ring-4 ring-background",
                       item.type === "alert" ? "bg-red-500" :
                       item.type === "success" ? "bg-emerald-500" :
                       "bg-blue-500"
                     )} />
                     <p className="text-sm font-medium leading-none">{item.text}</p>
                     <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}