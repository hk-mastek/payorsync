import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Variances from "@/pages/variances";
import Contracts from "@/pages/contracts";
import Governance from "@/pages/governance";
import Settings from "@/pages/settings";
import ClauseLibrary from "@/pages/clause-library";
import ContractDrafter from "@/pages/contract-drafter";
import WriteOffs from "@/pages/write-offs";
import WriteOffs2 from "@/pages/write-offs-2";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/variances" component={Variances} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/governance" component={Governance} />
      <Route path="/settings" component={Settings} />
      <Route path="/clause-library" component={ClauseLibrary} />
      <Route path="/drafter" component={ContractDrafter} />
      <Route path="/drafter/:contractId" component={ContractDrafter} />
      <Route path="/write-offs" component={WriteOffs} />
      <Route path="/write-offs-2" component={WriteOffs2} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;