import { useState } from "react";
import { useGetIngestionStats, useListRecentEvents, useGetCurrentSession, useStartSession, useEndSession, getGetIngestionStatsQueryKey, getGetCurrentSessionQueryKey, getListRecentEventsQueryKey, type ListRecentEventsParams } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Activity, Database, Triangle } from "lucide-react";
import { SiGithub, SiSlack } from "react-icons/si";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function MissionControl() {
  const queryClient = useQueryClient();
  const recentParams: ListRecentEventsParams = { limit: 10 };
  const { data: stats } = useGetIngestionStats({
    query: { refetchInterval: 3000, queryKey: getGetIngestionStatsQueryKey() }
  });
  
  const { data: recentEvents } = useListRecentEvents(
    recentParams,
    { query: { refetchInterval: 3000, queryKey: getListRecentEventsQueryKey(recentParams) } }
  );

  const { data: session } = useGetCurrentSession({
    query: { refetchInterval: 5000, queryKey: getGetCurrentSessionQueryKey() }
  });

  const startSession = useStartSession();
  const endSession = useEndSession();

  const handleStartSession = () => {
    startSession.mutate(
      { data: { userId: "user-1", focusLabel: "Deep Work Block" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
        }
      }
    );
  };

  const handleEndSession = () => {
    endSession.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6 font-mono animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Mission Control</h1>
          <p className="text-muted-foreground text-sm">System status & active focus block tracking</p>
        </div>
        
        <div className="flex items-center gap-4">
          {session?.status === "active" ? (
            <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 px-4 py-2 rounded-md">
              <div className="flex flex-col">
                <span className="text-xs text-primary uppercase font-bold tracking-wider">Active Focus</span>
                <span className="text-sm font-bold text-foreground">{session.focusLabel || "Unlabeled"}</span>
              </div>
              <Button onClick={handleEndSession} variant="destructive" size="sm" className="ml-4 font-bold tracking-wider uppercase text-xs" data-testid="btn-end-session">
                <Square className="w-3 h-3 mr-2" />
                End Session
              </Button>
            </div>
          ) : (
            <Button onClick={handleStartSession} className="font-bold tracking-wider uppercase text-xs" data-testid="btn-start-session">
              <Play className="w-3 h-3 mr-2" />
              Start Focus Block
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 border-border/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4" />
              Ingestion Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats?.totalEventsIngested?.toLocaleString() || "---"}</div>
            <div className="text-xs text-muted-foreground uppercase">Total Events</div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Rate:</span>
                <span className="text-secondary">{stats?.processingRatePerMin || 0}/min</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Deduped:</span>
                <span className="text-foreground">{stats?.deduplicatedCount || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Entities:</span>
                <span className="text-primary">{stats?.entitiesResolved || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 backdrop-blur md:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Event Stream
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
              {recentEvents?.total || 0} recorded
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {!recentEvents?.events?.length ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm uppercase">
                  No events received
                </div>
              ) : (
                recentEvents.events.map((event) => (
                  <div key={event.id} className="flex gap-3 text-sm py-2 border-b border-border/30 last:border-0 items-start">
                    <div className="mt-0.5 shrink-0">
                      {event.source === "github" && <SiGithub className="w-4 h-4 text-blue-400" />}
                      {event.source === "slack" && <SiSlack className="w-4 h-4 text-green-400" />}
                      {event.source === "linear" && <Triangle className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground text-xs">{event.actor}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{event.eventType}</span>
                        {event.deduplicated && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">DEDUP</Badge>}
                      </div>
                      <p className="text-muted-foreground text-xs truncate" title={event.summary}>{event.summary}</p>
                    </div>
                    <div className="text-[10px] text-muted-foreground shrink-0 text-right">
                      {format(new Date(event.timestamp), "HH:mm:ss")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
