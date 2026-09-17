/**
 * RIPPLE - Core Type Definitions
 * 
 * These types define the infrastructure network model,
 * simulation states, and cascade propagation data structures.
 */

// Infrastructure asset types
export type InfrastructureType = 
  | 'bridge' 
  | 'road' 
  | 'hospital' 
  | 'power_station' 
  | 'water_plant' 
  | 'emergency_center' 
  | 'transit_hub' 
  | 'operations_center';

// Node status in the simulation
export type NodeStatus = 'healthy' | 'at_risk' | 'degraded' | 'failed';

// Failure severity levels
export type FailureSeverity = 'minor' | 'major' | 'critical';

// Relationship types between infrastructure
export type RelationshipType = 
  | 'transport_route' 
  | 'power_supply' 
  | 'water_supply' 
  | 'access_route' 
  | 'communication' 
  | 'emergency_route'
  | 'dependency';

// Intervention types
export type InterventionType = 
  | 'repair_asset' 
  | 'reinforce_alternate' 
  | 'activate_alternate' 
  | 'protect_downstream';

/**
 * Infrastructure Node
 * Represents a single infrastructure asset in the network
 */
export interface InfrastructureNode {
  id: string;
  name: string;
  type: InfrastructureType;
  status: NodeStatus;
  criticality: number;          // 0-100 normalized score
  capacity: number;             // 0-100 current operating capacity
  baseCapacity: number;         // Original full capacity
  populationServed: number;
  recoveryTimeHours: number;
  description: string;
  // Position for visualization
  position: { x: number; y: number };
  // Stress accumulated during cascade
  stress: number;
  // Category label for grouping
  category: string;
}

/**
 * Infrastructure Edge
 * Represents a dependency or connection between two assets
 */
export interface InfrastructureEdge {
  id: string;
  source: string;
  target: string;
  dependencyStrength: number;   // 0-1, how strongly target depends on source
  flowCapacity: number;         // 0-100 flow/traffic capacity
  relationshipType: RelationshipType;
  label?: string;
  bidirectional: boolean;       // If true, dependency goes both ways
}

/**
 * Cascade Step
 * Represents one step in the propagation timeline
 */
export interface CascadeStep {
  timeStep: number;             // T+0, T+1, etc.
  label: string;                // Human-readable label
  description: string;          // What happened at this step
  affectedNodes: string[];      // Node IDs affected at this step
  newStatuses: Record<string, NodeStatus>; // Status changes
  stressLevels: Record<string, number>;    // Stress levels at this step
}

/**
 * Cascade Result
 * Complete result of a cascade simulation
 */
export interface CascadeResult {
  initialFailures: string[];
  severity: FailureSeverity;
  steps: CascadeStep[];
  finalStatuses: Record<string, NodeStatus>;
  finalStress: Record<string, number>;
  propagationPaths: string[][];  // Array of paths [nodeA, nodeB, nodeC]
  totalAffected: number;
  failedCount: number;
  degradedCount: number;
  atRiskCount: number;
  populationAffected: number;
  criticalServicesAffected: string[];
  estimatedRecoveryHours: number;
  resilienceScore: number;
  explanation: string;
}

/**
 * Intervention
 * A possible intervention action
 */
export interface Intervention {
  id: string;
  type: InterventionType;
  name: string;
  description: string;
  targetNodeId: string;
  effectDescription: string;
  // How much this intervention reduces stress/improves capacity
  stressReduction: number;      // 0-1
  capacityRestoration: number;  // 0-100 how much capacity is restored
  applicableWhen: string[];     // Node IDs that must be failed/degraded
}

/**
 * Scenario Preset
 * Pre-configured failure scenario
 */
export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  failures: { nodeId: string; severity: FailureSeverity }[];
  suggestedInterventions: string[];
}

/**
 * Comparison Result
 * Side-by-side comparison of scenarios
 */
export interface ComparisonResult {
  withoutIntervention: CascadeResult;
  withIntervention: CascadeResult;
  interventionApplied: Intervention;
  improvements: {
    affectedReduction: number;
    populationSaved: number;
    resilienceImprovement: number;
    recoveryTimeReduction: number;
    criticalServicesSaved: number;
  };
}

/**
 * Simulation State
 * Global state of the simulation
 */
export interface SimulationState {
  nodes: InfrastructureNode[];
  edges: InfrastructureEdge[];
  isSimulating: boolean;
  cascadeResult: CascadeResult | null;
  interventionResult: CascadeResult | null;
  comparison: ComparisonResult | null;
  activeScenario: ScenarioPreset | null;
  appliedIntervention: Intervention | null;
  currentStep: number;          // For timeline animation
  baselineResilience: number;
}
