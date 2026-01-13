import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Search, 
  FileText, 
  ChevronRight, 
  Plus, 
  Save, 
  RotateCcw, 
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
  MessageSquare,
  Wand2
} from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { useState } from "react";

const aiSuggestions = [
  {
    id: "sug-1",
    title: "ESRD Bundled Payment Rate",
    score: 92,
    rationale: "High match for commercial dialysis contracts in CA jurisdiction.",
    text: "Provider shall be reimbursed for Dialysis Services at a bundled rate of {{REIMBURSEMENT_RATE}}...",
    type: "recommended"
  },
  {
    id: "sug-2",
    title: "Timely Filing - CA Standard",
    score: 87,
    rationale: "Standard compliance requirement for this payor type.",
    text: "Claims must be submitted within 180 days from the date of service...",
    type: "compliance"
  },
  {
    id: "sug-3",
    title: "Home Dialysis Training Add-on",
    score: 75,
    rationale: "Often included when home modalities are covered.",
    text: "An additional training fee of {{TRAINING_FEE}} applies for first 15 sessions...",
    type: "complementary"
  }
];

export default function ContractDrafter() {
  const [activeTab, setActiveTab] = useState("recommendations");
  const [contractTitle, setContractTitle] = useState("BlueCross Shield Regional 2025 - Draft");

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col -m-6">
        {/* Top Toolbar */}
        <div className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <input 
                 className="font-display font-bold text-sm bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                 value={contractTitle}
                 onChange={(e) => setContractTitle(e.target.value)}
               />
               <span className="text-xs text-muted-foreground flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                 Draft - Last saved 2m ago
               </span>
             </div>
             <Badge variant="outline" className="text-xs font-mono">V.1.2</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="outline" size="sm">
              <Paperclip className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
          </div>
        </div>

        {/* Main Split Interface */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          
          {/* LEFT: AI & Library */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className="bg-muted/30 border-r">
            <div className="h-full flex flex-col">
              <div className="p-4 pb-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="recommendations" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1.5" />
                      AI
                    </TabsTrigger>
                    <TabsTrigger value="library" className="text-xs">
                      <FileText className="h-3 w-3 mr-1.5" />
                      Library
                    </TabsTrigger>
                    <TabsTrigger value="search" className="text-xs">
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
                          <span className="font-medium">BlueCross Shield</span>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">Commercial</span>
                          <span className="text-muted-foreground">Jurisdiction:</span>
                          <span className="font-medium">California</span>
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
                        {aiSuggestions.map((sug) => (
                          <Card key={sug.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                            <CardHeader className="p-3 pb-1">
                              <div className="flex justify-between items-start">
                                <Badge variant="secondary" className={cn(
                                  "text-[10px] h-5",
                                  sug.type === "recommended" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                                  sug.type === "compliance" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                )}>
                                  {sug.score}% Match
                                </Badge>
                                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <CardTitle className="text-sm font-medium leading-tight mt-2">{sug.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-1">
                              <p className="text-xs text-muted-foreground mb-2 italic">"{sug.rationale}"</p>
                              <p className="text-xs border-l-2 border-muted pl-2 line-clamp-2 font-serif text-muted-foreground">
                                {sug.text}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "library" && (
                    <div className="text-center text-sm text-muted-foreground mt-10">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Browse the full clause library...
                    </div>
                )}
              </ScrollArea>
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* CENTER: Editor */}
          <ResizablePanel defaultSize={55} className="bg-background">
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto py-12 px-12 min-h-[1000px] bg-white shadow-sm my-8 border border-border/50">
                {/* Simulated Document */}
                <div className="space-y-8 font-serif text-foreground/90 leading-relaxed">
                   <div className="text-center mb-12">
                     <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">Dialysis Services Agreement</h1>
                     <p className="text-sm text-muted-foreground">Contract ID: C-2025-DRAFT-01</p>
                   </div>

                   <section className="space-y-4 group relative hover:bg-muted/10 p-4 -mx-4 rounded-lg transition-colors">
                     <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6"><Wand2 className="h-3 w-3 text-purple-600" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6"><MessageSquare className="h-3 w-3" /></Button>
                     </div>
                     <h3 className="text-lg font-bold font-sans text-foreground">1. DEFINITIONS</h3>
                     <p>
                       1.1 <strong>"Allowed Amount"</strong> means the maximum amount Payor will pay for a Covered Service as specified in <span className="bg-blue-50 text-blue-700 px-1 rounded cursor-pointer border-b border-blue-200">Exhibit A</span>.
                     </p>
                     <p>
                       1.2 <strong>"Medically Necessary"</strong> means health care services or supplies needed to diagnose or treat an illness, injury, condition, disease or its symptoms and that meet accepted standards of medicine.
                     </p>
                   </section>

                   <section className="space-y-4 group relative hover:bg-muted/10 p-4 -mx-4 rounded-lg transition-colors border-l-2 border-transparent hover:border-primary">
                     <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6"><Wand2 className="h-3 w-3 text-purple-600" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6"><MessageSquare className="h-3 w-3" /></Button>
                     </div>
                     <h3 className="text-lg font-bold font-sans text-foreground">2. REIMBURSEMENT</h3>
                     <div className="pl-4 border-l-2 border-purple-500/20 bg-purple-50/50 p-3 rounded-r-lg">
                        <div className="flex items-center gap-2 mb-2">
                           <Badge variant="outline" className="text-[10px] bg-white">ESRD-BUNDLE-145</Badge>
                           <span className="text-xs text-purple-600 font-medium flex items-center gap-1">
                             <Sparkles className="h-3 w-3" /> AI Suggested
                           </span>
                        </div>
                        <p>
                          2.1 <strong>Bundled Rate.</strong> Provider shall be reimbursed for Dialysis Services at a bundled rate of <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono text-sm font-bold border border-amber-200 cursor-pointer hover:bg-amber-200 transition-colors">$285.00</span> per treatment. This rate includes all standard dialysis services, labs, and supplies necessary for the treatment.
                        </p>
                     </div>
                     <p>
                        2.2 <strong>Carve-outs.</strong> The following items are excluded from the Bundled Rate and shall be reimbursed separately: (a) EPO/ESA agents, (b) vascular access procedures, and (c) home dialysis training.
                     </p>
                   </section>

                   <div className="flex items-center justify-center p-8 border-2 border-dashed border-muted-foreground/20 rounded-lg text-muted-foreground text-sm hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all">
                      <Plus className="h-4 w-4 mr-2" />
                      Drag clauses here or click to browse library
                   </div>
                </div>
              </div>
            </ScrollArea>
          </ResizablePanel>
          
          <ResizableHandle />

          {/* RIGHT: Context & Tools */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={25} className="bg-muted/30 border-l">
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
                          <div className="flex items-center gap-2 text-sm">
                             <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                             <span className="text-muted-foreground line-through">Definitions Section</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                             <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                             <span className="font-medium">Reimbursement</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                             <div className="h-4 w-4 rounded-full border-2 border-muted" />
                             <span className="text-muted-foreground">Termination Clause</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                             <div className="h-4 w-4 rounded-full border-2 border-muted" />
                             <span className="text-muted-foreground">Signatures</span>
                          </div>
                       </div>
                    </div>

                    <Separator />

                    {/* Variables */}
                    <div className="space-y-3">
                       <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Variables</h4>
                       <div className="space-y-3">
                          <div className="space-y-1">
                             <label className="text-xs font-medium">Reimbursement Rate</label>
                             <div className="flex gap-2">
                               <Input className="h-8 font-mono text-xs bg-white" value="$285.00" />
                               <Button size="icon" variant="ghost" className="h-8 w-8"><RotateCcw className="h-3 w-3" /></Button>
                             </div>
                          </div>
                          <div className="space-y-1">
                             <label className="text-xs font-medium">Timely Filing Days</label>
                             <Input className="h-8 font-mono text-xs bg-white" value="180" />
                          </div>
                       </div>
                    </div>

                    <Separator />

                    {/* Warnings */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-md">
                       <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <div>
                             <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Missing Mandatory Clause</p>
                             <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                                "Dispute Resolution" section is required for California contracts.
                             </p>
                             <Button size="sm" variant="outline" className="h-6 text-[10px] mt-2 bg-white/50 border-amber-200 text-amber-800">
                                Auto-Add
                             </Button>
                          </div>
                       </div>
                    </div>
                 </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
    </DashboardLayout>
  );
}