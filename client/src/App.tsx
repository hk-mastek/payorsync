import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Variances from "@/pages/variances";
import Contracts from "@/pages/contracts";
import Analytics from "@/pages/analytics";
import Governance from "@/pages/governance";
import Settings from "@/pages/settings";
import ClauseLibrary from "@/pages/clause-library";
import ContractDrafter from "@/pages/contract-drafter";

function Router() {
  return (
    <Switch>
      <Route path="/">{() => <Redirect to="/contracts" />}</Route>
      <Route path="/variances" component={Variances} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/governance" component={Governance} />
      <Route path="/settings" component={Settings} />
      <Route path="/clause-library" component={ClauseLibrary} />
      <Route path="/drafter" component={ContractDrafter} />
      <Route path="/drafter/:contractId" component={ContractDrafter} />
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