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
  DollarSign,
  Download,
  ExternalLink,
  ChevronRight,
  Edit,
  Loader2,
  Trash2,
  Upload,
  ChevronDown,
  FileUp,
  Check,
  X,
  MessageSquare,
  Library,
  Send,
  Filter,
  AlertTriangle
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";

interface Contract {
  id: string;
  contractNumber: string;
  contractName: string;
  payorId: string | null;
  payorName: string | null;
  payorType: string | null;
  jurisdiction: string | null;
  contractStatus: string | null;
  effectiveDate: string | null;
  terminationDate: string | null;
  renewalTerms: string | null;
  createdAt: string;
  updatedAt: string;
}

// ESRD Payor Contract Clause Categories
const CLAUSE_CATEGORIES = [
  "Payment & Reimbursement",
  "Coverage & Eligibility",
  "MSP Coordination & COB",
  "Billing & Claims",
  "Variance & Dispute Resolution",
  "Quality & Value-Based",
  "Compliance & Regulatory",
  "Term & Termination",
  "Indemnification & Liability",
  "Data & Privacy",
  "Administrative",
] as const;

type ClauseCategoryType = typeof CLAUSE_CATEGORIES[number];

interface ExtractedClause {
  id: string;
  title: string;
  text: string;
  categoryGuess?: string;
  rationale?: string;
  variables?: string[];
  // Categorization fields
  category?: ClauseCategoryType;
  categoryConfidence?: number;
  // Non-standard detection fields
  isNonStandard?: boolean;
  similarityScore?: number;
  deviationSummary?: string;
  matchedStandardClause?: string;
}

interface ContractUpload {
  id: string;
  fileName: string;
  extractedClauses: ExtractedClause[] | null;
  status: string;
  negotiationLetter?: string;
}

const lifecycleStages = [
  { id: 1, name: "Strategy", status: "complete" },
  { id: 2, name: "Drafting", status: "complete" },
  { id: 3, name: "Negotiation", status: "current" },
  { id: 4, name: "Sign-off", status: "upcoming" },
  { id: 5, name: "Ingestion", status: "upcoming" },
  { id: 6, name: "Config", status: "upcoming" },
  { id: 7, name: "Active", status: "upcoming" },
];

function getStatusBadgeVariant(status: string | null): "default" | "secondary" | "outline" | "destructive" {
  switch (status?.toLowerCase()) {
    case "active": return "secondary";
    case "draft": return "outline";
    case "negotiation": return "default";
    default: return "outline";
  }
}

function getStageNumber(status: string | null): number {
  switch (status?.toLowerCase()) {
    case "draft": return 2;
    case "negotiation": return 3;
    case "review": return 4;
    case "active": return 7;
    default: return 1;
  }
}

