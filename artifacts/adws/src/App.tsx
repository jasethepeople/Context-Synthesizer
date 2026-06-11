import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import MissionControl from "@/pages/mission-control";
import ContextDelta from "@/pages/context-delta";
import EpistemicGraph from "@/pages/epistemic-graph";
import ReverseQuery from "@/pages/reverse-query";
import IngestionLab from "@/pages/ingestion-lab";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={MissionControl} />
        <Route path="/delta" component={ContextDelta} />
        <Route path="/graph" component={EpistemicGraph} />
        <Route path="/query" component={ReverseQuery} />
        <Route path="/ingest" component={IngestionLab} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
