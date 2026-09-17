/**
 * RIPPLE — Critical Asset Explorer
 * 
 * Shows top critical infrastructure assets with explanations
 * of why they are important and what would happen if they failed.
 */

import React, { useState } from 'react';
import { useRippleStore } from '../store/useRippleStore';
import { generateCriticalityExplanation } from '../simulation/engine';
import {
  Shield,
  ChevronRight,
  Network,
  Users,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';

const typeIcons: Record<string, string> = {
  bridge: '🌉',
  road: '🛤️',
  hospital: '🏥',
  power_station: '⚡',
  water_plant: '💧',
  emergency_center: '🚨',
  transit_hub: '🚉',
  operations_center: '🏢',
};

const criticalityColor = (score: number): string => {
  if (score >= 80) return 'text-red-400';
  if (score >= 60) return 'text-orange-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-emerald-400';
};

const criticalityBg = (score: number): string => {
  if (score >= 80) return 'bg-red-400';
  if (score >= 60) return 'bg-orange-400';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-emerald-400';
};

export const CriticalAssetExplorer: React.FC = () => {
  const { nodes, edges } = useRippleStore();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const sortedNodes = [...nodes].sort((a, b) => b.criticality - a.criticality);
  const topAssets = sortedNodes.slice(0, 8);

  const selectedAsset = selectedAssetId
    ? nodes.find(n => n.id === selectedAssetId)
    : null;

  const connectedEdges = selectedAsset
    ? edges.filter(e => e.source === selectedAsset.id || e.target === selectedAsset.id)
    : [];

  const connectedNodes = selectedAsset
    ? connectedEdges.map(e => {
        const otherId = e.source === selectedAsset.id ? e.target : e.source;
        return nodes.find(n => n.id === otherId);
      }).filter(Boolean)
    : [];

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
        <Shield className="w-5 h-5 text-cyan-400" />
        Critical Infrastructure Assets
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        Ranked by criticality score based on network connectivity, population served, and downstream dependencies.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Asset List */}
        <div className="space-y-2">
          {topAssets.map((node, index) => (
            <button
              key={node.id}
              onClick={() => setSelectedAssetId(
                selectedAssetId === node.id ? null : node.id
              )}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                selectedAssetId === node.id
                  ? 'bg-cyan-500/10 border-cyan-500/40'
                  : 'bg-slate-700/20 border-slate-700/40 hover:border-slate-600'
              }`}
            >
              <div className="text-sm font-mono text-slate-500 w-6 text-center">
                {index + 1}
              </div>
              <span className="text-xl">{typeIcons[node.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">
                  {node.name.split('—')[0].trim()}
                </div>
                <div className="text-xs text-slate-400 capitalize">
                  {node.type.replace('_', ' ')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${criticalityBg(node.criticality)}`}
                    style={{ width: `${node.criticality}%` }}
                  />
                </div>
                <span className={`text-sm font-bold min-w-[2rem] text-right ${criticalityColor(node.criticality)}`}>
                  {node.criticality}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${
                selectedAssetId === node.id ? 'rotate-90' : ''
              }`} />
            </button>
          ))}
        </div>

        {/* Detail Panel */}
        <div className={`transition-all duration-300 ${selectedAsset ? 'opacity-100' : 'opacity-50'}`}>
          {selectedAsset ? (
            <div className="bg-slate-900/50 rounded-xl border border-slate-700/40 p-5 sticky top-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeIcons[selectedAsset.type]}</span>
                  <div>
                    <h4 className="text-white font-semibold">
                      {selectedAsset.name}
                    </h4>
                    <span className="text-xs text-slate-400 capitalize">
                      {selectedAsset.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAssetId(null)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Criticality badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`text-3xl font-bold ${criticalityColor(selectedAsset.criticality)}`}>
                  {selectedAsset.criticality}
                </div>
                <div className="text-xs text-slate-400">
                  Criticality<br />Score
                </div>
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${criticalityBg(selectedAsset.criticality)}`}
                    style={{ width: `${selectedAsset.criticality}%` }}
                  />
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-300 mb-4">{selectedAsset.description}</p>

              {/* System explanation */}
              <div className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 mb-4">
                <div className="text-xs font-medium text-cyan-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  System Explanation
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {generateCriticalityExplanation(selectedAsset, edges, nodes)}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                  <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-white">
                    {selectedAsset.populationServed.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">Population</div>
                </div>
                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                  <Network className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-white">
                    {connectedEdges.length}
                  </div>
                  <div className="text-[10px] text-slate-500">Connections</div>
                </div>
                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                  <Clock className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-white">
                    {selectedAsset.recoveryTimeHours}h
                  </div>
                  <div className="text-[10px] text-slate-500">Recovery</div>
                </div>
              </div>

              {/* Connected assets */}
              <div className="text-xs font-medium text-slate-400 mb-2">
                Connected Assets
              </div>
              <div className="space-y-1">
                {connectedNodes.map(cn => cn && (
                  <div
                    key={cn.id}
                    className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/30 rounded text-xs"
                  >
                    <span>{typeIcons[cn.type]}</span>
                    <span className="text-slate-300">{cn.name.split('—')[0].trim()}</span>
                    <span className="text-slate-500 ml-auto capitalize text-[10px]">
                      {cn.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Network className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-500 text-sm">
                Select an asset to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
