import React from 'react';
import { Activity, Play, RotateCcw } from 'lucide-react';
import { useRippleStore } from '../store/useRippleStore';

export const Header: React.FC = () => {
  const { resetSimulation, loadDemoScenario, cascadeResult, isSimulating } = useRippleStore();
  return <header className="sticky top-0 z-30 border-b border-slate-700/60 bg-[#090f1d]/90 px-4 py-3 backdrop-blur-xl lg:px-6">
    <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/30 bg-cyan-400/10"><Activity className="h-5 w-5 text-cyan-300" /></div><div className="min-w-0"><h1 className="text-base font-bold tracking-[0.2em] text-white">RIPPLE</h1><p className="hidden truncate text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400 sm:block">Infrastructure resilience &amp; propagation analytics</p></div></div>
      <div className="hidden items-center gap-3 lg:flex"><span className="status-pill text-emerald-300"><i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />System online</span><span className="status-pill text-cyan-300"><i className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${isSimulating ? 'animate-pulse bg-amber-400' : 'bg-cyan-400'}`} />{isSimulating ? 'Processing cascade' : cascadeResult ? 'Simulation complete' : 'Network monitoring'}</span></div>
      <div className="flex items-center gap-2"><button onClick={loadDemoScenario} className="hidden items-center gap-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-500/20 sm:flex"><Play className="h-3.5 w-3.5" /> Load demo</button><button onClick={resetSimulation} className="flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-[11px] font-semibold text-slate-300 hover:bg-slate-700"><RotateCcw className="h-3.5 w-3.5" /> Reset</button></div>
    </div>
  </header>;
};
