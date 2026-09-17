/**
 * RIPPLE — Overview Panel
 * 
 * Main overview showing metrics, network visualization, and critical assets.
 */

import React, { useMemo } from 'react';
import { useRippleStore } from '../store/useRippleStore';
import { MetricCard } from './MetricCard';
import { NetworkGraph } from './NetworkGraph';
import { CriticalAssetExplorer } from './CriticalAssetExplorer';
import { Activity, ShieldCheck, ShieldAlert, ShieldX, Users, Zap, AlertTriangle } from 'lucide-react';

export const OverviewPanel: React.FC = () => {
  const { nodes, edges, cascadeResult, baselineResilience } = useRippleStore();

  const metrics = useMemo(() => {
    const total = nodes.length;
    const healthy = nodes.filter(n => n.status === 'healthy').length;
    const atRisk = nodes.filter(n => n.status === 'at_risk').length;
    const degraded = nodes.filter(n => n.status === 'degraded').length;
    const failed = nodes.filter(n => n.status === 'failed').length;

    const populationAffected = nodes
      .filter(n => n.status !== 'healthy')
      .reduce((acc, n) => {
        const factor = n.status === 'failed' ? 1.0 : n.status === 'degraded' ? 0.6 : 0.3;
        return acc + Math.round(n.populationServed * factor);
      }, 0);

    const resilience = cascadeResult ? cascadeResult.resilienceScore : baselineResilience;
    const activeFailures = failed + degraded;

    return { total, healthy, atRisk, degraded, failed, populationAffected, resilience, activeFailures };
  }, [nodes, cascadeResult, baselineResilience]);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        <MetricCard label="Total Assets" value={metrics.total} icon={<Activity className="w-5 h-5" />} color="blue" />
        <MetricCard label="Healthy" value={metrics.healthy} icon={<ShieldCheck className="w-5 h-5" />} color="green" />
        <MetricCard label="At Risk" value={metrics.atRisk} icon={<ShieldAlert className="w-5 h-5" />} color="amber" />
        <MetricCard label="Degraded" value={metrics.degraded} icon={<AlertTriangle className="w-5 h-5" />} color="amber" />
        <MetricCard label="Failed" value={metrics.failed} icon={<ShieldX className="w-5 h-5" />} color="red" />
        <MetricCard
          label="Resilience"
          value={metrics.resilience}
          icon={<Zap className="w-5 h-5" />}
          color={metrics.resilience > 80 ? 'green' : metrics.resilience > 50 ? 'amber' : 'red'}
          subtitle="Prototype Score"
        />
        <MetricCard
          label="Pop. Affected"
          value={metrics.populationAffected > 0 ? metrics.populationAffected.toLocaleString() : '0'}
          icon={<Users className="w-5 h-5" />}
          color={metrics.populationAffected > 0 ? 'red' : 'default'}
        />
      </div>

      {/* Network Graph */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Infrastructure Network Topology</h2>
          <span className="text-[10px] text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
            Simulated City Network
          </span>
        </div>
        <div className="h-[500px]">
          <NetworkGraph
            nodes={nodes}
            edges={edges}
            cascadeResult={cascadeResult}
          />
        </div>
      </div>

      {/* Critical Assets */}
      <CriticalAssetExplorer />

      {/* Data transparency notice */}
      <div className="text-center text-[11px] text-slate-600 py-2">
        All infrastructure, population, capacity and impact values shown in this prototype are simulated for demonstration.
      </div>
    </div>
  );
};
