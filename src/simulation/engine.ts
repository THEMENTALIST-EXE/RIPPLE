/**
 * RIPPLE — Cascade Simulation Engine
 * 
 * Graph-based cascade simulation engine.
 * Implements deterministic failure propagation through an infrastructure network.
 * 
 * Algorithm Overview:
 * 1. Mark initial failed node(s)
 * 2. Calculate stress on neighboring nodes using:
 *    stress = dependencyStrength × failureSeverity × (1 - alternativeCapacity)
 * 3. If accumulated stress exceeds threshold, node becomes degraded or failed
 * 4. Propagation continues in waves (BFS-like) until no new nodes cross threshold
 * 5. Each wave = one time step in the cascade timeline
 * 
 * Criticality Scoring:
 * Uses graph centrality concepts — connection count, downstream population,
 * dependency weight, and alternative route availability.
 * 
 * Resilience Score:
 * Weighted combination of asset health, connectivity, critical service 
 * availability, and population impact. Normalized to 0-100.
 */

import type {
  InfrastructureNode,
  InfrastructureEdge,
  NodeStatus,
  FailureSeverity,
  CascadeResult,
  CascadeStep,
  Intervention,
} from '../types';

// ============================================================
// Constants
// ============================================================

/** Stress threshold for AT_RISK status */
const AT_RISK_THRESHOLD = 0.25;

/** Stress threshold for DEGRADED status */
const DEGRADED_THRESHOLD = 0.55;

/** Stress threshold for FAILED status */
const FAILED_THRESHOLD = 0.85;

/** Severity multipliers */
const SEVERITY_MULTIPLIER: Record<FailureSeverity, number> = {
  minor: 0.4,
  major: 0.7,
  critical: 1.0,
};

/** Infrastructure type weights for criticality */
const TYPE_WEIGHT: Record<string, number> = {
  hospital: 1.5,
  emergency_center: 1.4,
  power_station: 1.3,
  water_plant: 1.2,
  bridge: 1.1,
  transit_hub: 1.0,
  operations_center: 1.0,
  road: 0.8,
};

/** Criticality formula weights */
const CRITICALITY_WEIGHTS = {
  connections: 0.25,
  populationServed: 0.25,
  downstreamAssets: 0.2,
  dependencyWeight: 0.15,
  typeImportance: 0.15,
};

/** Resilience formula weights */
const RESILIENCE_WEIGHTS = {
  assetHealth: 0.3,
  connectivity: 0.25,
  criticalServices: 0.25,
  populationSafety: 0.2,
};

// ============================================================
// Criticality Calculation
// ============================================================

/**
 * Calculate the criticality score for each node in the network.
 * 
 * Score considers:
 * - Number of connections (degree centrality)
 * - Total population served by downstream assets
 * - Number of downstream dependent assets
 * - Sum of dependency strengths on incoming edges
 * - Infrastructure type importance
 * 
 * Returns normalized score from 0-100.
 */
export function calculateCriticality(
  nodes: InfrastructureNode[],
  edges: InfrastructureEdge[]
): InfrastructureNode[] {
  const maxConnections = Math.max(
    ...nodes.map(n => getConnections(n.id, edges).length),
    1
  );
  const maxPopulation = Math.max(...nodes.map(n => n.populationServed), 1);
  
  return nodes.map(node => {
    const connections = getConnections(node.id, edges);
    const downstreamNodes = getDownstreamNodes(node.id, edges, nodes);
    const downstreamPopulation = downstreamNodes.reduce(
      (sum, n) => sum + n.populationServed, 0
    );
    const maxDownstream = Math.max(
      ...nodes.map(n => getDownstreamNodes(n.id, edges, nodes).length),
      1
    );
    const maxDownstreamPop = Math.max(
      ...nodes.map(n => 
        getDownstreamNodes(n.id, edges, nodes)
          .reduce((s, dn) => s + dn.populationServed, 0)
      ),
      1
    );
    
    // Normalized components (0-1)
    const connectionScore = connections.length / maxConnections;
    const populationScore = (node.populationServed + downstreamPopulation * 0.5) / 
      (maxPopulation + maxDownstreamPop * 0.5);
    const downstreamScore = downstreamNodes.length / maxDownstream;
    const depWeight = connections.reduce((sum, e) => sum + e.dependencyStrength, 0) / 
      Math.max(connections.length, 1);
    const typeScore = (TYPE_WEIGHT[node.type] || 1) / 1.5;

    // Weighted combination
    const raw = 
      CRITICALITY_WEIGHTS.connections * connectionScore +
      CRITICALITY_WEIGHTS.populationServed * populationScore +
      CRITICALITY_WEIGHTS.downstreamAssets * downstreamScore +
      CRITICALITY_WEIGHTS.dependencyWeight * depWeight +
      CRITICALITY_WEIGHTS.typeImportance * typeScore;

    // Normalize to 0-100
    const criticality = Math.round(Math.min(100, Math.max(0, raw * 100)));

    return { ...node, criticality };
  });
}