export default function Contracts() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<ContractUpload | null>(null);
  const [clauseDecisions, setClauseDecisions] = useState<Record<string, "accept" | "negotiate">>({});
  const [negotiationLetter, setNegotiationLetter] = useState<string>("");
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
  
  // Clause filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showNonStandardOnly, setShowNonStandardOnly] = useState(false);

  // Fetch contracts from API
  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  // Delete contract mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "Contract deleted", description: "The contract has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete contract.", variant: "destructive" });
    }
  });

  const handleNewContract = () => {
    navigate("/drafter");
  };

  const handleEditContract = (contractId: string) => {
    navigate(`/drafter/${contractId}`);
  };

  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setClauseDecisions({});
    setNegotiationLetter("");
    setSelectedCategory("all");
    setShowNonStandardOnly(false);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch("/api/contracts/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const upload = await response.json();
      setCurrentUpload(upload);
      
      // Don't set any default selection - user must explicitly choose Accept or Negotiate
      setClauseDecisions({});

      toast({ title: "PDF processed", description: `Extracted ${upload.extractedClauses?.length || 0} clauses.` });
    } catch (error) {
      toast({ title: "Upload failed", description: "Failed to process the PDF file.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleClauseDecision = (clauseId: string) => {
    setClauseDecisions(prev => ({
      ...prev,
      [clauseId]: prev[clauseId] === "accept" ? "negotiate" : "accept"
    }));
  };

  const handleAddToLibrary = async () => {
    if (!currentUpload) return;

    const acceptedClauseIds = Object.entries(clauseDecisions)
      .filter(([, decision]) => decision === "accept")
      .map(([id]) => id);

    if (acceptedClauseIds.length === 0) {
      toast({ title: "No clauses selected", description: "Mark at least one clause as 'Accept' to add to library.", variant: "destructive" });
      return;
    }

    setIsAddingToLibrary(true);
    try {
      const response = await fetch(`/api/contract-uploads/${currentUpload.id}/add-to-library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clauseIds: acceptedClauseIds }),
      });

      if (!response.ok) throw new Error("Failed to add to library");

      const result = await response.json();
      toast({ title: "Added to library", description: `${result.added} clause(s) added to your clause library.` });
      queryClient.invalidateQueries({ queryKey: ["/api/clauses"] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add clauses to library.", variant: "destructive" });
    } finally {
      setIsAddingToLibrary(false);
    }
  };

  const handleGenerateNegotiationLetter = async () => {
    if (!currentUpload) return;

    const negotiateClauseIds = Object.entries(clauseDecisions)
      .filter(([, decision]) => decision === "negotiate")
      .map(([id]) => id);

    if (negotiateClauseIds.length === 0) {
      toast({ title: "No clauses to negotiate", description: "Mark at least one clause as 'Negotiate' to generate a letter.", variant: "destructive" });
      return;
    }

    setIsGeneratingLetter(true);
    try {
      const response = await fetch(`/api/contract-uploads/${currentUpload.id}/negotiation-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clauseIds: negotiateClauseIds }),
      });

      if (!response.ok) throw new Error("Failed to generate letter");

      const result = await response.json();
      setNegotiationLetter(result.letter);
      toast({ title: "Letter generated", description: "Negotiation letter has been drafted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate negotiation letter.", variant: "destructive" });
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const acceptCount = Object.values(clauseDecisions).filter(d => d === "accept").length;
  const negotiateCount = Object.values(clauseDecisions).filter(d => d === "negotiate").length;

  // Get most recently updated contract for workflow display
  const activeWorkflowContract = contracts.find(c => c.contractStatus === "negotiation") || contracts[0];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Contract Management</h1>
            <p className="text-muted-foreground mt-1">Manage lifecycle, terms, and renewal strategies.</p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2" data-testid="button-new-contract">
                  <Plus className="h-4 w-4" />
                  <span>New Contract</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleNewContract} data-testid="menu-draft-contract">
                  <Edit className="h-4 w-4 mr-2" />
                  Draft New Contract
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUploadDialogOpen(true)} data-testid="menu-upload-pdf">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF Contract
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Hidden file input for PDF upload */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />

          {/* PDF Upload Dialog */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Upload PDF Contract</DialogTitle>
                <DialogDescription>
                  Upload a contract PDF to extract and review clauses. You can then accept or negotiate each clause.
                </DialogDescription>
              </DialogHeader>

              {!currentUpload && !isUploading ? (
                <div 
                  className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="pdf-dropzone"
                >
                  <FileUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">Drop your PDF here or click to upload</p>
                  <p className="text-sm text-muted-foreground mt-2">Maximum file size: 10MB</p>
                </div>
              ) : isUploading ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium">Processing PDF...</p>
                  <p className="text-sm text-muted-foreground mt-2">Extracting clauses using AI. This may take a moment.</p>
                </div>
              ) : currentUpload && (
                <div className="flex-1 overflow-hidden flex gap-4">
                  {/* Left side: Extracted clauses */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">Extracted Clauses</h3>
                        <p className="text-sm text-muted-foreground">
                          {currentUpload.extractedClauses?.length || 0} clauses found • 
                          <span className="text-green-600 ml-1">{acceptCount} Accept</span> • 
                          <span className="text-amber-600 ml-1">{negotiateCount} Negotiate</span>
                          {(currentUpload.extractedClauses || []).filter(c => c.isNonStandard).length > 0 && (
                            <span className="text-red-600 ml-1">
                              • {(currentUpload.extractedClauses || []).filter(c => c.isNonStandard).length} Non-Standard
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleAddToLibrary}
                          disabled={isAddingToLibrary || acceptCount === 0}
                          data-testid="button-add-to-library"
                        >
                          {isAddingToLibrary ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Library className="h-4 w-4 mr-2" />}
                          Add Accepted to Library
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleGenerateNegotiationLetter}
                          disabled={isGeneratingLetter || negotiateCount === 0}
                          data-testid="button-generate-letter"
                        >
                          {isGeneratingLetter ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                          Draft Negotiation Letter
                        </Button>
                      </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Filters:</Label>
                      </div>
                      
                      {/* Category Filter */}
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[200px] h-8" data-testid="select-category-filter">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {CLAUSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Non-Standard Toggle */}
                      <div className="flex items-center gap-2">
                        <Switch
                          id="nonstandard-filter"
                          checked={showNonStandardOnly}
                          onCheckedChange={setShowNonStandardOnly}
                          data-testid="switch-nonstandard-filter"
                        />
                        <Label htmlFor="nonstandard-filter" className="text-sm flex items-center gap-1 cursor-pointer">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                          Non-Standard Only
                        </Label>
                      </div>
                    </div>
                    
                    <ScrollArea className="flex-1 pr-4">
                      {(() => {
                        // Filter clauses first
                        const filteredClauses = (currentUpload.extractedClauses || []).filter(clause => {
                          if (selectedCategory !== "all" && clause.category !== selectedCategory) return false;
                          if (showNonStandardOnly && !clause.isNonStandard) return false;
                          return true;
                        });

                        // Group by category
                        const groupedClauses: Record<string, ExtractedClause[]> = {};
                        filteredClauses.forEach(clause => {
                          const cat = clause.category || "Uncategorized";
                          if (!groupedClauses[cat]) groupedClauses[cat] = [];
                          groupedClauses[cat].push(clause);
                        });

                        const categoryKeys = Object.keys(groupedClauses);

                        if (categoryKeys.length === 0) {
                          return (
                            <div className="text-center py-8 text-muted-foreground">
                              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No clauses match the current filters</p>
                              <Button 
                                variant="link" 
                                size="sm"
                                onClick={() => {
                                  setSelectedCategory("all");
                                  setShowNonStandardOnly(false);
                                }}
                              >
                                Clear filters
                              </Button>
                            </div>
                          );
                        }

                        // Render clause card helper
                        const renderClauseCard = (clause: ExtractedClause) => (
                          <Card 
                            key={clause.id} 
                            className={cn(
                              "transition-colors",
                              clauseDecisions[clause.id] === "negotiate" && "border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10",
                              clause.isNonStandard && "border-red-500/50 bg-red-50/30 dark:bg-red-900/10"
                            )}
                            data-testid={`clause-card-${clause.id}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h4 className="font-medium">{clause.title}</h4>
                                    {clause.categoryConfidence && (
                                      <span className="text-xs text-muted-foreground">({clause.categoryConfidence}% conf)</span>
                                    )}
                                    {clause.isNonStandard && (
                                      <Badge variant="destructive" className="text-xs gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Non-Standard
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-3">{clause.text}</p>
                                  
                                  {/* Non-standard deviation explanation */}
                                  {clause.isNonStandard && clause.deviationSummary && (
                                    <div className="mt-3 p-2 bg-red-100/50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                      <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <p className="text-xs font-medium text-red-800 dark:text-red-300">
                                            Deviation from Standard
                                            {clause.similarityScore !== undefined && (
                                              <span className="ml-2 text-red-600">
                                                (Similarity: {clause.similarityScore}%)
                                              </span>
                                            )}
                                          </p>
                                          <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                                            {clause.deviationSummary}
                                          </p>
                                          {clause.matchedStandardClause && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Expected: {clause.matchedStandardClause}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {clause.rationale && !clause.isNonStandard && (
                                    <p className="text-xs text-muted-foreground mt-2 italic">
                                      Importance: {clause.rationale}
                                    </p>
                                  )}
                                  {clause.variables && clause.variables.length > 0 && (
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                      {clause.variables.map((v, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Button
                                    size="sm"
                                    variant={clauseDecisions[clause.id] === "accept" ? "default" : "outline"}
                                    className="w-24"
                                    onClick={() => setClauseDecisions(prev => ({ ...prev, [clause.id]: "accept" }))}
                                    data-testid={`button-accept-${clause.id}`}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={clauseDecisions[clause.id] === "negotiate" ? "default" : "outline"}
                                    className={cn("w-24", clauseDecisions[clause.id] === "negotiate" && "bg-amber-500 hover:bg-amber-600")}
                                    onClick={() => setClauseDecisions(prev => ({ ...prev, [clause.id]: "negotiate" }))}
                                    data-testid={`button-negotiate-${clause.id}`}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Negotiate
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );

                        return (
                          <Accordion type="multiple" defaultValue={categoryKeys} className="space-y-2">
                            {categoryKeys.map((category) => {
                              const clauses = groupedClauses[category];
                              const nonStandardCount = clauses.filter(c => c.isNonStandard).length;
                              
                              return (
                                <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                                  <AccordionTrigger className="hover:no-underline" data-testid={`accordion-${category}`}>
                                    <div className="flex items-center gap-3">
                                      <span className="font-semibold">{category}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {clauses.length} clause{clauses.length !== 1 ? 's' : ''}
                                      </Badge>
                                      {nonStandardCount > 0 && (
                                        <Badge variant="destructive" className="text-xs gap-1">
                                          <AlertTriangle className="h-3 w-3" />
                                          {nonStandardCount} non-standard
                                        </Badge>
                                      )}
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-3 pt-2">
                                      {clauses.map(renderClauseCard)}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                        );
                      })()}
                    </ScrollArea>
                  </div>

                  {/* Right side: Negotiation letter */}
                  {negotiationLetter && (
                    <div className="w-[400px] flex flex-col border-l pl-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Negotiation Letter</h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(negotiationLetter);
                            toast({ title: "Copied", description: "Letter copied to clipboard." });
                          }}
                          data-testid="button-copy-letter"
                        >
                          Copy
                        </Button>
                      </div>
                      <div 
                        className="flex-1 min-h-[400px] font-mono text-sm p-3 border rounded-md bg-background overflow-y-auto whitespace-pre-wrap"
                        data-testid="div-negotiation-letter"
                        dangerouslySetInnerHTML={{
                          __html: negotiationLetter.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="mt-4">
                {currentUpload && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCurrentUpload(null);
                      setClauseDecisions({});
                      setNegotiationLetter("");
                      setSelectedCategory("all");
                      setShowNonStandardOnly(false);
                    }}
                    data-testid="button-upload-another"
                  >
                    Upload Another PDF
                  </Button>
                )}
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)} data-testid="button-close-dialog">
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lifecycle Visualizer (for the active context) */}
        {activeWorkflowContract && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Active Workflow: {activeWorkflowContract.contractName}</CardTitle>
              <CardDescription>Current stage: {activeWorkflowContract.contractStatus || "Draft"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0"></div>
                <div className="flex justify-between relative z-10 overflow-x-auto pb-2">
                  {lifecycleStages.map((stage) => {
                    const currentStage = getStageNumber(activeWorkflowContract.contractStatus);
                    const stageStatus = stage.id < currentStage ? "complete" : stage.id === currentStage ? "current" : "upcoming";
                    
                    return (
                      <div key={stage.id} className="flex flex-col items-center gap-2 min-w-[60px]">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background",
                          stageStatus === "complete" ? "border-primary text-primary" :
                          stageStatus === "current" ? "border-primary bg-primary text-primary-foreground" :
                          "border-muted text-muted-foreground"
                        )}>
                          {stageStatus === "complete" ? <CheckCircle2 className="h-4 w-4" /> : 
                           stageStatus === "current" ? <Clock className="h-4 w-4" /> :
                           <span className="text-xs">{stage.id}</span>}
                        </div>
                        <span className={cn(
                          "text-xs font-medium whitespace-nowrap",
                          stageStatus === "current" ? "text-foreground" : "text-muted-foreground"
                        )}>{stage.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold">All Contracts ({contracts.length})</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : contracts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-2">No contracts yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Create your first contract to get started.</p>
                  <Button onClick={handleNewContract} data-testid="button-create-first-contract">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Contract
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <Sheet key={contract.id}>
                    <SheetTrigger asChild>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer group" data-testid={`contract-card-${contract.id}`}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-start gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900/20 p-2.5 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-primary group-hover:text-white transition-colors">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-base flex items-center gap-2">
                                  {contract.contractName}
                                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                              </div>
                              <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                                <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">{contract.contractNumber}</span>
                                {contract.payorName && <span>{contract.payorName}</span>}
                                {contract.jurisdiction && <span>{contract.jurisdiction}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={getStatusBadgeVariant(contract.contractStatus)} className="mb-1">
                              {contract.contractStatus || "Draft"}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              Updated: {new Date(contract.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </SheetTrigger>
                    <SheetContent className="w-[600px] sm:w-[540px] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="text-xl font-display">{contract.contractName}</SheetTitle>
                        <SheetDescription>
                          Contract ID: <span className="font-mono text-xs text-foreground">{contract.contractNumber}</span>
                        </SheetDescription>
                      </SheetHeader>
                      
                      <div className="mt-8">
                          <div className="flex items-center gap-4 mb-8">
                              <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg w-24">
                                  <span className="text-xs text-muted-foreground mb-1">Status</span>
                                  <Badge>{contract.contractStatus || "Draft"}</Badge>
                              </div>
                              <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg w-32">
                                  <span className="text-xs text-muted-foreground mb-1">Payor</span>
                                  <span className="font-medium text-sm">{contract.payorName || "—"}</span>
                              </div>
                              <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg w-32">
                                  <span className="text-xs text-muted-foreground mb-1">Jurisdiction</span>
                                  <span className="font-medium text-sm">{contract.jurisdiction || "—"}</span>
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
                                              Contract Details
                                          </h4>
                                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                                              <span className="text-muted-foreground">Payor Type</span>
                                              <span className="text-right font-medium">{contract.payorType || "—"}</span>
                                              <span className="text-muted-foreground">Effective Date</span>
                                              <span className="text-right font-medium">{contract.effectiveDate || "Not set"}</span>
                                              <span className="text-muted-foreground">Termination Date</span>
                                              <span className="text-right font-medium">{contract.terminationDate || "Not set"}</span>
                                          </div>
                                      </div>
                                      {contract.renewalTerms && (
                                        <div className="border rounded-md p-4">
                                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                                Renewal Terms
                                            </h4>
                                            <p className="text-sm text-muted-foreground">{contract.renewalTerms}</p>
                                        </div>
                                      )}
                                  </div>
                              </TabsContent>
                              <TabsContent value="docs" className="space-y-4 mt-6">
                                  <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No documents attached yet.</p>
                                  </div>
                              </TabsContent>
                              <TabsContent value="history" className="mt-6">
                                  <div className="space-y-6 relative border-l ml-4 pl-6 py-2">
                                      <div className="relative">
                                          <div className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background"></div>
                                          <p className="font-medium text-sm">Contract created</p>
                                          <p className="text-xs text-muted-foreground">
                                            {new Date(contract.createdAt).toLocaleString()}
                                          </p>
                                      </div>
                                      {contract.updatedAt !== contract.createdAt && (
                                        <div className="relative">
                                            <div className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-muted ring-4 ring-background"></div>
                                            <p className="font-medium text-sm">Last updated</p>
                                            <p className="text-xs text-muted-foreground">
                                              {new Date(contract.updatedAt).toLocaleString()}
                                            </p>
                                        </div>
                                      )}
                                  </div>
                              </TabsContent>
                          </Tabs>
                      </div>

                      <div className="mt-8 flex gap-3">
                          <Button 
                            className="flex-1" 
                            onClick={() => handleEditContract(contract.id)}
                            data-testid={`button-edit-contract-${contract.id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Contract
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon"
                            onClick={() => deleteMutation.mutate(contract.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-contract-${contract.id}`}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                      </div>

                    </SheetContent>
                  </Sheet>
                ))}
              </div>
            )}
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
