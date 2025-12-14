import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, 
  FileText, 
  History, 
  Users, 
  Scale, 
  AlertTriangle,
  Gavel,
  CheckCircle2
} from "lucide-react";

export default function Governance() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Governance & Compliance</h1>
          <p className="text-muted-foreground mt-1">Audit logs, user access controls, and policy management.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
             {/* Rules Engine Section */}
             <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Variance Logic Configuration</CardTitle>
                  <CardDescription>Rules defining automated underpayment flagging.</CardDescription>
                </div>
                <Button variant="outline" size="sm">Edit Rules</Button>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                  <div className="flex items-start gap-3">
                    <Scale className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Threshold Tolerance</p>
                      <p className="text-sm text-muted-foreground">Variances under $50.00 are auto-resolved.</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                  <div className="flex items-start gap-3">
                    <Gavel className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Stop-Loss Detection</p>
                      <p className="text-sm text-muted-foreground">Flag claims exceeding $10k for manual review.</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Bundled Rate Integrity</p>
                      <p className="text-sm text-muted-foreground">Validate separate line items against bundled rules.</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Audit Logs</CardTitle>
                <CardDescription>Track all system modifications and access events.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    {[
                      { user: "Sarah Johnson", action: "Updated Fee Schedule", target: "Medicare 2024", time: "2 hours ago", type: "config" },
                      { user: "System", action: "Automated Ingestion", target: "BCBS Contract v2", time: "5 hours ago", type: "system" },
                      { user: "Michael Brown", action: "Overrode Variance", target: "V-2023-001", time: "1 day ago", type: "user" },
                      { user: "Sarah Johnson", action: "User Access Grant", target: "Role: Analyst", time: "2 days ago", type: "security" },
                      { user: "David Wilson", action: "Exported Report", target: "Q2 Variances", time: "2 days ago", type: "user" },
                    ].map((log, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="mt-1 bg-secondary p-2 rounded-full">
                          {log.type === 'security' ? <ShieldCheck className="h-4 w-4" /> :
                           log.type === 'system' ? <History className="h-4 w-4" /> :
                           <Users className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{log.action}</p>
                            <span className="text-xs text-muted-foreground">{log.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">{log.user}</span> • {log.target}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">HIPAA Compliance</span>
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Passed
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SOC2 Type II</span>
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Certified
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Access Reviews</span>
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20">Due in 5 days</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Documents</CardTitle>
                <CardDescription>Active governance policies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Variance Threshold Policy", date: "Updated Mar 2024" },
                  { name: "Contract Approval Matrix", date: "Updated Jan 2024" },
                  { name: "Data Retention Guidelines", date: "Updated Dec 2023" },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 hover:bg-secondary rounded-md cursor-pointer transition-colors group">
                    <FileText className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Audit Report
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Review Access Policies
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}