/**
 * Generate human-readable explanation of why a node is critical
 */
export function generateCriticalityExplanation(
  node: InfrastructureNode,
  edges: InfrastructureEdge[],
  allNodes: InfrastructureNode[]
): string {
  const connections = getConnections(node.id, edges);
  const downstream = getDownstreamNodes(node.id, edges, allNodes);
  const transportConn = connections.filter(e => 
    ['transport_route', 'access_route', 'emergency_route'].includes(e.relationshipType)
  ).length;
  const powerConn = connections.filter(e => e.relationshipType === 'power_supply').length;
  const criticalDownstream = downstream.filter(n => 
    ['hospital', 'emergency_center'].includes(n.type)
  );

  const parts: string[] = [];
  parts.push(`${node.name} has a criticality score of ${node.criticality}/100.`);

  if (connections.length >= 5) {
    parts.push(`It has ${connections.length} direct connections, making it a major network hub.`);
  } else if (connections.length >= 3) {
    parts.push(`It connects to ${connections.length} other infrastructure assets.`);
  }

  if (transportConn > 0) {
    parts.push(`It provides ${transportConn} transport/access connection(s).`);
  }
  if (powerConn > 0) {
    parts.push(`It supplies power to ${powerConn} dependent facilit${powerConn > 1 ? 'ies' : 'y'}.`);
  }

  if (criticalDownstream.length > 0) {
    const names = criticalDownstream.map(n => n.name.split('—')[0].trim()).join(', ');
    parts.push(`Its failure would directly impact critical services: ${names}.`);
  }

  if (node.populationServed > 50000) {
    parts.push(`It serves approximately ${node.populationServed.toLocaleString()} people.`);
  }

  if (downstream.length > 3) {
    parts.push(
      `A failure here could cascade to ${downstream.length} additional assets, ` +
      `potentially affecting ${downstream.reduce((s, n) => s + n.populationServed, 0).toLocaleString()} additional people.`
    );
  }

  return parts.join(' ');
}

// ============================================================
// Cascade Simulation
// ============================================================

/**
 * Run the cascade simulation.
 * 
 * This is the core propagation algorithm:
 * 
 * 1. Initialize: Mark specified nodes as FAILED, set their stress to 1.0
 * 2. Wave propagation (BFS):
 *    For each wave (timeStep):
 *    a. Collect all nodes affected in previous step
 *    b. For each affected node, traverse its outgoing edges
 *    c. Calculate stress on each neighbor:
 *       stress += dependencyStrength × failureSeverity × sourceStressLevel
 *              × (1 - alternativeSupplyFactor)
 *    d. Apply status based on accumulated stress vs thresholds
 *    e. Record changes for this time step
 * 3. Continue until no new nodes change status
 * 4. Calculate summary metrics
 * 
 * @param nodes Current node state
 * @param edges Network edges
 * @param failedNodeIds IDs of initially failing nodes
 * @param severity Failure severity level
 * @param intervention Optional intervention to apply
 * @returns Complete cascade result
 */
