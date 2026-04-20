import React from 'react';

export default function PremiumPageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-8">
      <div className="relative pb-4 border-b border-border">
        <div className="absolute top-0 left-0 h-1 w-32 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
        <h1 className="text-4xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}