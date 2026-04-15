import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Brain, RefreshCw } from 'lucide-react';

export default function AiModuleShell({ title, description, icon: Icon, onRun, loading, hasResult, children, runLabel = 'Run Analysis' }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <Button onClick={onRun} disabled={loading} size="sm" className="gap-2 shrink-0">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : hasResult ? <RefreshCw className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
          {loading ? 'Analyzing…' : runLabel}
        </Button>
      </div>

      {loading && (
        <Card>
          <CardContent className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">AI is analyzing your operational data…</span>
          </CardContent>
        </Card>
      )}

      {!loading && !hasResult && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-muted-foreground text-center">
            <Brain className="w-8 h-8 opacity-30" />
            <p className="text-sm">Click "{runLabel}" to run this analysis on your live data.</p>
          </CardContent>
        </Card>
      )}

      {!loading && hasResult && children}
    </div>
  );
}