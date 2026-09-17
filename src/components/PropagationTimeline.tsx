import React from 'react';
import type { CascadeResult } from '../types';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

interface PropagationTimelineProps {
  cascadeResult: CascadeResult | null;
  currentStep: number;
}

export const PropagationTimeline: React.FC<PropagationTimelineProps> = ({ cascadeResult, currentStep }) => {
  if (!cascadeResult || !cascadeResult.steps) return null;

  return (
    <div className="flex flex-col gap-0 relative pt-2">
      {cascadeResult.steps.map((step, index) => {
        const isActive = index <= currentStep;
        const colorClass = index === 0 
          ? 'text-red-500 border-red-500' 
          : index < 3 
            ? 'text-orange-500 border-orange-500' 
            : 'text-amber-500 border-amber-500';

        const bgClass = index === 0 
          ? 'bg-red-500/10' 
          : index < 3 
            ? 'bg-orange-500/10' 
            : 'bg-amber-500/10';

        if (!isActive) return null;

        return (
          <div key={`${step.timeStep}-${index}`} className="flex gap-4 relative pb-8">
            {index < cascadeResult.steps.length - 1 && isActive && currentStep > index && (
              <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-slate-700 z-0"></div>
            )}
            
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-slate-900 ${colorClass}`}>
                {index === 0 ? <AlertTriangle size={20} /> : <ShieldAlert size={20} />}
              </div>
            </div>

            <div className={`flex-1 rounded-lg border border-slate-700 p-4 ${bgClass}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  Time T+{index}
                </h3>
                <span className="text-xs px-2 py-1 bg-slate-900 rounded text-slate-300 border border-slate-700">
                  {step.affectedNodes.length} nodes affected
                </span>
              </div>
              <p className="text-sm text-slate-300 mb-3">{step.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {step.affectedNodes.map(nodeId => (
                  <span key={nodeId} className="text-xs px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-400">
                    {nodeId}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
