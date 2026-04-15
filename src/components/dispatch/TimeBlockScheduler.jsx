import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

const DEFAULT_TIME_BLOCKS = [
  { name: 'morning', start: '06:00', end: '12:00', label: 'Morning (6am–12pm)' },
  { name: 'midday', start: '12:00', end: '14:00', label: 'Midday (12pm–2pm)' },
  { name: 'afternoon', start: '14:00', end: '18:00', label: 'Afternoon (2pm–6pm)' },
  { name: 'evening', start: '18:00', end: '21:00', label: 'Evening (6pm–9pm)' }
];

const BLOCK_COLORS = {
  client_transport: 'bg-blue-50 border-blue-200',
  workforce_transport: 'bg-purple-50 border-purple-200',
  medical_delivery: 'bg-red-50 border-red-200',
  package_delivery: 'bg-amber-50 border-amber-200',
  contract_route: 'bg-green-50 border-green-200'
};

export default function TimeBlockScheduler({ rides, date }) {
  const ridesByBlock = useMemo(() => {
    const grouped = {};
    DEFAULT_TIME_BLOCKS.forEach(block => {
      grouped[block.name] = rides.filter(r => r.time_block === block.name || r.time_block === 'flexible');
    });
    return grouped;
  }, [rides]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold">Daily Schedule — {date}</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {DEFAULT_TIME_BLOCKS.map(block => {
          const blockRides = ridesByBlock[block.name] || [];
          const clientTransport = blockRides.filter(r => r.service_type === 'client_transport');
          const deliveries = blockRides.filter(r => ['package_delivery', 'medical_delivery', 'contract_route'].includes(r.service_type));

          return (
            <Card key={block.name} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-sm">{block.label}</CardTitle>
                  </div>
                  <Badge variant="outline">{blockRides.length} jobs</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {clientTransport.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-blue-600">Client Transport:</span>
                    <span className="text-muted-foreground"> {clientTransport.length} rides</span>
                  </div>
                )}
                {deliveries.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-amber-600">Deliveries:</span>
                    <span className="text-muted-foreground"> {deliveries.length} jobs</span>
                  </div>
                )}
                {blockRides.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No jobs assigned</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}