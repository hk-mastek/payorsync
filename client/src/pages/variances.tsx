import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Filter, Download, ArrowUpDown, MoreHorizontal, ChevronRight, AlertCircle, CheckCircle2, FileSearch } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const varianceData = [
  { id: "V-2023-001", patient: "John Smith", mrn: "882101", payor: "BlueCross Shield", serviceDate: "2024-05-12", billed: 4500.00, allowed: 2100.00, paid: 1850.00, variance: -250.00, status: "Open", type: "Underpayment" },
  { id: "V-2023-002", patient: "Maria Garcia", mrn: "991022", payor: "Medicare A", serviceDate: "2024-05-14", billed: 3200.00, allowed: 850.00, paid: 0.00, variance: -850.00, status: "Investigating", type: "Denial" },
  { id: "V-2023-003", patient: "Robert Chen", mrn: "112933", payor: "Aetna PPO", serviceDate: "2024-05-15", billed: 5100.00, allowed: 3400.00, paid: 3400.00, variance: 0.00, status: "Closed", type: "Match" },
  { id: "V-2023-004", patient: "Sarah Johnson", mrn: "772199", payor: "United Health", serviceDate: "2024-05-18", billed: 4500.00, allowed: 2100.00, paid: 2050.00, variance: -50.00, status: "Open", type: "Underpayment" },
  { id: "V-2023-005", patient: "David Wilson", mrn: "332101", payor: "Cigna", serviceDate: "2024-05-20", billed: 2800.00, allowed: 1200.00, paid: 1100.00, variance: -100.00, status: "Pending Appeal", type: "Underpayment" },
  { id: "V-2023-006", patient: "Emily Davis", mrn: "442111", payor: "BlueCross Shield", serviceDate: "2024-05-21", billed: 4500.00, allowed: 2100.00, paid: 2100.00, variance: 0.00, status: "Closed", type: "Match" },
  { id: "V-2023-007", patient: "Michael Brown", mrn: "551022", payor: "Medicare A", serviceDate: "2024-05-22", billed: 3200.00, allowed: 850.00, paid: 800.00, variance: -50.00, status: "Open", type: "Underpayment" },
  { id: "V-2023-008", patient: "Lisa Taylor", mrn: "661033", payor: "Aetna PPO", serviceDate: "2024-05-24", billed: 5100.00, allowed: 3400.00, paid: 0.00, variance: -3400.00, status: "Investigating", type: "Denial" },
];

export default function Variances() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Variance Analysis</h1>
            <p className="text-muted-foreground mt-1">Identify, prioritize, and resolve payment discrepancies.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
            <Button className="gap-2">
              <Filter className="h-4 w-4" />
              <span>Advanced Filter</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payor</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select Payor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payors</SelectItem>
                  <SelectItem value="bcbs">BlueCross Shield</SelectItem>
                  <SelectItem value="medicare">Medicare</SelectItem>
                  <SelectItem value="aetna">Aetna</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Variance Type</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="underpayment">Underpayment</SelectItem>
                  <SelectItem value="denial">Denial</SelectItem>
                  <SelectItem value="overpayment">Overpayment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input placeholder="Search by Patient or MRN..." />
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader className="p-4 md:p-6 pb-2">
            <CardTitle>Variance Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Patient / MRN</TableHead>
                  <TableHead>Payor</TableHead>
                  <TableHead>Service Date</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {varianceData.map((row) => (
                  <Sheet key={row.id}>
                    <SheetTrigger asChild>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{row.patient}</div>
                          <div className="text-xs text-muted-foreground">MRN: {row.mrn}</div>
                        </TableCell>
                        <TableCell>{row.payor}</TableCell>
                        <TableCell>{row.serviceDate}</TableCell>
                        <TableCell className="text-right font-mono">${row.allowed.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">${row.paid.toFixed(2)}</TableCell>
                        <TableCell className={cn("text-right font-mono font-medium", row.variance < 0 ? "text-red-600" : "text-green-600")}>
                          {row.variance.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            row.status === "Open" ? "destructive" : 
                            row.status === "Closed" ? "secondary" : 
                            "outline"
                          }>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </SheetTrigger>
                    <SheetContent className="w-[600px] sm:w-[600px] overflow-y-auto">
                      <SheetHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={row.status === "Open" ? "destructive" : "outline"}>
                            {row.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground font-mono">{row.id}</span>
                        </div>
                        <SheetTitle className="text-xl font-display">{row.type} Detected</SheetTitle>
                        <SheetDescription>
                          Discrepancy identified on {row.serviceDate} for {row.patient}.
                        </SheetDescription>
                      </SheetHeader>

                      <div className="mt-6 space-y-6">
                        {/* Financial Summary */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg bg-secondary/50 border">
                            <p className="text-xs text-muted-foreground mb-1">Expected</p>
                            <p className="text-lg font-bold">${row.allowed.toFixed(2)}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-secondary/50 border">
                            <p className="text-xs text-muted-foreground mb-1">Actual Paid</p>
                            <p className="text-lg font-bold">${row.paid.toFixed(2)}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                            <p className="text-xs text-red-600 dark:text-red-400 mb-1">Variance</p>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">{row.variance.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Root Cause Analysis */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <FileSearch className="h-4 w-4 text-primary" />
                              Root Cause Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex gap-3">
                                <div className="mt-0.5">
                                  <AlertCircle className="h-4 w-4 text-amber-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Bundled Rate Mismatch</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Payor applied a standard bundled rate of $200.00, but the contract specifies a carve-out for training add-on ($50.00) which was ignored.
                                  </p>
                                </div>
                              </div>
                              <Separator />
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Contract Reference</p>
                                <div className="p-2 bg-muted rounded text-xs font-mono">
                                  Section 4.2.1: Training Add-on Reimbursement
                                  <br/>
                                  "Provider shall be reimbursed an additional $50.00 per session..."
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Action Plan */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Recommended Actions</h4>
                          <Button className="w-full justify-start gap-2" variant="outline">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Initiate Bulk Appeal (Code 421)
                          </Button>
                          <Button className="w-full justify-start gap-2" variant="outline">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Update Fee Schedule Config
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}