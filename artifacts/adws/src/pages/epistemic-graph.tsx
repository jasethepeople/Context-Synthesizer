import { useState } from "react";
import { useGetGraphStats, useListGraphNodes, getListGraphNodesQueryKey } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, Search, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function EpistemicGraph() {
  const { data: stats } = useGetGraphStats();
  const [filterType, setFilterType] = useState<string>("all");
  
  const { data: nodesData, isLoading } = useListGraphNodes(
    { type: filterType as any, limit: 50 },
    { query: { queryKey: ["nodes", filterType] } }
  );

  return (
    <div className="space-y-6 font-mono animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Epistemic Graph</h1>
        <p className="text-muted-foreground text-sm">Entity relationships and event topology</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <span className="text-3xl font-bold text-foreground">{stats?.totalNodes || 0}</span>
            <span className="text-[10px] uppercase text-muted-foreground tracking-widest mt-1">Total Nodes</span>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <span className="text-3xl font-bold text-secondary">{stats?.totalEdges || 0}</span>
            <span className="text-[10px] uppercase text-muted-foreground tracking-widest mt-1">Total Edges</span>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <span className="text-3xl font-bold text-primary">{stats?.densityScore?.toFixed(3) || "0.000"}</span>
            <span className="text-[10px] uppercase text-muted-foreground tracking-widest mt-1">Density Score</span>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <span className="text-3xl font-bold text-destructive">{stats?.contextDriftScore?.toFixed(2) || "0.00"}</span>
            <span className="text-[10px] uppercase text-muted-foreground tracking-widest mt-1">Drift Score</span>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50 flex-1 min-h-[400px] flex flex-col">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-wrap gap-2">
              {["all", "Person", "CodeModule", "Project", "Task", "Communication"].map(type => (
                <Badge 
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  className={`cursor-pointer ${filterType === type ? 'bg-primary text-primary-foreground' : 'text-muted-foreground border-border/50'}`}
                  onClick={() => setFilterType(type)}
                  data-testid={`filter-${type}`}
                >
                  {type === "all" ? "ALL" : type.toUpperCase()}
                </Badge>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input placeholder="Search nodes..." className="pl-9 h-9 bg-background/50 border-border/50 text-xs" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-10 w-full bg-border/20" />
              <Skeleton className="h-10 w-full bg-border/20" />
              <Skeleton className="h-10 w-full bg-border/20" />
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {nodesData?.nodes.map(node => (
                <div key={node.id} className="p-4 hover:bg-muted/20 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-background border border-border/50 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{node.label}</div>
                      <div className="text-[10px] text-muted-foreground uppercase flex gap-2">
                        <span>{node.type}</span>
                        <span>•</span>
                        <span>Events: {node.eventCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">MAGNITUDE</div>
                    <div className="text-xs text-secondary font-bold">{node.vectorMagnitude.toFixed(4)}</div>
                  </div>
                </div>
              ))}
              {!nodesData?.nodes.length && (
                <div className="p-12 text-center text-muted-foreground text-sm uppercase">
                  No nodes found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