export function runCascadeSimulation(
  nodes: InfrastructureNode[],
  edges: InfrastructureEdge[],
  failedNodeIds: string[],
  severity: FailureSeverity,
  intervention?: Intervention
): CascadeResult {
  // Deep clone nodes so we don't mutate the originals
  const simNodes = nodes.map(n => ({ ...n, status: 'healthy' as NodeStatus, stress: 0, capacity: n.baseCapacity }));
  const sevMultiplier = SEVERITY_MULTIPLIER[severity];
  
  const steps: CascadeStep[] = [];
  const propagationPaths: string[][] = [];
  const parentMap: Record<string, string> = {};

  // ---- Step 0: Initial failure ----
  const initialAffected: string[] = [];
  const initialStatuses: Record<string, NodeStatus> = {};
  const initialStress: Record<string, number> = {};
  
  for (const nodeId of failedNodeIds) {
    const node = simNodes.find(n => n.id === nodeId);
    if (node) {
      node.status = 'failed';
      node.stress = 1.0;
      node.capacity = 0;
      initialAffected.push(nodeId);
      initialStatuses[nodeId] = 'failed';
      initialStress[nodeId] = 1.0;
    }
  }

  steps.push({
    timeStep: 0,
    label: 'Initial Failure',
    description: `${failedNodeIds.map(id => {
      const n = simNodes.find(nd => nd.id === id);
      return n ? n.name.split('—')[0].trim() : id;
    }).join(', ')} ${failedNodeIds.length > 1 ? 'have' : 'has'} failed.`,
    affectedNodes: [...initialAffected],
    newStatuses: { ...initialStatuses },
    stressLevels: { ...initialStress },
  });

  // ---- Wave propagation ----
  let currentWave = [...failedNodeIds];
  let timeStep = 1;
  const maxSteps = 10; // Safety limit

  while (currentWave.length > 0 && timeStep <= maxSteps) {
    const nextWave: string[] = [];
    const stepStatuses: Record<string, NodeStatus> = {};
    const stepStress: Record<string, number> = {};
    const stepDescription: string[] = [];

    for (const sourceId of currentWave) {
      const sourceNode = simNodes.find(n => n.id === sourceId)!;
      const outEdges = getOutgoingEdges(sourceId, edges);

      for (const edge of outEdges) {
        const targetNode = simNodes.find(n => n.id === edge.target);
        if (!targetNode || targetNode.status === 'failed') continue;

        // Calculate alternative supply factor
        // Check if target has alternative connections from healthy nodes
        const altFactor = calculateAlternativeFactor(
          targetNode.id, sourceId, simNodes, edges
        );

        // Apply intervention stress reduction if applicable
        let interventionReduction = 0;
        if (intervention && intervention.targetNodeId === targetNode.id) {
          interventionReduction = intervention.stressReduction;
        }

        /**
         * Core stress formula:
         * stress = dependencyStrength × severityMultiplier × sourceStress 
         *        × (1 - alternativeFactor) × (1 - interventionReduction)
         * 
         * Where:
         * - dependencyStrength: How strongly target depends on source (0-1)
         * - severityMultiplier: Minor=0.4, Major=0.7, Critical=1.0
         * - sourceStress: Current stress level of the failing source (0-1)
         * - alternativeFactor: Availability of alternative supply (0-1)
         * - interventionReduction: Stress reduction from intervention (0-1)
         */
        const stressIncrement =
          edge.dependencyStrength *
          sevMultiplier *
          sourceNode.stress *
          (1 - altFactor * 0.7) *
          (1 - interventionReduction);

        targetNode.stress = Math.min(1.0, targetNode.stress + stressIncrement);

        // Apply intervention capacity restoration
        if (intervention && intervention.targetNodeId === targetNode.id) {
          targetNode.capacity = Math.min(
            targetNode.baseCapacity,
            targetNode.capacity + intervention.capacityRestoration * 0.3
          );
        }

        // Determine new status based on accumulated stress
        const prevStatus = targetNode.status;
        if (targetNode.stress >= FAILED_THRESHOLD) {
          targetNode.status = 'failed';
          targetNode.capacity = Math.max(0, targetNode.baseCapacity * 0.05);
        } else if (targetNode.stress >= DEGRADED_THRESHOLD) {
          targetNode.status = 'degraded';
          targetNode.capacity = Math.max(
            targetNode.baseCapacity * 0.3,
            targetNode.baseCapacity * (1 - targetNode.stress)
          );
        } else if (targetNode.stress >= AT_RISK_THRESHOLD) {
          targetNode.status = 'at_risk';
          targetNode.capacity = Math.max(
            targetNode.baseCapacity * 0.6,
            targetNode.baseCapacity * (1 - targetNode.stress * 0.5)
          );
        }

        // Record if status changed
        if (targetNode.status !== prevStatus && targetNode.status !== 'healthy') {
          if (!nextWave.includes(targetNode.id)) {
            nextWave.push(targetNode.id);
          }
          stepStatuses[targetNode.id] = targetNode.status;
          stepStress[targetNode.id] = targetNode.stress;

          // Track propagation path
          if (!parentMap[targetNode.id]) {
            parentMap[targetNode.id] = sourceId;
          }

          const statusLabel = targetNode.status === 'failed' ? 'FAILED' :
            targetNode.status === 'degraded' ? 'DEGRADED' : 'AT RISK';
          stepDescription.push(
            `${targetNode.name.split('—')[0].trim()} is now ${statusLabel} (stress: ${(targetNode.stress * 100).toFixed(0)}%)`
          );
        }
      }
    }

    if (nextWave.length > 0) {
      const stepLabels = [
        'Primary infrastructure affected',
        'Secondary infrastructure affected',
        'Critical service impact',
        'Extended network impact',
        'Maximum network impact',
      ];

      steps.push({
        timeStep,
        label: stepLabels[Math.min(timeStep - 1, stepLabels.length - 1)],
        description: stepDescription.join('. ') + '.',
        affectedNodes: [...nextWave],
        newStatuses: { ...stepStatuses },
        stressLevels: { ...stepStress },
      });
    }

    currentWave = nextWave;
    timeStep++;
  }

  // ---- Build propagation paths ----
  const affectedNodes = simNodes.filter(n => n.status !== 'healthy');
  for (const node of affectedNodes) {
    if (failedNodeIds.includes(node.id)) continue;
    const path = buildPath(node.id, parentMap, failedNodeIds);
    if (path.length > 1) {
      propagationPaths.push(path);
    }
  }

  // ---- Calculate summary metrics ----
  const failedNodes = simNodes.filter(n => n.status === 'failed');
  const degradedNodes = simNodes.filter(n => n.status === 'degraded');
  const atRiskNodes = simNodes.filter(n => n.status === 'at_risk');
  
  const criticalTypes = ['hospital', 'emergency_center', 'power_station', 'water_plant'];
  const criticalServicesAffected = simNodes
    .filter(n => n.status !== 'healthy' && criticalTypes.includes(n.type))
    .map(n => n.name);

  const populationAffected = simNodes
    .filter(n => n.status !== 'healthy')
    .reduce((sum, n) => {
      const impactFactor = n.status === 'failed' ? 1.0 : 
        n.status === 'degraded' ? 0.6 : 0.3;
      return sum + Math.round(n.populationServed * impactFactor);
    }, 0);

  const maxRecovery = Math.max(
    ...simNodes.filter(n => n.status !== 'healthy').map(n => n.recoveryTimeHours),
    0
  );

  const resilienceScore = calculateResilience(simNodes, edges);

  // ---- Generate explanation ----
  const explanation = generateCascadeExplanation(
    failedNodeIds, simNodes, steps, propagationPaths, intervention
  );

  return {
    initialFailures: failedNodeIds,
    severity,
    steps,
    finalStatuses: Object.fromEntries(simNodes.map(n => [n.id, n.status])),
    finalStress: Object.fromEntries(simNodes.map(n => [n.id, n.stress])),
    totalAffected: failedNodes.length + degradedNodes.length + atRiskNodes.length,
    failedCount: failedNodes.length,
    degradedCount: degradedNodes.length,
    atRiskCount: atRiskNodes.length,
    populationAffected,
    criticalServicesAffected,
    estimatedRecoveryHours: maxRecovery,
    resilienceScore,
    propagationPaths,
    explanation,
  };
}

