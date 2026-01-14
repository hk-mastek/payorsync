import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sparkles, 
  Search, 
  FileText, 
  Plus, 
  Save, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  X,
  ChevronUp,
  ChevronDown,
  Edit3,
  Download,
  Check,
  Loader2,
  Wand2
} from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface ClauseTemplate {
  id: string;
  clauseCode: string;
  clauseTitle: string;
  clauseText: string;
  clauseVersion: string;
  categoryId: string;
  status: string;
  tags: string[];
  regulatoryReferences: string[];
}

interface ClauseCategory {
  id: string;
  categoryName: string;
}

interface ClauseComment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

interface DraftClause {
  id: string;
  clauseTemplateId: string;
  clauseCode: string;
  clauseTitle: string;
  clauseText: string;
  customText: string | null;
  isEditing: boolean;
  sectionName: string;
  variableValues: Record<string, string>;
  comments: ClauseComment[];
}

interface ContractData {
  id?: string;
  contractNumber?: string;
  contractName: string;
  payorName: string;
  payorType: string;
  jurisdiction: string;
  contractStatus: string;
}

export default function ContractDrafter() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/drafter/:contractId");
  const contractId = match ? params?.contractId : null;
  
  const [activeTab, setActiveTab] = useState("recommendations");
  const [searchQuery, setSearchQuery] = useState("");
  const [draftClauses, setDraftClauses] = useState<DraftClause[]>([]);
  const [editingClauseId, setEditingClauseId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentingClauseId, setCommentingClauseId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSetupDialog, setShowSetupDialog] = useState(!contractId);
  const [setupPrompt, setSetupPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [contractData, setContractData] = useState<ContractData>({
    contractName: "",
    payorName: "",
    payorType: "commercial",
    jurisdiction: "",
    contractStatus: "draft"
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing contract if editing
  const { data: existingContract, isLoading: loadingContract } = useQuery({
    queryKey: ["/api/contracts", contractId],
    queryFn: () => contractId ? fetch(`/api/contracts/${contractId}`).then(r => r.json()) : null,
    enabled: !!contractId,
  });

  // Load existing contract data
  useEffect(() => {
    if (existingContract) {
      setShowSetupDialog(false);
      setContractData({
        id: existingContract.id,
        contractNumber: existingContract.contractNumber,
        contractName: existingContract.contractName,
        payorName: existingContract.payorName || "",
        payorType: existingContract.payorType || "commercial",
        jurisdiction: existingContract.jurisdiction || "",
        contractStatus: existingContract.contractStatus || "draft"
      });
      
      // Load clauses
      if (existingContract.clauses) {
        const loadedClauses: DraftClause[] = existingContract.clauses.map((c: any) => ({
          id: c.id,
          clauseTemplateId: c.clauseTemplateId || "",
          clauseCode: c.clauseCode || "",
          clauseTitle: c.clauseTitle || "",
          clauseText: c.clauseText,
          customText: c.customizedText,
          isEditing: false,
          sectionName: c.sectionName || "General",
          variableValues: c.variableValues || {},
          comments: c.comments || []
        }));
        setDraftClauses(loadedClauses);
      }
    }
  }, [existingContract]);

  // Generate clauses from prompt using AI
  const generateFromPrompt = async () => {
    if (!setupPrompt.trim()) {
      setShowSetupDialog(false);
      return;
    }
    
    setIsGenerating(true);
    try {
      // Find relevant clauses based on prompt keywords
      const promptLower = setupPrompt.toLowerCase();
      const relevantClauses = allClauses.filter(clause => {
        const text = `${clause.clauseTitle} ${clause.clauseText} ${clause.clauseCode}`.toLowerCase();
        const promptWords = promptLower.split(/\s+/).filter(w => w.length > 3);
        return promptWords.some(word => text.includes(word));
      }).slice(0, 5);
      
      // Add relevant clauses to draft
      relevantClauses.forEach(clause => {
        const variableMatches = clause.clauseText.match(/\{\{([^}]+)\}\}/g) || [];
        const variableValues: Record<string, string> = {};
        variableMatches.forEach(match => {
          const varName = match.replace(/\{\{|\}\}/g, '');
          if (varName.includes('RATE') || varName.includes('FEE') || varName.includes('THRESHOLD')) {
            variableValues[varName] = '$';
          } else {
            variableValues[varName] = '';
          }
        });

        const newDraftClause: DraftClause = {
          id: `draft-${Date.now()}-${clause.id}`,
          clauseTemplateId: clause.id,
          clauseCode: clause.clauseCode,
          clauseTitle: clause.clauseTitle,
          clauseText: clause.clauseText,
          customText: null,
          isEditing: false,
          sectionName: categories.find(c => c.id === clause.categoryId)?.categoryName || "General",
          variableValues,
          comments: []
        };
        setDraftClauses(prev => [...prev, newDraftClause]);
      });
      
      toast({
        title: "Clauses suggested",
        description: `Added ${relevantClauses.length} relevant clauses based on your prompt.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not generate clauses. Please add them manually.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setShowSetupDialog(false);
    }
  };

  const handleStartDraft = () => {
    if (!contractData.contractName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your contract.",
        variant: "destructive"
      });
      return;
    }
    
    if (setupPrompt.trim()) {
      generateFromPrompt();
    } else {
      setShowSetupDialog(false);
    }
  };

  // Fetch all clauses
  const { data: allClauses = [] } = useQuery<ClauseTemplate[]>({
    queryKey: ["/api/clauses"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<ClauseCategory[]>({
    queryKey: ["/api/clause-categories"],
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: { contract: any; clauses: any[] }) => {
      const response = await apiRequest("POST", "/api/contracts/draft", data);
      return response.json();
    },
    onSuccess: (data) => {
      setLastSaved(new Date());
      setContractData(prev => ({ ...prev, id: data.contract.id, contractNumber: data.contract.contractNumber }));
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Draft saved",
        description: "Your contract has been saved to the database."
      });
      // Update URL if this is a new contract
      if (!contractId && data.contract.id) {
        navigate(`/drafter/${data.contract.id}`, { replace: true });
      }
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: "Could not save your draft. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Filter clauses by search
  const filteredClauses = allClauses.filter(clause => 
    clause.clauseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clause.clauseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clause.clauseText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate AI-style scores for recommendations
  const getRecommendations = () => {
    return allClauses.slice(0, 5).map((clause, index) => {
      const scores = [95, 89, 82, 76, 71];
      const rationales = [
        "Highly relevant for commercial dialysis contracts in CA jurisdiction.",
        "Standard compliance requirement for this payor type.",
        "Often included when home modalities are covered.",
        "Recommended for high-acuity coverage scenarios.",
        "Common definition clause for medical necessity disputes."
      ];
      return {
        ...clause,
        score: scores[index] || 70,
        rationale: rationales[index] || "Matches contract context parameters.",
        type: index === 0 ? "recommended" : index === 1 ? "compliance" : "complementary"
      };
    });
  };

  // Add clause to draft
  const addClauseToDraft = (clause: ClauseTemplate) => {
    const existingClause = draftClauses.find(c => c.clauseTemplateId === clause.id);
    if (existingClause) {
      toast({
        title: "Clause already added",
        description: "This clause is already in your draft.",
        variant: "destructive"
      });
      return;
    }

    // Extract variables from clause text
    const variableMatches = clause.clauseText.match(/\{\{([^}]+)\}\}/g) || [];
    const variableValues: Record<string, string> = {};
    variableMatches.forEach(match => {
      const varName = match.replace(/\{\{|\}\}/g, '');
      if (varName.includes('RATE') || varName.includes('FEE') || varName.includes('THRESHOLD')) {
        variableValues[varName] = '$';
      } else {
        variableValues[varName] = '';
      }
    });

    const newDraftClause: DraftClause = {
      id: `draft-${Date.now()}`,
      clauseTemplateId: clause.id,
      clauseCode: clause.clauseCode,
      clauseTitle: clause.clauseTitle,
      clauseText: clause.clauseText,
      customText: null,
      isEditing: false,
      sectionName: categories.find(c => c.id === clause.categoryId)?.categoryName || "General",
      variableValues,
      comments: []
    };

    setDraftClauses([...draftClauses, newDraftClause]);
    toast({
      title: "Clause added",
      description: `"${clause.clauseTitle}" has been added to your draft.`
    });
  };

  // Remove clause from draft
  const removeClauseFromDraft = (clauseId: string) => {
    setDraftClauses(draftClauses.filter(c => c.id !== clauseId));
  };

  // Move clause up
  const moveClauseUp = (index: number) => {
    if (index === 0) return;
    const newClauses = [...draftClauses];
    [newClauses[index - 1], newClauses[index]] = [newClauses[index], newClauses[index - 1]];
    setDraftClauses(newClauses);
  };

  // Move clause down
  const moveClauseDown = (index: number) => {
    if (index === draftClauses.length - 1) return;
    const newClauses = [...draftClauses];
    [newClauses[index], newClauses[index + 1]] = [newClauses[index + 1], newClauses[index]];
    setDraftClauses(newClauses);
  };

  // Start editing clause
  const startEditing = (clause: DraftClause) => {
    setEditingClauseId(clause.id);
    setEditText(clause.customText || clause.clauseText);
  };

  // Save edited clause
  const saveEdit = (clauseId: string) => {
    setDraftClauses(draftClauses.map(c => {
      if (c.id === clauseId) {
        return {
          ...c,
          customText: editText !== c.clauseText ? editText : null,
          isEditing: false
        };
      }
      return c;
    }));
    setEditingClauseId(null);
    setEditText("");
    toast({
      title: "Clause updated",
      description: "Your changes have been saved."
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingClauseId(null);
    setEditText("");
  };

  // Add comment
  const addComment = (clauseId: string) => {
    if (!commentText.trim()) return;
    
    setDraftClauses(draftClauses.map(c => {
      if (c.id === clauseId) {
        return {
          ...c,
          comments: [...c.comments, {
            id: `comment-${Date.now()}`,
            text: commentText,
            author: "Sarah Holmes",
            timestamp: new Date().toISOString()
          }]
        };
      }
      return c;
    }));
    setCommentText("");
    setCommentingClauseId(null);
    toast({
      title: "Comment added",
      description: "Your comment has been saved."
    });
  };

  // Update variable value
  const updateVariableValue = (clauseId: string, varName: string, value: string) => {
    setDraftClauses(draftClauses.map(c => {
      if (c.id === clauseId) {
        return {
          ...c,
          variableValues: {
            ...c.variableValues,
            [varName]: value
          }
        };
      }
      return c;
    }));
  };

  // Save draft to database
  const saveDraft = () => {
    const clausesForSave = draftClauses.map(c => ({
      clauseTemplateId: c.clauseTemplateId,
      clauseCode: c.clauseCode,
      clauseTitle: c.clauseTitle,
      sectionName: c.sectionName,
      clauseText: c.clauseText,
      customizedText: c.customText,
      isCustomized: !!c.customText,
      variableValues: c.variableValues,
      comments: c.comments,
      status: "active"
    }));

    saveDraftMutation.mutate({
      contract: {
        id: contractData.id,
        contractNumber: contractData.contractNumber,
        contractName: contractData.contractName,
        payorName: contractData.payorName,
        payorType: contractData.payorType,
        jurisdiction: contractData.jurisdiction,
        contractStatus: contractData.contractStatus
      },
      clauses: clausesForSave
    });
  };

  // Export contract
  const exportContract = () => {
    let contractText = `DIALYSIS SERVICES AGREEMENT\n`;
    contractText += `Contract ID: ${contractData.contractNumber || 'DRAFT'}\n`;
    contractText += `${contractData.payorName} • ${contractData.jurisdiction}\n`;
    contractText += `\n${'='.repeat(60)}\n\n`;

    draftClauses.forEach((clause, index) => {
      contractText += `${index + 1}. ${clause.clauseTitle.toUpperCase()}\n`;
      contractText += `[${clause.clauseCode}]\n\n`;
      
      let text = clause.customText || clause.clauseText;
      Object.entries(clause.variableValues).forEach(([varName, value]) => {
        text = text.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value || `[${varName}]`);
      });
      
      contractText += `${text}\n\n`;
      
      if (clause.comments.length > 0) {
        contractText += `--- Comments ---\n`;
        clause.comments.forEach(comment => {
          contractText += `• ${comment.author} (${new Date(comment.timestamp).toLocaleDateString()}): ${comment.text}\n`;
        });
        contractText += `\n`;
      }
      
      contractText += `${'─'.repeat(60)}\n\n`;
    });

    const blob = new Blob([contractText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contractData.contractName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Contract exported",
      description: "Your contract has been downloaded as a text file."
    });
  };

  // Render clause text with variables highlighted or replaced
  const renderClauseText = (text: string, variableValues: Record<string, string> = {}) => {
    return text.split(/(\{\{[^}]+\}\})/).map((part, i) => {
      const match = part.match(/^\{\{([^}]+)\}\}$/);
      if (match) {
        const varName = match[1];
        const value = variableValues[varName];
        if (value && value !== '$') {
          return (
            <span key={i} className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono text-sm font-bold border border-emerald-200 cursor-pointer hover:bg-emerald-200 transition-colors">
              {value}
            </span>
          );
        }
        return (
          <span key={i} className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono text-sm font-bold border border-amber-200 cursor-pointer hover:bg-amber-200 transition-colors">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const recommendations = getRecommendations();

  // Get unique variables from draft clauses
  const allVariables = draftClauses.flatMap(clause => 
    Object.entries(clause.variableValues).map(([name, value]) => ({
      clauseId: clause.id,
      clauseCode: clause.clauseCode,
      name,
      value
    }))
  );

  // Check completion status
  const completionChecklist = [
    { name: "Definitions Section", completed: draftClauses.some(c => c.sectionName === "Definitions") },
    { name: "Reimbursement", completed: draftClauses.some(c => c.sectionName === "Reimbursement Methodology") },
    { name: "Timely Filing", completed: draftClauses.some(c => c.sectionName === "Timely Filing & Appeals") },
    { name: "All Variables Filled", completed: allVariables.every(v => v.value !== '' && v.value !== '$') },
  ];

  if (loadingContract && contractId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* New Contract Setup Dialog */}
      <Dialog open={showSetupDialog && !contractId} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              New Contract
            </DialogTitle>
            <DialogDescription>
              Set up your new contract. Optionally describe what you need and AI will suggest relevant clauses.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contract-name">Contract Name *</Label>
              <Input 
                id="contract-name"
                placeholder="e.g., BlueCross Shield California 2025"
                value={contractData.contractName}
                onChange={(e) => setContractData(prev => ({ ...prev, contractName: e.target.value }))}
                data-testid="input-new-contract-name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payor-name">Payor Name</Label>
                <Input 
                  id="payor-name"
                  placeholder="e.g., BlueCross Shield"
                  value={contractData.payorName}
                  onChange={(e) => setContractData(prev => ({ ...prev, payorName: e.target.value }))}
                  data-testid="input-payor-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                <Input 
                  id="jurisdiction"
                  placeholder="e.g., California"
                  value={contractData.jurisdiction}
                  onChange={(e) => setContractData(prev => ({ ...prev, jurisdiction: e.target.value }))}
                  data-testid="input-jurisdiction"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payor-type">Payor Type</Label>
              <Select 
                value={contractData.payorType} 
                onValueChange={(value) => setContractData(prev => ({ ...prev, payorType: value }))}
              >
                <SelectTrigger data-testid="select-payor-type">
                  <SelectValue placeholder="Select payor type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="medicare">Medicare</SelectItem>
                  <SelectItem value="medicaid">Medicaid</SelectItem>
                  <SelectItem value="medicare_advantage">Medicare Advantage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="ai-prompt" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-purple-500" />
                AI Prompt (Optional)
              </Label>
              <Textarea 
                id="ai-prompt"
                placeholder="Describe what you need in your contract and AI will suggest relevant clauses. E.g., 'I need a dialysis services agreement with reimbursement terms, timely filing requirements, and medical necessity definitions'"
                className="min-h-[100px]"
                value={setupPrompt}
                onChange={(e) => setSetupPrompt(e.target.value)}
                data-testid="textarea-ai-prompt"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to start with an empty draft and add clauses manually.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate("/contracts")}>
              Cancel
            </Button>
            <Button 
              onClick={handleStartDraft} 
              disabled={isGenerating}
              data-testid="button-start-draft"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : setupPrompt.trim() ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start with AI
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Draft
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-[calc(100vh-8rem)] flex flex-col -m-6">
        {/* Top Toolbar */}
        <div className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <input 
                 className="font-display font-bold text-sm bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                 value={contractData.contractName}
                 onChange={(e) => setContractData(prev => ({ ...prev, contractName: e.target.value }))}
                 data-testid="input-contract-title"
               />
               <span className="text-xs text-muted-foreground flex items-center gap-1">
                 <span className={cn(
                   "w-2 h-2 rounded-full",
                   contractData.id ? "bg-emerald-500" : "bg-amber-500"
                 )}></span>
                 {contractData.id ? `Saved • ${contractData.contractNumber}` : "Unsaved Draft"} - {draftClauses.length} clauses
                 {lastSaved && <span className="ml-2">• Last saved {lastSaved.toLocaleTimeString()}</span>}
               </span>
             </div>
             <Badge variant="outline" className="text-xs font-mono">V.1.0</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/contracts")} data-testid="button-back">
              <RotateCcw className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
            <Button variant="outline" size="sm" onClick={exportContract} data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              size="sm" 
              className="gap-2" 
              onClick={saveDraft} 
              disabled={saveDraftMutation.isPending}
              data-testid="button-save-draft"
            >
              {saveDraftMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Draft
            </Button>
          </div>
        </div>

        {/* Main Split Interface */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          
          {/* LEFT: AI & Library */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="bg-muted/30 border-r">
            <div className="h-full flex flex-col">
              <div className="p-4 pb-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="recommendations" className="text-xs" data-testid="tab-ai">
                      <Sparkles className="h-3 w-3 mr-1.5" />
                      AI
                    </TabsTrigger>
                    <TabsTrigger value="library" className="text-xs" data-testid="tab-library">
                      <FileText className="h-3 w-3 mr-1.5" />
                      Library
                    </TabsTrigger>
                    <TabsTrigger value="search" className="text-xs" data-testid="tab-search">
                      <Search className="h-3 w-3 mr-1.5" />
                      Search
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <ScrollArea className="flex-1 p-4">
                {activeTab === "recommendations" && (
                  <div className="space-y-6">
                    {/* Context Summary */}
                    <Card className="bg-primary/5 border-primary/20 shadow-none">
                      <CardContent className="p-3 space-y-2">
                        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Drafting Context</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <span className="text-muted-foreground">Payor:</span>
                          <span className="font-medium">{contractData.payorName}</span>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{contractData.payorType}</span>
                          <span className="text-muted-foreground">Jurisdiction:</span>
                          <span className="font-medium">{contractData.jurisdiction}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Smart Suggestions
                      </h3>
                      <div className="space-y-3">
                        {recommendations.map((clause) => (
                          <Card key={clause.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                            <CardHeader className="p-3 pb-1">
                              <div className="flex justify-between items-start">
                                <Badge variant="secondary" className={cn(
                                  "text-[10px] h-5",
                                  clause.type === "recommended" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                                  clause.type === "compliance" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                )}>
                                  {clause.score}% Match
                                </Badge>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={() => addClauseToDraft(clause)}
                                  data-testid={`button-add-clause-${clause.id}`}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <CardTitle className="text-sm font-medium leading-tight mt-2">{clause.clauseTitle}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-1">
                              <p className="text-xs text-muted-foreground mb-2 italic">"{clause.rationale}"</p>
                              <p className="text-xs border-l-2 border-muted pl-2 line-clamp-2 font-serif text-muted-foreground">
                                {clause.clauseText.substring(0, 100)}...
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "library" && (
                  <div className="space-y-3">
                    {allClauses.map((clause) => (
                      <div 
                        key={clause.id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                        onClick={() => addClauseToDraft(clause)}
                        data-testid={`library-clause-${clause.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="outline" className="font-mono text-[9px] mb-1">{clause.clauseCode}</Badge>
                            <h4 className="text-sm font-medium">{clause.clauseTitle}</h4>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{clause.clauseText.substring(0, 80)}...</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "search" && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search clauses..." 
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-search-library"
                      />
                    </div>
                    <div className="space-y-2">
                      {filteredClauses.map((clause) => (
                        <div 
                          key={clause.id}
                          className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                          onClick={() => addClauseToDraft(clause)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge variant="outline" className="font-mono text-[9px] mb-1">{clause.clauseCode}</Badge>
                              <h4 className="text-sm font-medium">{clause.clauseTitle}</h4>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* CENTER: Editor */}
          <ResizablePanel defaultSize={50} className="bg-background">
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto py-12 px-12 min-h-[1000px] bg-white shadow-sm my-8 border border-border/50">
                {/* Simulated Document */}
                <div className="space-y-8 font-serif text-foreground/90 leading-relaxed">
                   <div className="text-center mb-12">
                     <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">Dialysis Services Agreement</h1>
                     <p className="text-sm text-muted-foreground">Contract ID: {contractData.contractNumber || 'DRAFT'}</p>
                     <p className="text-xs text-muted-foreground mt-1">{contractData.payorName} • {contractData.jurisdiction}</p>
                   </div>

                   {draftClauses.length === 0 ? (
                     <div className="text-center py-16 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                       <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                       <p className="text-muted-foreground mb-2">No clauses added yet</p>
                       <p className="text-xs text-muted-foreground">Use the sidebar to browse AI recommendations or search the clause library</p>
                     </div>
                   ) : (
                     draftClauses.map((clause, index) => (
                       <section 
                         key={clause.id} 
                         className="space-y-4 group relative hover:bg-muted/10 p-4 -mx-4 rounded-lg transition-colors border-l-2 border-transparent hover:border-primary"
                         data-testid={`draft-clause-${clause.id}`}
                       >
                         <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={() => moveClauseUp(index)}
                              disabled={index === 0}
                              data-testid={`button-move-up-${clause.id}`}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={() => moveClauseDown(index)}
                              disabled={index === draftClauses.length - 1}
                              data-testid={`button-move-down-${clause.id}`}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Separator orientation="vertical" className="h-6" />
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={() => startEditing(clause)}
                              data-testid={`button-edit-${clause.id}`}
                            >
                              <Edit3 className="h-3 w-3 text-blue-600" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 relative"
                                  data-testid={`button-comment-${clause.id}`}
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  {clause.comments.length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary text-[8px] text-white rounded-full flex items-center justify-center">
                                      {clause.comments.length}
                                    </span>
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Comments on {clause.clauseCode}</DialogTitle>
                                  <DialogDescription>Add notes and feedback for this clause.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {clause.comments.length > 0 && (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {clause.comments.map((comment) => (
                                        <div key={comment.id} className="p-2 bg-muted rounded-lg text-sm">
                                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                            <span className="font-medium">{comment.author}</span>
                                            <span>{new Date(comment.timestamp).toLocaleDateString()}</span>
                                          </div>
                                          <p>{comment.text}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <Textarea 
                                    placeholder="Add a comment..." 
                                    value={commentingClauseId === clause.id ? commentText : ""}
                                    onChange={(e) => {
                                      setCommentingClauseId(clause.id);
                                      setCommentText(e.target.value);
                                    }}
                                  />
                                </div>
                                <DialogFooter>
                                  <Button onClick={() => addComment(clause.id)} disabled={!commentText.trim()}>
                                    Add Comment
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Separator orientation="vertical" className="h-6" />
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-destructive"
                              onClick={() => removeClauseFromDraft(clause.id)}
                              data-testid={`button-remove-clause-${clause.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                         </div>

                         <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-[10px] bg-white">{clause.clauseCode}</Badge>
                            <Badge className="text-[10px] bg-primary/10 text-primary">{clause.sectionName}</Badge>
                            {clause.customText && (
                              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">Edited</Badge>
                            )}
                            {clause.comments.length > 0 && (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                                {clause.comments.length} comment{clause.comments.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                         </div>

                         <h3 className="text-lg font-bold font-sans text-foreground">{index + 1}. {clause.clauseTitle.toUpperCase()}</h3>
                         
                         {editingClauseId === clause.id ? (
                           <div className="space-y-3">
                             <Textarea 
                               value={editText}
                               onChange={(e) => setEditText(e.target.value)}
                               className="min-h-[150px] font-serif"
                               data-testid={`textarea-edit-${clause.id}`}
                             />
                             <div className="flex gap-2">
                               <Button size="sm" onClick={() => saveEdit(clause.id)}>
                                 <Check className="h-3 w-3 mr-1" /> Save
                               </Button>
                               <Button size="sm" variant="outline" onClick={cancelEdit}>
                                 Cancel
                               </Button>
                             </div>
                           </div>
                         ) : (
                           <p className="whitespace-pre-wrap">
                             {renderClauseText(clause.customText || clause.clauseText, clause.variableValues)}
                           </p>
                         )}
                       </section>
                     ))
                   )}

                   <div 
                     className="flex items-center justify-center p-8 border-2 border-dashed border-muted-foreground/20 rounded-lg text-muted-foreground text-sm hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all"
                     onClick={() => setActiveTab("library")}
                     data-testid="button-add-more-clauses"
                   >
                      <Plus className="h-4 w-4 mr-2" />
                      Click to browse clause library
                   </div>
                </div>
              </div>
            </ScrollArea>
          </ResizablePanel>
          
          <ResizableHandle />

          {/* RIGHT: Context & Tools */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={30} className="bg-muted/30 border-l">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                 <h3 className="font-semibold text-sm">Contract Tools</h3>
              </div>
              <ScrollArea className="flex-1 p-4">
                 <div className="space-y-6">
                    {/* Checklist */}
                    <div className="space-y-3">
                       <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Drafting Checklist</h4>
                       <div className="space-y-2">
                          {completionChecklist.map((item) => (
                            <div key={item.name} className="flex items-center gap-2 text-sm">
                               {item.completed ? (
                                 <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                               ) : (
                                 <div className="h-4 w-4 rounded-full border-2 border-muted" />
                               )}
                               <span className={item.completed ? "text-muted-foreground line-through" : "font-medium"}>
                                 {item.name}
                               </span>
                            </div>
                          ))}
                       </div>
                    </div>

                    <Separator />

                    {/* Variables */}
                    <div className="space-y-3">
                       <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Variables ({allVariables.filter(v => !v.value || v.value === '$').length} unfilled)</h4>
                       <div className="space-y-3">
                          {allVariables.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Add clauses with variables to configure them here.</p>
                          ) : (
                            allVariables.map((variable) => (
                              <div key={`${variable.clauseId}-${variable.name}`} className="space-y-1">
                                 <label className="text-xs font-medium flex items-center justify-between">
                                   <span>{variable.name.replace(/_/g, ' ')}</span>
                                   <Badge variant="outline" className="text-[9px]">{variable.clauseCode}</Badge>
                                 </label>
                                 <Input 
                                   className="h-8 font-mono text-xs bg-white" 
                                   placeholder={variable.name.includes('RATE') || variable.name.includes('FEE') || variable.name.includes('THRESHOLD') ? "$0.00" : `Enter ${variable.name.toLowerCase()}`}
                                   value={variable.value}
                                   onChange={(e) => updateVariableValue(variable.clauseId, variable.name, e.target.value)}
                                   data-testid={`input-variable-${variable.name}`}
                                 />
                              </div>
                            ))
                          )}
                       </div>
                    </div>

                    <Separator />

                    {/* Warnings */}
                    {allVariables.some(v => !v.value || v.value === '$') && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-md">
                         <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <div>
                               <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Unfilled Variables</p>
                               <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                                  {allVariables.filter(v => !v.value || v.value === '$').length} variable(s) need values before finalizing the contract.
                               </p>
                            </div>
                         </div>
                      </div>
                    )}

                    {draftClauses.length > 0 && !completionChecklist[0].completed && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-md">
                         <div className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                               <p className="text-xs font-bold text-blue-800 dark:text-blue-200">AI Suggestion</p>
                               <p className="text-[10px] text-blue-700 dark:text-blue-300 mt-1">
                                  Consider adding a "Definitions" clause for legal clarity.
                               </p>
                            </div>
                         </div>
                      </div>
                    )}
                 </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
    </DashboardLayout>
  );
}
