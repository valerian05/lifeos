import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Wallet, 
  Target, 
  Zap, 
  BrainCircuit, 
  Loader2, 
  ArrowUpRight, 
  Sparkles,
  WifiOff,
  RefreshCw
} from 'lucide-react';

/**
 * LifeOS Dashboard
 * A unified interface for personal life management and autonomous execution.
 */
const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Connection to the LifeOS Core Backend
  // Note: Ensure this URL matches your Railway service exactly
  const API_BASE = "https://lifeos-production-4154.up.railway.app".replace(/\/$/, ""); 

  const fetchStatus = useCallback(async (isRetry = false) => {
    if (isRetry) setRetrying(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const json = await res.json();
      setData(json);
      setConnectionError(false);
    } catch (e) {
      console.error(`[LifeOS Connection Error]: ${e.message}`);
      setConnectionError(true);
      
      // Fallback data if backend is unreachable
      if (!data) {
        setData({
          score: 82,
          health_index: 88,
          wealth_index: 94,
          focus_index: 45,
          insight: "System is currently running in local fallback mode. Connection to LifeOS Core at Railway could not be established. Check CORS settings or server logs.",
          pending_actions: [
            { action_type: 'CALENDAR_SHIELD', target: 'Local_ID', description: 'Simulated: Postpone upcoming sync', priority: 10 }
          ]
        });
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [API_BASE, data]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(false), 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleExecute = async (action) => {
    setExecuting(action.action_type);
    try {
      const response = await fetch(`${API_BASE}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error("Execution failed at server");
      
      const result = await response.json();
      console.log("Action Execution Log:", result.execution_log || result.status);
      await fetchStatus();
    } catch (e) {
      console.error("[Execution failure]:", e.message);
    } finally {
      setExecuting(null);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Connection Warning Banner */}
      {connectionError && (
        <div className="fixed top-0 left-0 w-full bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 z-50 flex justify-between items-center backdrop-blur-md">
          <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest">
            <WifiOff size={14} />
            Connection Lost to Railway Backend — Simulation Mode Active
          </div>
          <button 
            onClick={() => fetchStatus(true)}
            className="flex items-center gap-1 text-[9px] font-black uppercase bg-amber-500 text-black px-3 py-1 rounded-full hover:bg-amber-400 transition-colors"
          >
            <RefreshCw size={10} className={retrying ? 'animate-spin' : ''} />
            {retrying ? 'Retrying...' : 'Reconnect'}
          </button>
        </div>
      )}

      <header className={`max-w-7xl mx-auto flex justify-between items-end mb-16 px-2 transition-all ${connectionError ? 'mt-12' : 'mt-4'}`}>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${connectionError ? 'bg-amber-500' : 'bg-indigo-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-500">
              {connectionError ? 'Neural Link Fragmented' : 'Neural Link Active'}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light italic tracking-tight italic">Life<span className="font-black text-indigo-500 uppercase not-italic">OS</span></h1>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-[10px] font-black uppercase text-neutral-600 tracking-widest mb-1">System State</div>
          <div className={`text-xs font-mono ${connectionError ? 'text-amber-500' : 'text-emerald-500'}`}>
            {connectionError ? 'LOCAL_FALLBACK_ACTIVE' : 'OPTIMAL_ALIGNMENT'}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Alignment Score Card */}
          <div className={`border rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 relative overflow-hidden group transition-colors duration-500 ${connectionError ? 'bg-neutral-900/50 border-amber-500/10' : 'bg-neutral-900 border-white/5'}`}>
            <div className="absolute -right-20 -top-20 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 pointer-events-none text-indigo-500">
              <BrainCircuit size={450} />
            </div>
            <div className="relative z-10">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Global Alignment Trajectory</span>
              <div className="text-8xl md:text-[14rem] font-black leading-none tracking-tighter italic my-4 md:my-6 select-none transition-transform group-hover:scale-[1.02] duration-700">
                {data?.score}
              </div>
              <p className={`max-w-lg text-lg md:text-xl leading-relaxed ${connectionError ? 'text-amber-200/50' : 'text-neutral-400'}`}>
                {data?.insight}
              </p>
            </div>
          </div>

          {/* Action Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Pending Interventions</h3>
              <Sparkles className={connectionError ? 'text-amber-500' : 'text-indigo-500'} size={14} />
            </div>
            
            <div className="grid gap-4">
              {data?.pending_actions?.map((action, i) => (
                <div key={i} className={`${connectionError ? 'bg-neutral-800' : 'bg-indigo-600'} rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl transition-all border ${connectionError ? 'border-amber-500/20' : 'border-indigo-400/20'}`}>
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className={`${connectionError ? 'bg-amber-500/20' : 'bg-white/20'} p-4 rounded-2xl shrink-0`}>
                      <Zap size={28} fill={connectionError ? "rgb(245, 158, 11)" : "white"} className={connectionError ? 'text-amber-500' : 'text-white'}/>
                    </div>
                    <div>
                      <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${connectionError ? 'text-amber-500/70' : 'text-indigo-200'}`}>
                        {action.action_type}
                      </div>
                      <div className="text-lg md:text-xl font-bold">{action.description}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleExecute(action)}
                    disabled={!!executing || connectionError}
                    className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl ${connectionError ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' : 'bg-white text-indigo-600 hover:bg-neutral-100 active:scale-95'}`}
                  >
                    {executing === action.action_type ? <Loader2 className="animate-spin" size={18}/> : connectionError ? 'Offline' : 'Authorize'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Metrics */}
        <div className="lg:col-span-4 space-y-4">
          <MetricTile label="Biological" value={data?.health_index} color="text-emerald-400" icon={<Activity />} />
          <MetricTile label="Capital" value={data?.wealth_index} color="text-blue-400" icon={<Wallet />} />
          <MetricTile label="Cognition" value={data?.focus_index} color="text-amber-400" icon={<Target />} />
          
          <div className="p-8 md:p-10 bg-neutral-900 border border-white/5 rounded-[2.5rem] md:rounded-[3rem] mt-6">
            <div className="flex items-center gap-2 mb-8 text-neutral-500">
              <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} /> 
              <span className="text-[10px] font-black uppercase tracking-widest">Sync Persistence</span>
            </div>
            <div className="space-y-8">
              <StatBar label="Neural Compression" val={96} />
              <StatBar label="Decision Velocity" val={82} />
              <StatBar label="OS Uptime" val={100} />
            </div>
            <div className="mt-12 pt-8 border-t border-white/5">
              <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-4 italic">Memory Buffer</div>
              <div className="flex flex-wrap gap-2">
                {['Stripe Active', 'Calendar Sync', 'Railway Core'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-[8px] text-neutral-500 font-bold uppercase tracking-tight border border-white/5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const MetricTile = ({ label, value, color, icon }) => (
  <div className="bg-neutral-900 border border-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-between hover:border-white/10 transition-all group cursor-pointer active:scale-98">
    <div className="flex items-center gap-5">
      <div className={`p-4 bg-white/5 rounded-2xl ${color} group-hover:bg-white/10 transition-colors`}>{icon}</div>
      <div>
        <div className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">{label}</div>
        <div className="text-2xl md:text-3xl font-black">{value || 0}%</div>
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
    <div className="relative mb-8 text-indigo-500">
      <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse rounded-full"></div>
      <BrainCircuit size={64} className="relative z-10 animate-spin" style={{animationDuration: '4s'}} />
    </div>
    <div className="text-[10px] font-black uppercase tracking-[1em] text-neutral-500 animate-pulse ml-4">Syncing LifeOS</div>
  </div>
);

export default App;
