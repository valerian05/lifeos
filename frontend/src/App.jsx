import React, { useState, useEffect } from 'react';
import { 
  Activity, Wallet, Target, Zap, 
  BrainCircuit, ChevronRight, Loader2, Sparkles,
  ShieldCheck, ArrowUpRight
} from 'lucide-react';

const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(null);

  const API_BASE = "https://lifeos-production-4154.up.railway.app"; // Updated to your live Railway URL

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      // Fallback Demo Data
      setData({
        score: 78,
        health_index: 84,
        wealth_index: 92,
        focus_index: 41,
        insight: "Focus levels are critical. I am preparing a 'Cognitive Shield' to block distractions.",
        pending_actions: [
          { action_type: 'COGNITIVE_SHIELD', target: 'Communications', description: 'Silencing non-essential notifications', priority: 10 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleExecute = async (action) => {
    setExecuting(action.action_type);
    try {
      await fetch(`${API_BASE}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      });
      await fetchStatus();
    } catch (e) {
      console.error("Execution failed", e);
    } finally {
      setExecuting(null);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <header className="max-w-6xl mx-auto flex justify-between items-end mb-20">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-500">Neural Link Active</span>
          </div>
          <h1 className="text-5xl font-light italic tracking-tight">Life<span className="font-black text-indigo-500 uppercase not-italic">OS</span></h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase text-neutral-600 tracking-widest mb-1">Status</div>
          <div className="text-xs font-mono text-emerald-500">OPTIMAL_ALIGNMENT</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Global Alignment Score */}
          <div className="bg-neutral-900 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
              <BrainCircuit size={450} />
            </div>
            <div className="relative z-10">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Global Trajectory</span>
              <div className="text-[14rem] font-black leading-none tracking-tighter italic my-6 select-none">
                {data?.score}
              </div>
              <p className="text-neutral-400 max-w-lg text-xl leading-relaxed">
                {data?.insight}
              </p>
            </div>
          </div>

          {/* Action Matrix */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 px-4">Pending Interventions</h3>
            {data?.pending_actions.map((action, i) => (
              <div key={i} className="bg-indigo-600 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-500/20">
                <div className="flex items-center gap-6">
                  <div className="bg-white/20 p-4 rounded-2xl"><Zap size={32} fill="white"/></div>
                  <div>
                    <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">{action.action_type}</div>
                    <div className="text-xl font-bold">{action.description}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleExecute(action)}
                  disabled={!!executing}
                  className="w-full md:w-auto bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  {executing === action.action_type ? <Loader2 className="animate-spin" size={18}/> : 'Authorize'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Metrics */}
        <div className="lg:col-span-4 space-y-4">
          <MetricTile label="Biological" value={data?.health_index} color="text-emerald-400" icon={<Activity />} />
          <MetricTile label="Capital" value={data?.wealth_index} color="text-blue-400" icon={<Wallet />} />
          <MetricTile label="Cognition" value={data?.focus_index} color="text-amber-400" icon={<Target />} />
          
          <div className="p-10 bg-neutral-900 border border-white/5 rounded-[3rem] mt-10">
            <div className="flex items-center gap-2 mb-8 text-neutral-500">
              <Sparkles size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">Efficiency Matrix</span>
            </div>
            <div className="space-y-8">
              <StatBar label="Neural Compression" val={96} />
              <StatBar label="Decision Velocity" val={82} />
              <StatBar label="State Persistence" val={100} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const MetricTile = ({ label, value, color, icon }) => (
  <div className="bg-neutral-900 border border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between hover:border-white/10 transition-all group cursor-pointer">
    <div className="flex items-center gap-5">
      <div className={`p-4 bg-white/5 rounded-2xl ${color} group-hover:bg-white/10 transition-colors`}>{icon}</div>
      <div>
        <div className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">{label}</div>
        <div className="text-3xl font-black">{value}%</div>
      </div>
    </div>
    <ArrowUpRight className="text-neutral-700 group-hover:text-white transition-colors" size={20} />
  </div>
);

const StatBar = ({ label, val }) => (
  <div>
    <div className="flex justify-between text-[10px] font-bold uppercase text-neutral-500 mb-2">
      <span>{label}</span>
      <span className="font-mono">{val}%</span>
    </div>
    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full bg-indigo-500/50" style={{width: `${val}%`}}></div>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white">
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse rounded-full"></div>
      <BrainCircuit size={64} className="text-indigo-500 relative z-10 animate-spin" style={{animationDuration: '3s'}} />
    </div>
    <div className="text-[10px] font-black uppercase tracking-[1em] text-neutral-500 animate-pulse">Syncing LifeOS</div>
  </div>
);

export default App;