// ============================================================
// Resilience Score Calculation
// ============================================================

/**
 * Calculate the Prototype Resilience Score (0-100).
 * 
 * Formula:
 * resilience = w1 × assetHealth + w2 × connectivity + w3 × criticalServices + w4 × populationSafety
 * 
 * Where:
 * - assetHealth: Percentage of assets that are healthy or at_risk
 * - connectivity: Percentage of network edges that connect two functional nodes
 * - criticalServices: Percentage of critical-type nodes that are operational  
 * - populationSafety: Percentage of total population served by healthy assets
 */
export function calculateResilience(
  nodes: InfrastructureNode[],
  edges: InfrastructureEdge[]
): number {
  const totalNodes = nodes.length;
  if (totalNodes === 0) return 100;

  // Asset health: count nodes that are healthy or at_risk (still functional)
  const functionalNodes = nodes.filter(n => 
    n.status === 'healthy' || n.status === 'at_risk'
  ).length;
  const assetHealth = functionalNodes / totalNodes;

  // Connectivity: edges where both source and target are functional
  const functionalIds = new Set(
    nodes.filter(n => n.status !== 'failed').map(n => n.id)
  );
  const functionalEdges = edges.filter(e => 
    functionalIds.has(e.source) && functionalIds.has(e.target)
  ).length;
  const connectivity = edges.length > 0 ? functionalEdges / edges.length : 1;

  // Critical services: hospitals, emergency, power, water that are operational
  const criticalTypes = ['hospital', 'emergency_center', 'power_station', 'water_plant'];
  const criticalNodes = nodes.filter(n => criticalTypes.includes(n.type));
  const criticalFunctional = criticalNodes.filter(n => 
    n.status === 'healthy' || n.status === 'at_risk'
  ).length;
  const criticalServices = criticalNodes.length > 0 
    ? criticalFunctional / criticalNodes.length 
    : 1;

  // Population safety
  const totalPopulation = nodes.reduce((s, n) => s + n.populationServed, 0);
  const safePopulation = nodes
    .filter(n => n.status === 'healthy' || n.status === 'at_risk')
    .reduce((s, n) => s + n.populationServed, 0);
  const populationSafety = totalPopulation > 0 ? safePopulation / totalPopulation : 1;

  // Weighted combination
  const resilience = 
    RESILIENCE_WEIGHTS.assetHealth * assetHealth +
    RESILIENCE_WEIGHTS.connectivity * connectivity +
    RESILIENCE_WEIGHTS.criticalServices * criticalServices +
    RESILIENCE_WEIGHTS.populationSafety * populationSafety;

  return Math.round(resilience * 100);
}

