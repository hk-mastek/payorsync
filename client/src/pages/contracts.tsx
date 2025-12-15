import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus,
  Calendar,
  DollarSign,
  Download,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const lifecycleStages = [
  { id: 1, name: "Strategy", status: "complete" },
  { id: 2, name: "Drafting", status: "complete" },
  { id: 3, name: "Negotiation", status: "current" },
  { id: 4, name: "Sign-off", status: "upcoming" },
  { id: 5, name: "Ingestion", status: "upcoming" },
  { id: 6, name: "Config", status: "upcoming" },
  { id: 7, name: "Active", status: "upcoming" },
];

const contracts = [
  { id: "C-2024-BCBS", name: "BlueCross Shield Regional 2024", payor: "BlueCross", status: "Negotiation", stage: 3, value: "$12.5M", renewal: "2026-12-31" },
  { id: "C-2023-UHC", name: "United Healthcare National", payor: "United", status: "Active", stage: 7, value: "$45.2M", renewal: "2025-06-30" },
  { id: "C-2024-AET", name: "Aetna PPO Amendment", payor: "Aetna", status: "Drafting", stage: 2, value: "$8.1M", renewal: "2025-12-31" },
  { id: "C-2022-MED", name: "Medicare Fee Schedule 2024", payor: "Medicare", status: "Active", stage: 7, value: "N/A", renewal: "Annual" },
  { id: "C-2024-CIG", name: "Cigna Specialist Agreement", payor: "Cigna", status: "Review", stage: 4, value: "$5.4M", renewal: "2027-01-01" },
];

