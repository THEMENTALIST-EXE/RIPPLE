import React, { useState } from 'react';
import { AlertTriangle, Loader2, RotateCcw, Zap } from 'lucide-react';
import { useRippleStore } from '../store/useRippleStore';
import type { FailureSeverity } from '../types';

const severity: { id: FailureSeverity; label: string; hint: string }[] = [
  { id: 'minor', label: 'Minor', hint: 'Partial service loss' }, { id: 'major', label: 'Major', hint: 'Significant disruption' }, { id: 'critical', label: 'Critical', hint: 'Complete outage' },
];
export const FailureSimulator: React.FC = () => {
  const { nodes, selectedFailures, isSimulating, cascadeResult, addFailure, clearFailures, runSimulation, resetSimulation } = useRippleStore();
  const [nodeId, setNodeId] = useState('B1'); const [level, setLevel] = useState<FailureSeverity>('critical'); const queued = selectedFailures[0];
  const queueFailure = () => { clearFailures(); addFailure(nodeId, level); };
  return <section className="panel overflow-hidden"><div className="border-b border-slate-700/60 bg-red-500/[0.035] px-5 py-4"><div className="eyebrow text-red-300"><AlertTriangle className="h-3.5 w-3.5" /> Scenario controls</div><h2 className="mt-1 text-base font-semibold text-white">Failure simulator</h2><p className="mt-1 text-xs leading-5 text-slate-400">Model an asset outage and observe dependency-driven effects.</p></div><div className="space-y-4 p-5">
    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Target asset<select value={nodeId} onChange={(e) => setNodeId(e.target.value)} disabled={isSimulating} className="control mt-2">{nodes.map((node) => <option key={node.id} value={node.id}>{node.id} · {node.name.replace('—', '-')}</option>)}</select></label>
    <div><div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Failure severity</div><div className="grid grid-cols-3 gap-2">{severity.map((item) => <button key={item.id} type="button" onClick={() => setLevel(item.id)} className={`rounded-md border px-2 py-2 text-left transition ${level === item.id ? item.id === 'critical' ? 'border-red-400/70 bg-red-500/15 text-red-200' : 'border-cyan-400/70 bg-cyan-500/10 text-cyan-100' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500'}`}><span className="block text-xs font-semibold">{item.label}</span><span className="mt-0.5 block text-[9px] leading-3 opacity-70">{item.hint}</span></button>)}</div></div>
    <button onClick={queueFailure} disabled={isSimulating} className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50">{queued ? `Queued: ${queued.nodeId} / ${queued.severity}` : 'Queue selected failure'}</button>
    <button onClick={() => { if (queued) runSimulation(); else { queueFailure(); window.setTimeout(() => useRippleStore.getState().runSimulation(), 0); } }} disabled={isSimulating} className="flex w-full items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-3 text-xs font-bold tracking-wider text-white shadow-lg shadow-red-950/30 transition hover:bg-red-400 disabled:opacity-50">{isSimulating ? <><Loader2 className="h-4 w-4 animate-spin" /> SIMULATING...</> : <><Zap className="h-4 w-4" /> {cascadeResult ? 'FAILURE SIMULATED' : 'SIMULATE FAILURE'}</>}</button>
    <button onClick={resetSimulation} className="flex w-full items-center justify-center gap-2 text-xs text-slate-400 hover:text-cyan-300"><RotateCcw className="h-3.5 w-3.5" /> Reset simulation</button>
  </div></section>;
};
