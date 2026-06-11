import { useState } from "react";
import { useSimulateEvents, useGetIngestionStats, getGetIngestionStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Zap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function IngestionLab() {
  const [scenario, setScenario] = useState("auth_refactor");
  const [count, setCount] = useState([20]);
  const { toast } = useToast();
  
  const simulateMutation = useSimulateEvents();
  const { data: stats } = useGetIngestionStats({
    query: { refetchInterval: 3000, queryKey: getGetIngestionStatsQueryKey() }
  });

  const handleSimulate = () => {
    simulateMutation.mutate(
      { data: { scenario: scenario as any, eventCount: count[0], spreadMinutes: 60 } },
      { 
        onSuccess: (res) => {
          toast({
            title: "Simulation Triggered",
            description: `Queued ${res.eventsQueued} events for scenario: ${res.scenario}`,
          });
        }
      }
    );
  };

  return (
    <div className="space-y-6 font-mono animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Ingestion Lab</h1>
        <p className="text-muted-foreground text-sm">Simulate organizational noise events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-foreground">
              <Zap className="w-4 h-4 text-primary" />
              Event Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-muted-foreground">Scenario Pattern</label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger className="bg-background/50 border-border/50 text-xs">
                  <SelectValue placeholder="Select scenario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auth_refactor">Auth Refactor</SelectItem>
                  <SelectItem value="api_breaking_change">API Breaking Change</SelectItem>
                  <SelectItem value="sprint_standup">Sprint Standup</SelectItem>
                  <SelectItem value="hotfix_deploy">Hotfix Deploy</SelectItem>
                  <SelectItem value="all">Mixed Noise (All)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs uppercase font-bold text-muted-foreground">Event Volume</label>
                <span className="text-xs font-bold text-primary">{count[0]} events</span>
              </div>
              <Slider 
                value={count} 
                onValueChange={setCount} 
                max={100} 
                min={1}
                step={1}
                data-testid="slider-event-count"
              />
            </div>

            <Button 
              onClick={handleSimulate} 
              disabled={simulateMutation.isPending}
              className="w-full uppercase tracking-wider text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="btn-fire-events"
            >
              {simulateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Fire Simulation
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-foreground">
              Pipeline State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase text-muted-foreground mb-2">Status</div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    stats?.pipelineStatus === "processing" ? "bg-secondary" :
                    stats?.pipelineStatus === "backpressure" ? "bg-destructive" :
                    "bg-muted"
                  }`} />
                  <span className="text-sm font-bold uppercase">{stats?.pipelineStatus || "IDLE"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-background/50 border border-border/50 rounded">
                  <div className="text-[10px] uppercase text-muted-foreground mb-1">Processing Rate</div>
                  <div className="text-xl font-bold">{stats?.processingRatePerMin || 0}/m</div>
                </div>
                <div className="p-3 bg-background/50 border border-border/50 rounded">
                  <div className="text-[10px] uppercase text-muted-foreground mb-1">Deduplication</div>
                  <div className="text-xl font-bold text-secondary">{stats?.deduplicatedCount || 0}</div>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase text-muted-foreground mb-3">Source Distribution</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-blue-400">GitHub</span>
                    <span>{stats?.eventsPerSource?.github || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-green-400">Slack</span>
                    <span>{stats?.eventsPerSource?.slack || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-purple-400">Linear</span>
                    <span>{stats?.eventsPerSource?.linear || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
