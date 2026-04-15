import { Truck, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';

export default function DispatchBoardHeader({ date, onDateChange, onToday }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-4 pb-2">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Dispatch Control</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-13">Real-time operations • Assign • Track • Optimize</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 pr-3">
          <Calendar className="w-4 h-4 text-muted-foreground ml-2.5" />
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-8 px-2 text-sm bg-transparent border-0 outline-none"
          />
        </div>
        <Button size="sm" variant="outline" onClick={onToday} className="text-xs">
          Today
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDateChange(format(addDays(new Date(date), 1), 'yyyy-MM-dd'))} className="text-xs">
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}