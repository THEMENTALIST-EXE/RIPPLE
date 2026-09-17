/**
 * RIPPLE — Global State Management (Zustand)
 * 
 * Central store for the simulation state.
 * Separates UI state from simulation logic.
 */

import { create } from 'zustand';
import type {
  InfrastructureNode,
  InfrastructureEdge,
  NodeStatus,
  FailureSeverity,
  CascadeResult,
  ComparisonResult,
  Intervention,
  ScenarioPreset,
} from '../types';
import { initialNodes, initialEdges, scenarioPresets, availableInterventions } from '../data/network';
import { runCascadeSimulation, calculateCriticality, calculateResilience } from '../simulation/engine';

export type TabId = 'overview' | 'simulator' | 'impact' | 'interventions';

interface RippleStore {
  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Network state
  nodes: InfrastructureNode[];
  edges: InfrastructureEdge[];

  // Simulation inputs
  selectedFailures: { nodeId: string; severity: FailureSeverity }[];
  isSimulating: boolean;
  activeScenario: ScenarioPreset | null;

  // Simulation results
  cascadeResult: CascadeResult | null;
  interventionResult: CascadeResult | null;
  comparison: ComparisonResult | null;
  appliedIntervention: Intervention | null;

  // Timeline
  currentStep: number;
  animationComplete: boolean;

  // Baseline
  baselineResilience: number;

  // Actions
  selectScenario: (scenario: ScenarioPreset) => void;
  addFailure: (nodeId: string, severity: FailureSeverity) => void;
  removeFailure: (nodeId: string) => void;
  clearFailures: () => void;
  runSimulation: () => void;
  applyIntervention: (intervention: Intervention) => void;
  resetSimulation: () => void;
  setCurrentStep: (step: number) => void;
  loadDemoScenario: () => void;

  // Derived data
  getAvailableInterventions: () => Intervention[];
  getNodeById: (id: string) => InfrastructureNode | undefined;
}

