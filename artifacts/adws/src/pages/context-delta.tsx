import { useState, useEffect } from "react";
import { useGetContextDelta, useGetCurrentSession } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, Target, GitMerge, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContextDelta() {
  const [compression, setCompression] = useState([0.5]);
  const { data: session } = useGetCurrentSession();
  
  const { data: delta, isLoading } = useGetContextDelta({
    compression: compression[0],
    sessionId: session?.id
  }, {
    query: {
      enabled: !!session?.id,
      queryKey: ["delta", session?.id, compression[0]]
    }
  });

  return (
    <div className="space-y-6 font-mono animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Context Delta</h1>
          <p className="text-muted-foreground text-sm">Synthesized briefing of organizational state changes</p>
        </div>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-muted-foreground">Compression Level</span>
              <span className="text-xs text-primary font-bold">{compression[0].toFixed(2)}</span>
            </div>
            <Slider 
              value={compression} 
              onValueChange={setCompression} 
              max={1} 
              step={0.1}
              data-testid="slider-compression"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
              <span>Executive Prose</span>
              <span>Hyper-Technical</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full bg-card/50" />
          <Skeleton className="h-48 w-full bg-card/50" />
        </div>
      ) : delta ? (
        <div className="space-y-6">
          {/* Tier 1: Blockers */}
          <Card className={`border-l-4 ${delta.tier1.hasBlockers ? "border-l-destructive bg-destructive/5" : "border-l-border bg-card/50"}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-foreground">
                  <AlertCircle className={`w-4 h-4 ${delta.tier1.hasBlockers ? "text-destructive" : "text-muted-foreground"}`} />
                  Tier 1: Actionable Blockers
                </CardTitle>
                <Badge variant={delta.tier1.hasBlockers ? "destructive" : "outline"}>
                  {delta.tier1.hasBlockers ? "CRITICAL" : "CLEAR"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-foreground mb-4 font-sans">{delta.tier1.label}</div>
              {delta.tier1.items.length > 0 ? (
                <ul className="space-y-3">
                  {delta.tier1.items.map(item => (
                    <li key={item.id} className="text-xs border border-border/50 p-3 rounded bg-background/50 flex gap-3">
                      <div className="w-1.5 h-1.5 mt-1 rounded-full bg-destructive shrink-0" />
                      <div className="flex-1">
                        <span className="text-foreground">{item.content}</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.affectedNodes.map(node => (
                            <Badge key={node} variant="secondary" className="text-[9px] px-1 py-0">{node}</Badge>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-muted-foreground uppercase">No direct blockers detected.</div>
              )}
            </CardContent>
          </Card>

          {/* Tier 2: Alignment */}
          <Card className="bg-card/50 border-l-4 border-l-primary/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-foreground">
                <Target className="w-4 h-4 text-primary" />
                Tier 2: Alignment Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-foreground mb-4 font-sans">{delta.tier2.label}</div>
              {delta.tier2.items.length > 0 ? (
                <ul className="space-y-3">
                  {delta.tier2.items.map(item => (
                    <li key={item.id} className="text-xs border border-border/50 p-3 rounded bg-background/50 flex gap-3">
                      <div className="w-1.5 h-1.5 mt-1 rounded-full bg-primary shrink-0" />
                      <div className="flex-1">
                        <span className="text-foreground">{item.content}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-muted-foreground uppercase">No significant architectural shifts.</div>
              )}
            </CardContent>
          </Card>
          
          {/* Tier 3: Landscape */}
          <Card className="bg-card/50 border-l-4 border-l-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-foreground">
                <GitMerge className="w-4 h-4 text-muted-foreground" />
                Tier 3: Passive Landscape
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4 font-sans">{delta.tier3.label}</div>
              <div className="flex flex-wrap gap-2 mt-4">
                {delta.tier3.semanticMap?.map((cluster, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-border/50 text-foreground">
                    {cluster.topic} ({cluster.eventCount})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground text-sm uppercase">
          No session context available. Start a session from Mission Control.
        </div>
      )}
    </div>
  );
}