// ============================================================
// Helper Functions
// ============================================================

/** Get all edges connected to a node (both as source and target) */
function getConnections(nodeId: string, edges: InfrastructureEdge[]): InfrastructureEdge[] {
  return edges.filter(e => 
    e.source === nodeId || e.target === nodeId || 
    (e.bidirectional && (e.source === nodeId || e.target === nodeId))
  );
}

/** Get outgoing edges from a node (including bidirectional reverse) */
function getOutgoingEdges(nodeId: string, edges: InfrastructureEdge[]): InfrastructureEdge[] {
  const direct = edges.filter(e => e.source === nodeId);
  const reverse = edges
    .filter(e => e.target === nodeId && e.bidirectional)
    .map(e => ({ ...e, source: e.target, target: e.source }));
  return [...direct, ...reverse];
}

/** Get downstream nodes (nodes that depend on this node) */
function getDownstreamNodes(
  nodeId: string,
  edges: InfrastructureEdge[],
  nodes: InfrastructureNode[]
): InfrastructureNode[] {
  const visited = new Set<string>();
  const queue = [nodeId];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const outEdges = edges.filter(e => e.source === current);
    for (const edge of outEdges) {
      if (!visited.has(edge.target) && edge.target !== nodeId) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  return nodes.filter(n => visited.has(n.id));
}

/**
 * Calculate how much alternative supply a node has if one source fails.
 * 
 * Looks at other incoming edges from healthy nodes that provide
 * the same type of relationship.
 * 
 * Returns 0-1 where 0 = no alternatives, 1 = fully redundant.
 */
function calculateAlternativeFactor(
  targetId: string,
  failedSourceId: string,
  nodes: InfrastructureNode[],
  edges: InfrastructureEdge[]
): number {
  // Get all incoming edges to target
  const incomingEdges = edges.filter(e => 
    e.target === targetId || (e.bidirectional && e.source === targetId)
  );

  // Get the failing edge's relationship type
  const failingEdge = edges.find(e => 
    (e.source === failedSourceId && e.target === targetId) ||
    (e.bidirectional && e.target === failedSourceId && e.source === targetId)
  );
  
  if (!failingEdge) return 0;

  // Find alternative edges of similar type from healthy nodes
  const alternatives = incomingEdges.filter(e => {
    const otherNode = e.source === targetId ? e.target : e.source;
    const node = nodes.find(n => n.id === otherNode);
    return (
      otherNode !== failedSourceId &&
      node &&
      node.status !== 'failed' &&
      e.relationshipType === failingEdge.relationshipType
    );
  });

  if (alternatives.length === 0) return 0;

  // Alternative factor based on the strongest alternative
  const maxAltStrength = Math.max(...alternatives.map(e => e.dependencyStrength));
  return Math.min(1, maxAltStrength * 0.8);
}

/** Build a path from a node back to its cascade origin */
function buildPath(
  nodeId: string,
  parentMap: Record<string, string>,
  origins: string[]
): string[] {
  const path: string[] = [nodeId];
  let current = nodeId;
  const visited = new Set<string>();
  
  while (parentMap[current] && !visited.has(current)) {
    visited.add(current);
    current = parentMap[current];
    path.unshift(current);
    if (origins.includes(current)) break;
  }
  
  return path;
}

/** Generate natural language explanation of cascade results */
function generateCascadeExplanation(
  failedIds: string[],
  nodes: InfrastructureNode[],
  steps: CascadeStep[],
  paths: string[][],
  intervention?: Intervention
): string {
  const failedNames = failedIds.map(id => {
    const n = nodes.find(nd => nd.id === id);
    return n ? n.name.split('—')[0].trim() : id;
  });

  const totalAffected = nodes.filter(n => n.status !== 'healthy').length;
  const criticalTypes = ['hospital', 'emergency_center', 'power_station', 'water_plant'];
  const criticalAffected = nodes.filter(n => 
    n.status !== 'healthy' && criticalTypes.includes(n.type)
  );

  let explanation = `System Explanation: The failure of ${failedNames.join(' and ')} ` +
    `triggered a cascade that propagated through ${steps.length} wave(s), ` +
    `ultimately affecting ${totalAffected} infrastructure asset(s). `;

  if (criticalAffected.length > 0) {
    explanation += `Critical services impacted include ${
      criticalAffected.map(n => n.name.split('—')[0].trim()).join(', ')
    }. `;
  }

  if (paths.length > 0) {
    const longestPath = paths.reduce((a, b) => a.length > b.length ? a : b);
    const pathNames = longestPath.map(id => {
      const n = nodes.find(nd => nd.id === id);
      return n ? n.name.split('—')[0].trim() : id;
    });
    explanation += `The longest propagation chain was: ${pathNames.join(' → ')}. `;
  }

  const popAffected = nodes
    .filter(n => n.status !== 'healthy')
    .reduce((s, n) => s + n.populationServed, 0);
  explanation += `Approximately ${popAffected.toLocaleString()} people are in areas served by affected infrastructure. `;

  if (intervention) {
    explanation += `With the "${intervention.name}" intervention applied, ` +
      `stress on ${nodes.find(n => n.id === intervention.targetNodeId)?.name.split('—')[0].trim() || intervention.targetNodeId} ` +
      `was reduced, limiting the cascade impact.`;
  }

  return explanation;
}