export const useRippleStore = create<RippleStore>((set, get) => {
  // Initialize with criticality scores
  const nodesWithCriticality = calculateCriticality(initialNodes, initialEdges);
  const baselineResilience = calculateResilience(nodesWithCriticality, initialEdges);

  return {
    // Navigation
    activeTab: 'overview',
    setActiveTab: (tab) => set({ activeTab: tab }),

    // Network state
    nodes: nodesWithCriticality,
    edges: initialEdges,

    // Simulation inputs
    selectedFailures: [],
    isSimulating: false,
    activeScenario: null,

    // Simulation results
    cascadeResult: null,
    interventionResult: null,
    comparison: null,
    appliedIntervention: null,

    // Timeline
    currentStep: -1,
    animationComplete: false,

    // Baseline
    baselineResilience,

    // ---- Actions ----

    selectScenario: (scenario) => {
      set({
        selectedFailures: scenario.failures.map(f => ({ ...f })),
        activeScenario: scenario,
        cascadeResult: null,
        interventionResult: null,
        comparison: null,
        appliedIntervention: null,
        currentStep: -1,
        animationComplete: false,
        // Reset nodes to healthy
        nodes: calculateCriticality(
          initialNodes.map(n => ({ ...n, status: 'healthy' as NodeStatus, stress: 0, capacity: n.baseCapacity })),
          initialEdges
        ),
      });
    },

    addFailure: (nodeId, severity) => {
      const { selectedFailures } = get();
      if (!selectedFailures.find(f => f.nodeId === nodeId)) {
        set({ selectedFailures: [...selectedFailures, { nodeId, severity }] });
      }
    },

    removeFailure: (nodeId) => {
      const { selectedFailures } = get();
      set({ selectedFailures: selectedFailures.filter(f => f.nodeId !== nodeId) });
    },

    clearFailures: () => {
      set({ selectedFailures: [] });
    },

    runSimulation: () => {
      const { nodes, edges, selectedFailures } = get();
      if (selectedFailures.length === 0) return;

      set({ isSimulating: true, currentStep: -1, animationComplete: false });

      // Use the most severe failure level
      const maxSeverity = selectedFailures.reduce<FailureSeverity>((max, f) => {
        const order: FailureSeverity[] = ['minor', 'major', 'critical'];
        return order.indexOf(f.severity) > order.indexOf(max) ? f.severity : max;
      }, 'minor');

      const failedIds = selectedFailures.map(f => f.nodeId);

      // Run cascade simulation
      const result = runCascadeSimulation(
        nodes.map(n => ({ ...n, status: 'healthy' as NodeStatus, stress: 0, capacity: n.baseCapacity })),
        edges,
        failedIds,
        maxSeverity
      );

      // Update node states based on result
      const updatedNodes = nodes.map(n => ({
        ...n,
        status: result.finalStatuses[n.id] || 'healthy' as NodeStatus,
        stress: result.finalStress[n.id] || 0,
        capacity: result.finalStatuses[n.id] === 'failed' ? 0 :
          result.finalStatuses[n.id] === 'degraded' ? Math.round(n.baseCapacity * 0.35) :
          result.finalStatuses[n.id] === 'at_risk' ? Math.round(n.baseCapacity * 0.7) :
          n.baseCapacity,
      }));

      // Brief delay to show simulation state
      setTimeout(() => {
        set({
          nodes: updatedNodes,
          cascadeResult: result,
          isSimulating: false,
          interventionResult: null,
          comparison: null,
          appliedIntervention: null,
          currentStep: 0,
        });
      }, 800);
    },

    applyIntervention: (intervention) => {
      const { edges, selectedFailures, cascadeResult } = get();
      if (!cascadeResult || selectedFailures.length === 0) return;

      const maxSeverity = selectedFailures.reduce<FailureSeverity>((max, f) => {
        const order: FailureSeverity[] = ['minor', 'major', 'critical'];
        return order.indexOf(f.severity) > order.indexOf(max) ? f.severity : max;
      }, 'minor');

      const failedIds = selectedFailures.map(f => f.nodeId);

      // Re-run simulation with intervention applied
      const cleanNodes = initialNodes.map(n => ({
        ...n, status: 'healthy' as NodeStatus, stress: 0, capacity: n.baseCapacity,
      }));

      const interventionResult = runCascadeSimulation(
        cleanNodes,
        edges,
        failedIds,
        maxSeverity,
        intervention
      );

      // Build comparison
      const comparison: ComparisonResult = {
        withoutIntervention: cascadeResult,
        withIntervention: interventionResult,
        interventionApplied: intervention,
        improvements: {
          affectedReduction: cascadeResult.totalAffected - interventionResult.totalAffected,
          populationSaved: cascadeResult.populationAffected - interventionResult.populationAffected,
          resilienceImprovement: interventionResult.resilienceScore - cascadeResult.resilienceScore,
          recoveryTimeReduction: cascadeResult.estimatedRecoveryHours - interventionResult.estimatedRecoveryHours,
          criticalServicesSaved: cascadeResult.criticalServicesAffected.length - interventionResult.criticalServicesAffected.length,
        },
      };

      set({
        interventionResult,
        comparison,
        appliedIntervention: intervention,
      });
    },

    resetSimulation: () => {
      const cleanNodes = calculateCriticality(
        initialNodes.map(n => ({ ...n, status: 'healthy' as NodeStatus, stress: 0, capacity: n.baseCapacity })),
        initialEdges
      );
      set({
        nodes: cleanNodes,
        selectedFailures: [],
        cascadeResult: null,
        interventionResult: null,
        comparison: null,
        appliedIntervention: null,
        activeScenario: null,
        currentStep: -1,
        animationComplete: false,
        isSimulating: false,
      });
    },

    setCurrentStep: (step) => set({ currentStep: step }),

    loadDemoScenario: () => {
      const demo = scenarioPresets[0]; // Bridge B1 Failure
      get().selectScenario(demo);
      set({ activeTab: 'simulator' });
    },

    // Derived
    getAvailableInterventions: () => {
      const { selectedFailures } = get();
      const failedIds = selectedFailures.map(f => f.nodeId);
      return availableInterventions.filter(int =>
        int.applicableWhen.some(id => failedIds.includes(id))
      );
    },

    getNodeById: (id) => {
      return get().nodes.find(n => n.id === id);
    },
  };
});
