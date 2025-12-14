import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const performanceData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 550 },
  { name: 'Apr', value: 450 },
  { name: 'May', value: 600 },
  { name: 'Jun', value: 500 },
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
          <TabsList>
            <TabsTrigger value="revenue">Revenue Cycle</TabsTrigger>
            <TabsTrigger value="payor">Payor Performance</TabsTrigger>
            <TabsTrigger value="clinical">Clinical Impact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenue" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}k`} />
                        <Tooltip 
                          cursor={{fill: 'hsl(var(--muted)/0.2)'}}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payor Mix</CardTitle>
                  <CardDescription>Distribution by insurance provider</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
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
                  <div className="flex justify-center gap-4 text-sm">
                    {payorMixData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="payor">
            <Card>
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <BarChart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Payor Performance Analysis</h3>
                <p className="text-muted-foreground max-w-md mt-2">
                  Detailed breakdown of payor compliance rates, denial trends, and average reimbursement timelines coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clinical">
            <Card>
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <BarChart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Clinical Impact Correlation</h3>
                <p className="text-muted-foreground max-w-md mt-2">
                  Analytics correlating clinical outcomes with reimbursement rates and value-based care metrics.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}