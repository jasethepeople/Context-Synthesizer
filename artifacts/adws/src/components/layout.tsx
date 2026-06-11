import { Link, useLocation } from "wouter";
import { 
  Terminal, 
  Activity, 
  Network, 
  Search, 
  FlaskConical,
  Menu,
  Server
} from "lucide-react";
import { useGetIngestionStats, getGetIngestionStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { path: "/", label: "Mission Control", icon: Terminal },
  { path: "/delta", label: "Context Delta", icon: Activity },
  { path: "/graph", label: "Epistemic Graph", icon: Network },
  { path: "/query", label: "Reverse Query", icon: Search },
  { path: "/ingest", label: "Ingestion Lab", icon: FlaskConical },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: stats } = useGetIngestionStats({
    query: { refetchInterval: 3000, queryKey: getGetIngestionStatsQueryKey() }
  });

  const statusColor = 
    stats?.pipelineStatus === "processing" ? "bg-secondary" :
    stats?.pipelineStatus === "backpressure" ? "bg-destructive" :
    "bg-muted";

  const NavContent = () => (
    <div className="flex flex-col h-full bg-background border-r border-border p-4 text-sm font-mono">
      <div className="flex items-center gap-2 mb-8 px-2 text-primary font-bold text-lg tracking-wider uppercase">
        <Server className="w-5 h-5" />
        ADWS
      </div>
      
      <div className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link key={item.path} href={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === item.path ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-border/50">
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Pipeline</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
            <span className="text-xs text-foreground uppercase">{stats?.pipelineStatus || "IDLE"}</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Rate</span>
          <span className="text-xs text-foreground font-mono">{stats?.processingRatePerMin || 0}/min</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <div className="hidden md:flex flex-col w-64 h-full">
        <NavContent />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Server className="w-5 h-5" />
            ADWS
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-border bg-background">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
