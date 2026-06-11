import { useState } from "react";
import { useReverseQuery } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Search, Loader2, Target, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ReverseQuery() {
  const [query, setQuery] = useState("");
  const [window, setWindow] = useState([240]);
  const [result, setResult] = useState<any>(null);
  
  const queryMutation = useReverseQuery();

  const handleSearch = () => {
    if (!query.trim()) return;
    queryMutation.mutate(
      { data: { query, windowMinutes: window[0], compressionLevel: 0.5 } },
      { onSuccess: (res) => setResult(res) }
    );
  };

  return (
    <div className="space-y-6 font-mono animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-widest text-foreground">Reverse Query</h1>
        <p className="text-muted-foreground text-sm">Interrogate the offline event window</p>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-muted-foreground">Interrogation Prompt</label>
            <Textarea 
              placeholder="e.g. While I was focused, did anyone touch the auth middleware?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-background/50 border-border/50 min-h-[100px] text-sm resize-none font-sans"
              data-testid="input-query"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs uppercase font-bold text-muted-foreground">Lookback Window</label>
              <span className="text-xs font-bold text-primary">{window[0]} minutes</span>
            </div>
            <Slider 
              value={window} 
              onValueChange={setWindow} 
              max={480} 
              min={30}
              step={30}
              data-testid="slider-window"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>30m</span>
              <span>8h</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSearch} 
              disabled={!query.trim() || queryMutation.isPending}
              className="w-full sm:w-auto uppercase tracking-wider text-xs font-bold"
              data-testid="btn-submit-query"
            >
              {queryMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Execute Query
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <Card className="bg-card/50 border-primary/30">
            <CardHeader className="pb-3 border-b border-border/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Synthesis Result
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/50">
                  CONFIDENCE: {(result.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-sm text-foreground font-sans leading-relaxed">
                {result.answer}
              </div>
              
              {result.sourceLinks?.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/30">
                  <div className="text-xs uppercase text-muted-foreground mb-3 font-bold">Source Material</div>
                  <div className="flex flex-wrap gap-2">
                    {result.sourceLinks.map((link: string, i: number) => (
                      <a key={i} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs bg-background/50 border border-border/50 px-2 py-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <LinkIcon className="w-3 h-3" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