export default function Contracts() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Contract Management</h1>
            <p className="text-muted-foreground mt-1">Manage lifecycle, terms, and renewal strategies.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>New Contract</span>
          </Button>
        </div>

        {/* Lifecycle Visualizer (for the active context) */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Active Workflow: BCBS Regional 2024</CardTitle>
            <CardDescription>Current stage: Negotiation (Round 2)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0"></div>
              <div className="flex justify-between relative z-10 overflow-x-auto pb-2">
                {lifecycleStages.map((stage) => (
                  <div key={stage.id} className="flex flex-col items-center gap-2 min-w-[60px]">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background",
                      stage.status === "complete" ? "border-primary text-primary" :
                      stage.status === "current" ? "border-primary bg-primary text-primary-foreground" :
                      "border-muted text-muted-foreground"
                    )}>
                      {stage.status === "complete" ? <CheckCircle2 className="h-4 w-4" /> : 
                       stage.status === "current" ? <Clock className="h-4 w-4" /> :
                       <span className="text-xs">{stage.id}</span>}
                    </div>
                    <span className={cn(
                      "text-xs font-medium whitespace-nowrap",
                      stage.status === "current" ? "text-foreground" : "text-muted-foreground"
                    )}>{stage.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold">All Contracts</h2>
            <div className="space-y-3">
              {contracts.map((contract) => (
                <Sheet key={contract.id}>
                  <SheetTrigger asChild>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <div className="bg-blue-100 dark:bg-blue-900/20 p-2.5 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-primary group-hover:text-white transition-colors">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-base flex items-center gap-2">
                                {contract.name}
                                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                            </div>
                            <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                              <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">{contract.id}</span>
                              <span>{contract.payor}</span>
                              <span>Est. Value: {contract.value}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={contract.status === "Active" ? "secondary" : "outline"} className="mb-1">
                            {contract.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">Renew: {contract.renewal}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </SheetTrigger>
                  <SheetContent className="w-[600px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle className="text-xl font-display">{contract.name}</SheetTitle>
                      <SheetDescription>
                        Contract ID: <span className="font-mono text-xs text-foreground">{contract.id}</span>
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="mt-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg w-24">
                                <span className="text-xs text-muted-foreground mb-1">Status</span>
                                <Badge>{contract.status}</Badge>
                            </div>
                            <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg w-32">
                                <span className="text-xs text-muted-foreground mb-1">Value</span>
                                <span className="font-bold">{contract.value}</span>
                            </div>
                            <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg w-32">
                                <span className="text-xs text-muted-foreground mb-1">Renewal</span>
                                <span className="font-medium">{contract.renewal}</span>
                            </div>
                        </div>

                        <Tabs defaultValue="terms">
                            <TabsList className="w-full">
                                <TabsTrigger value="terms" className="flex-1">Terms & Rates</TabsTrigger>
                                <TabsTrigger value="docs" className="flex-1">Documents</TabsTrigger>
                                <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                            </TabsList>
                            <TabsContent value="terms" className="space-y-4 mt-6">
                                <div className="space-y-4">
                                    <div className="border rounded-md p-4">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-primary" />
                                            Reimbursement Structure
                                        </h4>
                                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                                            <span className="text-muted-foreground">Base Rate (Hemodialysis)</span>
                                            <span className="text-right font-mono">$285.00 / session</span>
                                            <span className="text-muted-foreground">Training Add-on</span>
                                            <span className="text-right font-mono">$45.00 / session</span>
                                            <span className="text-muted-foreground">Stop-Loss Threshold</span>
                                            <span className="text-right font-mono">$10,000 / month</span>
                                        </div>
                                    </div>
                                    <div className="border rounded-md p-4">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            Special Provisions
                                        </h4>
                                        <ul className="text-sm list-disc pl-4 space-y-1 text-muted-foreground">
                                            <li>Requires authorization for &gt;14 treatments/month.</li>
                                            <li>Vascular access monitoring required quarterly.</li>
                                            <li>EPO bundled up to 20k units.</li>
                                        </ul>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="docs" className="space-y-4 mt-6">
                                {[
                                    { name: "Master Service Agreement.pdf", size: "2.4 MB", date: "2023-11-15" },
                                    { name: "2024 Fee Schedule.xlsx", size: "1.1 MB", date: "2023-12-01" },
                                    { name: "Amendment 1 - Telehealth.pdf", size: "0.5 MB", date: "2024-02-10" }
                                ].map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-8 w-8 text-primary/80" strokeWidth={1.5} />
                                            <div>
                                                <p className="font-medium text-sm">{doc.name}</p>
                                                <p className="text-xs text-muted-foreground">{doc.size} • {doc.date}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </TabsContent>
                            <TabsContent value="history" className="mt-6">
                                <div className="space-y-6 relative border-l ml-4 pl-6 py-2">
                                    {[
                                        { action: "Contract signed", user: "Sarah Holmes", date: "2023-12-15" },
                                        { action: "Legal review completed", user: "Legal Team", date: "2023-12-10" },
                                        { action: "Draft uploaded", user: "Sarah Smith", date: "2023-11-20" }
                                    ].map((event, i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background"></div>
                                            <p className="font-medium text-sm">{event.action}</p>
                                            <p className="text-xs text-muted-foreground">{event.user} • {event.date}</p>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <Button className="flex-1">Edit Contract</Button>
                        <Button variant="outline" className="flex-1">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View in Oracle
                        </Button>
                    </div>

                  </SheetContent>
                </Sheet>
              ))}
            </div>
          </div>

          {/* Alerts & Tasks */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Obligation Alerts</h2>
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-4 space-y-4">
                    <div className="flex gap-3 items-start p-3 bg-amber-50 dark:bg-amber-900/10 rounded-md border border-amber-100 dark:border-amber-900/20">
                      <Clock className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Fee Schedule Update Required</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Medicare 2025 rates released. Update configuration by Oct 1.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start p-3 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-100 dark:border-red-900/20">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">Expiring: United Healthcare</p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">Notice of non-renewal deadline in 14 days.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start p-3 hover:bg-muted rounded-md transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Review Aetna Amendment</p>
                        <p className="text-xs text-muted-foreground mt-1">Legal review completed. Ready for signature.</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}