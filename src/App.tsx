import { Header } from './components/Header';
import { OverviewPanel } from './components/OverviewPanel';
import { FailureSimulator } from './components/FailureSimulator';
import { ImpactSummary } from './components/ImpactSummary';
import { PropagationTimeline } from './components/PropagationTimeline';
import { InterventionPlanner } from './components/InterventionPlanner';
import { useRippleStore } from './store/useRippleStore';
import { Clock3, Route } from 'lucide-react';
import { useEffect } from 'react';

function App() {
  const { cascadeResult, currentStep, setCurrentStep } = useRippleStore();
  useEffect(() => {
    if (!cascadeResult || currentStep >= cascadeResult.steps.length - 1) return;
    const timer = window.setTimeout(() => setCurrentStep(currentStep + 1), 700);
    return () => window.clearTimeout(timer);
  }, [cascadeResult, currentStep, setCurrentStep]);
  return <div className="min-h-screen bg-[#070d1a] text-slate-100 selection:bg-cyan-400/30">
    <Header />
    <main className="mx-auto max-w-[1800px] px-4 py-5 lg:px-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_365px]">
        <section className="min-w-0"><OverviewPanel /></section>
        <aside className="space-y-5"><FailureSimulator /><ImpactSummary /></aside>
      </div>
      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
        <div className="panel p-5">
          <div className="mb-5 flex items-center justify-between"><div><div className="eyebrow"><Clock3 className="h-3.5 w-3.5" /> Cascade chronology</div><h2 className="mt-1 text-base font-semibold text-white">Propagation timeline</h2></div>{cascadeResult && <span className="status-pill text-amber-300">T+{Math.max(0, currentStep)}</span>}</div>
          {cascadeResult ? <PropagationTimeline cascadeResult={cascadeResult} currentStep={currentStep} /> : <div className="flex min-h-44 flex-col items-center justify-center text-center text-sm text-slate-500"><Route className="mb-3 h-7 w-7 text-slate-600" />Run a failure simulation to trace its cascade through the network.</div>}
        </div>
        <InterventionPlanner />
      </section>
    </main>
  </div>;
}
export default App;
