/**
 * RIPPLE — Intervention Planner Component
 * 
 * Allows users to select and apply interventions after a failure simulation.
 * Shows before/after comparison of intervention effects.
 */

import React from 'react';
import { useRippleStore } from '../store/useRippleStore';
import type { Intervention } from '../types';
import {
  Shield,
  Wrench,
  Route,
  Building2,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Activity,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const interventionIcons: Record<string, React.ReactNode> = {
  repair_asset: <Wrench className="w-5 h-5" />,
  reinforce_alternate: <Shield className="w-5 h-5" />,
  activate_alternate: <Route className="w-5 h-5" />,
  protect_downstream: <Building2 className="w-5 h-5" />,
};

export const InterventionPlanner: React.FC = () => {
  const {
    cascadeResult,
    comparison,
    appliedIntervention,
    applyIntervention,
    getAvailableInterventions,
    nodes,
    setActiveTab,
  } = useRippleStore();

  const availableInterventions = getAvailableInterventions();

  if (!cascadeResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-16 h-16 text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">
          No Active Simulation
        </h3>
        <p className="text-slate-500 max-w-md mb-6">
          Run a failure simulation first to see available interventions and compare their effectiveness.
        </p>
        <button
          onClick={() => setActiveTab('simulator')}
          className="px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg font-medium transition-all"
        >
          Go to Failure Simulator
        </button>
      </div>
    );
  }

  const handleApplyIntervention = (intervention: Intervention) => {
    applyIntervention(intervention);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          What If We Intervene?
        </h3>
        <p className="text-sm text-slate-400">
          Select an intervention to see how it would reduce the cascade impact.
          Results are recalculated from the simulation model.
        </p>
      </div>

      {/* Available Interventions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableInterventions.map(intervention => {
          const isApplied = appliedIntervention?.id === intervention.id;
          const targetNode = nodes.find(n => n.id === intervention.targetNodeId);

          return (
            <div
              key={intervention.id}
              className={`rounded-xl border p-5 transition-all duration-200 ${
                isApplied
                  ? 'bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/30'
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  isApplied ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700/50 text-slate-400'
                }`}>
                  {interventionIcons[intervention.type]}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm">{intervention.name}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">{intervention.description}</p>
                </div>
                {isApplied && (
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                )}
              </div>

              <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                Target: {targetNode?.name.split('—')[0].trim() || intervention.targetNodeId}
              </div>

              <div className="text-xs text-slate-300 bg-slate-700/30 rounded-lg p-2 mb-3">
                {intervention.effectDescription}
              </div>

              <button
                onClick={() => handleApplyIntervention(intervention)}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isApplied
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-700/50 text-white hover:bg-slate-700 border border-slate-600/50'
                }`}
              >
                {isApplied ? '✓ Applied — Recalculated' : 'Run Intervention'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Comparison */}
      {comparison && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Scenario Comparison
            </h3>
            <span className="text-xs text-slate-500 bg-slate-700/50 px-3 py-1 rounded-full">
              Illustrative simulation output
            </span>
          </div>

          {/* Side-by-side comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Without Intervention */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
              <div className="text-xs font-medium text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Without Intervention
              </div>
              <div className="space-y-3">
                <ComparisonRow
                  icon={<Activity className="w-4 h-4" />}
                  label="Affected Assets"
                  value={comparison.withoutIntervention.totalAffected}
                  color="text-red-400"
                />
                <ComparisonRow
                  icon={<Users className="w-4 h-4" />}
                  label="Population Affected"
                  value={comparison.withoutIntervention.populationAffected.toLocaleString()}
                  color="text-red-400"
                />
                <ComparisonRow
                  icon={<Building2 className="w-4 h-4" />}
                  label="Critical Services"
                  value={comparison.withoutIntervention.criticalServicesAffected.length}
                  color="text-red-400"
                />
                <ComparisonRow
                  icon={<Shield className="w-4 h-4" />}
                  label="Resilience Score"
                  value={comparison.withoutIntervention.resilienceScore}
                  color="text-red-400"
                />
                <ComparisonRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Recovery Time"
                  value={`${comparison.withoutIntervention.estimatedRecoveryHours}h`}
                  color="text-red-400"
                />
              </div>
            </div>

            {/* With Intervention */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
              <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                With Intervention
              </div>
              <div className="space-y-3">
                <ComparisonRow
                  icon={<Activity className="w-4 h-4" />}
                  label="Affected Assets"
                  value={comparison.withIntervention.totalAffected}
                  delta={-comparison.improvements.affectedReduction}
                  color="text-emerald-400"
                />
                <ComparisonRow
                  icon={<Users className="w-4 h-4" />}
                  label="Population Affected"
                  value={comparison.withIntervention.populationAffected.toLocaleString()}
                  delta={-comparison.improvements.populationSaved}
                  color="text-emerald-400"
                />
                <ComparisonRow
                  icon={<Building2 className="w-4 h-4" />}
                  label="Critical Services"
                  value={comparison.withIntervention.criticalServicesAffected.length}
                  delta={-comparison.improvements.criticalServicesSaved}
                  color="text-emerald-400"
                />
                <ComparisonRow
                  icon={<Shield className="w-4 h-4" />}
                  label="Resilience Score"
                  value={comparison.withIntervention.resilienceScore}
                  delta={comparison.improvements.resilienceImprovement}
                  positive
                  color="text-emerald-400"
                />
                <ComparisonRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Recovery Time"
                  value={`${comparison.withIntervention.estimatedRecoveryHours}h`}
                  delta={-comparison.improvements.recoveryTimeReduction}
                  color="text-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Bar chart comparison */}
          <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  {
                    name: 'Affected Assets',
                    'Without Intervention': comparison.withoutIntervention.totalAffected,
                    'With Intervention': comparison.withIntervention.totalAffected,
                  },
                  {
                    name: 'Critical Services',
                    'Without Intervention': comparison.withoutIntervention.criticalServicesAffected.length,
                    'With Intervention': comparison.withIntervention.criticalServicesAffected.length,
                  },
                  {
                    name: 'Resilience',
                    'Without Intervention': comparison.withoutIntervention.resilienceScore,
                    'With Intervention': comparison.withIntervention.resilienceScore,
                  },
                ]}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Bar dataKey="Without Intervention" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="With Intervention" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Improvement summary */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
            <div className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Intervention Impact Summary
            </div>
            <p className="text-sm text-slate-300">
              Applying "{comparison.interventionApplied.name}" reduces the number of affected assets
              by {comparison.improvements.affectedReduction} and improves the resilience score
              by {comparison.improvements.resilienceImprovement} points.
              {comparison.improvements.populationSaved > 0 && (
                <> Approximately {comparison.improvements.populationSaved.toLocaleString()} fewer
                  people would be impacted by the disruption.</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface ComparisonRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delta?: number;
  positive?: boolean;
  color?: string;
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({
  icon,
  label,
  value,
  delta,
  positive,
  color = 'text-slate-300',
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-slate-400 text-sm">
      {icon}
      {label}
    </div>
    <div className="flex items-center gap-2">
      <span className={`font-semibold text-sm ${color}`}>{value}</span>
      {delta !== undefined && delta !== 0 && (
        <span className={`text-xs flex items-center gap-0.5 ${
          (positive ? delta > 0 : delta < 0) ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {delta > 0 ? '+' : ''}{typeof delta === 'number' && Math.abs(delta) > 1000 ? `${(delta/1000).toFixed(1)}k` : delta}
        </span>
      )}
    </div>
  </div>
);
