import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const FictionalDemoBanner: React.FC = () => {
  return (
    <div className="fictional-demo-badge" aria-label="Demo notice">
      <AlertTriangle className="w-3 h-3 text-red-400" />
      <span>Fictional Demo Fixture</span>
    </div>
  );
};
