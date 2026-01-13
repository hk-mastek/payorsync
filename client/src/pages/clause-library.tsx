import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  FolderOpen, 
  FileText, 
  Plus, 
  Tag, 
  Clock,
  ChevronRight,
  BookOpen,
  CheckCircle2
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";

export default function ClauseLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/clause-categories"],
  });

  // Fetch clauses
  const { data: clauses = [] } = useQuery({
    queryKey: ["/api/clauses", { categoryId: selectedCategory, search: searchQuery }],
  });

  // Calculate category counts
  const { data: allClauses = [] } = useQuery({
    queryKey: ["/api/clauses"],
  });

  const categoryCounts = categories.map((cat: any) => ({
    ...cat,
    count: allClauses.filter((c: any) => c.categoryId === cat.id).length,
  }));

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Clause Library</h1>
            <p className="text-muted-foreground mt-1">Manage standard legal clauses, templates, and variables.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>New Clause</span>
          </Button>
        </div>

        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Categories Sidebar */}
          <Card className="w-64 flex flex-col h-full border-r-0 rounded-none md:rounded-lg md:border-r">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-y-auto">
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    selectedCategory === null 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    <span>All Clauses</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-[1.5rem] justify-center">
                    {allClauses.length}
                  </Badge>
                </button>
                
                {categoryCounts.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      selectedCategory === cat.id 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      <span className="truncate">{cat.categoryName}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-[1.5rem] justify-center">
                      {cat.count}
                    </Badge>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search clauses by title, code, or content..." 
                  className="pl-9 bg-secondary/50 border-transparent focus:bg-background focus:border-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 grid gap-4">
                {clauses.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No clauses found</p>
                  </div>
                ) : (
                  clauses.map((clause: any) => (
                    <Sheet key={clause.id}>
                      <SheetTrigger asChild>
                        <div className="group flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/20 transition-all cursor-pointer">
                          <div className="flex gap-4">
                            <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {clause.clauseTitle}
                                </h3>
                                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                  {clause.clauseCode}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1 pr-8">
                                {clause.clauseText}
                              </p>
                              <div className="flex items-center gap-3 mt-3">
                                {clause.tags?.slice(0, 3).map((tag: string) => (
                                  <div key={tag} className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                    <Tag className="h-3 w-3" />
                                    {tag}
                                  </div>
                                ))}
                                <Separator orientation="vertical" className="h-3" />
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> Updated recently
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={clause.status === "active" ? "secondary" : "outline"} className={cn(
                              clause.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-amber-600"
                            )}>
                              {clause.status}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </SheetTrigger>
                      <SheetContent className="w-[600px] sm:w-[600px] overflow-y-auto">
                        <SheetHeader>
                          <div className="flex items-center gap-2 mb-2">
                             <Badge variant="outline" className="font-mono">{clause.clauseCode}</Badge>
                             <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                               {categories.find((c: any) => c.id === clause.categoryId)?.categoryName || 'Uncategorized'}
                             </Badge>
                          </div>
                          <SheetTitle className="text-xl font-display">{clause.clauseTitle}</SheetTitle>
                          <SheetDescription>
                            Version {clause.clauseVersion} - Full text and configuration for this clause template.
                          </SheetDescription>
                        </SheetHeader>
                        
                        <div className="mt-8 space-y-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              Clause Text
                            </label>
                            <div className="p-4 bg-muted/30 rounded-lg border font-serif text-sm leading-relaxed whitespace-pre-wrap">
                              {clause.clauseText.split(/(\{\{.*?\}\})/).map((part: string, i: number) => (
                                part.match(/^\{\{.*?\}\}$/) ? (
                                  <span key={i} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1 rounded font-mono text-xs font-bold border border-blue-200 dark:border-blue-800">
                                    {part}
                                  </span>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <Card>
                               <CardHeader className="p-3">
                                 <CardTitle className="text-sm">Metadata</CardTitle>
                               </CardHeader>
                               <CardContent className="p-3 pt-0 text-sm space-y-2">
                                 <div className="flex justify-between">
                                   <span className="text-muted-foreground">Version</span>
                                   <span className="font-mono">{clause.clauseVersion}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-muted-foreground">Usage</span>
                                   <span>{clause.usageCount || 0} Contracts</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-muted-foreground">Status</span>
                                   <span className="capitalize">{clause.status}</span>
                                 </div>
                               </CardContent>
                             </Card>
                             <Card>
                               <CardHeader className="p-3">
                                 <CardTitle className="text-sm">Compliance</CardTitle>
                               </CardHeader>
                               <CardContent className="p-3 pt-0 text-sm space-y-2">
                                 {clause.regulatoryReferences && clause.regulatoryReferences.length > 0 ? (
                                   clause.regulatoryReferences.map((ref: string) => (
                                     <div key={ref} className="flex items-start gap-2">
                                       <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                                       <span className="text-muted-foreground text-xs">{ref}</span>
                                     </div>
                                   ))
                                 ) : (
                                   <p className="text-muted-foreground text-xs">No regulatory references</p>
                                 )}
                               </CardContent>
                             </Card>
                          </div>

                          {clause.tags && clause.tags.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Tags</label>
                              <div className="flex flex-wrap gap-2">
                                {clause.tags.map((tag: string) => (
                                  <Badge key={tag} variant="secondary">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-3 pt-4">
                            <Button className="flex-1">Edit Template</Button>
                            <Button variant="outline" className="flex-1">View Version History</Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
