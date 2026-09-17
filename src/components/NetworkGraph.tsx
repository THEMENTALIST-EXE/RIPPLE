/**
 * RIPPLE — Network Graph Visualization
 * 
 * Interactive infrastructure network visualization using @xyflow/react.
 * Shows infrastructure assets as custom nodes with status indicators,
 * and connections as styled edges with type-based coloring.
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { InfrastructureNode, InfrastructureEdge, CascadeResult } from '../types';

// Icons mapping for infrastructure types
const iconMap: Record<string, string> = {
  bridge: '🌉',
  road: '🛤️',
  hospital: '🏥',
  power_station: '⚡',
  water_plant: '💧',
  emergency_center: '🚨',
  transit_hub: '🚉',
  operations_center: '🏢',
};

// Status color mapping
const statusColors: Record<string, string> = {
  healthy: '#10b981',
  at_risk: '#f59e0b',
  degraded: '#f97316',
  failed: '#ef4444',
};

// Edge colors by relationship type
const edgeColors: Record<string, string> = {
  power_supply: '#eab308',
  water_supply: '#3b82f6',
  transport_route: '#94a3b8',
  access_route: '#94a3b8',
  emergency_route: '#ef4444',
  communication: '#a855f7',
  dependency: '#64748b',
};

type CustomNodeData = {
  nodeId: string;
  name: string;
  type: string;
  status: string;
  criticality: number;
  stress: number;
};

function CustomNode({ data }: { data: CustomNodeData }) {
  const isFailed = data.status === 'failed';
  const isDegraded = data.status === 'degraded';
  const borderColor = statusColors[data.status] || '#475569';

  return (
    <div
      className={`relative group rounded-lg shadow-lg border-2 bg-slate-800/95 backdrop-blur px-3 py-2 flex flex-col items-center justify-center min-w-[70px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl ${
        isFailed ? 'animate-pulse-red' : isDegraded ? 'animate-pulse-amber' : ''
      }`}
      style={{
        borderColor,
        boxShadow: isFailed
          ? `0 0 20px ${borderColor}40`
          : isDegraded
          ? `0 0 12px ${borderColor}30`
          : 'none',
      }}
      title={`${data.name}\nStatus: ${data.status}\nCriticality: ${data.criticality}`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-600 !border-slate-500 !opacity-0" />
      <div className="text-2xl mb-0.5 select-none">{iconMap[data.type] || '📍'}</div>
      <div className="text-[11px] font-bold text-slate-100 tracking-wide">{data.nodeId}</div>
      {data.stress > 0 && (
        <div className="text-[9px] text-slate-400 mt-0.5">
          {Math.round(data.stress * 100)}%
        </div>
      )}
      <div
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900"
        style={{ backgroundColor: statusColors[data.status] || '#94a3b8' }}
      />
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-slate-200 text-[11px] rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-700">
        <div className="font-semibold">{data.name.split('—')[0].trim()}</div>
        <div className="text-slate-400 capitalize">{data.status.replace('_', ' ')}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-600 !border-slate-500 !opacity-0" />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

interface NetworkGraphProps {
  nodes: InfrastructureNode[];
  edges: InfrastructureEdge[];
  cascadeResult?: CascadeResult | null;
  onNodeClick?: (nodeId: string) => void;
  currentStep?: number;
  className?: string;
}

export function NetworkGraph({
  nodes,
  edges,
  cascadeResult,
  onNodeClick,
  currentStep = 0,
  className = '',
}: NetworkGraphProps) {
  const flowNodes = useMemo<Node[]>(() => {
    return nodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: { x: node.position.x, y: node.position.y },
      data: {
        nodeId: node.id,
        name: node.name,
        type: node.type,
        status: node.status,
        criticality: node.criticality,
        stress: node.stress,
      } as CustomNodeData,
    }));
  }, [nodes]);

  const flowEdges = useMemo<Edge[]>(() => {
    return edges.map((edge) => {
      const color = edgeColors[edge.relationshipType] || '#64748b';
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      const isAffected = cascadeResult !== null &&
        sourceNode && targetNode &&
        sourceNode.status !== 'healthy' && targetNode.status !== 'healthy';

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: !!isAffected,
        style: {
          stroke: isAffected ? '#ef4444' : color,
          strokeWidth: isAffected ? 3 : 1.5,
          opacity: isAffected ? 1 : 0.6,
        },
        markerEnd: edge.bidirectional ? undefined : {
          type: MarkerType.ArrowClosed,
          color: isAffected ? '#ef4444' : color,
          width: 14,
          height: 14,
        },
      };
    });
  }, [edges, nodes, cascadeResult, currentStep]);

  const [rfNodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  }, [onNodeClick]);

  return (
    <div className={`w-full h-full relative bg-[#0f172a] rounded-lg overflow-hidden ${className}`}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        className="bg-[#0f172a]"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e293b" />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-slate-800/90 backdrop-blur border border-slate-700/60 p-3 rounded-lg text-[10px] text-slate-300 shadow-xl pointer-events-none">
        <div className="font-semibold text-slate-200 mb-1.5 text-[11px]">Legend</div>
        <div className="flex gap-5">
          <div>
            <div className="text-slate-500 mb-1 font-medium">Status</div>
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize">{status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-slate-500 mb-1 font-medium">Connection</div>
            <div className="flex items-center gap-1.5 mb-0.5"><div className="w-4 h-[2px] bg-[#eab308]" /><span>Power</span></div>
            <div className="flex items-center gap-1.5 mb-0.5"><div className="w-4 h-[2px] bg-[#3b82f6]" /><span>Water</span></div>
            <div className="flex items-center gap-1.5 mb-0.5"><div className="w-4 h-[2px] bg-[#94a3b8]" /><span>Transport</span></div>
            <div className="flex items-center gap-1.5 mb-0.5"><div className="w-4 h-[2px] bg-[#ef4444]" /><span>Emergency</span></div>
            <div className="flex items-center gap-1.5 mb-0.5"><div className="w-4 h-[2px] bg-[#a855f7]" /><span>Comms</span></div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 font-medium">Infrastructure</div>
            <div className="grid grid-cols-2 gap-x-3">
              {Object.entries(iconMap).map(([type, icon]) => (
                <div key={type} className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs">{icon}</span>
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
