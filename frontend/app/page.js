'use client';

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
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

/**
 * LifeOS Dashboard - App Router Version (app/page.js)
 * Hardened for Vercel Build Stability.
 * * IMPORTANT: To fix the "Build Failed" error:
 * 1. You MUST delete the 'frontend/pages' folder completely. 
 * Next.js will fail if both 'app/page.js' and 'pages/index.js' exist.
 * 2. Ensure 'lucide-react' is in your frontend/package.json.
 */
export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Build-safe environment variable retrieval
  const getApiBase = useCallback(() => {
    const defaultUrl = "https://lifeos-production-4154.up.railway.app";
    
    try {
      // Use typeof check to prevent ReferenceError during strict build minification
      if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
      }
    } catch (e) {
      // Fallback to default if process is inaccessible
    }

    return defaultUrl;
  }, []);

  const API_BASE = getApiBase();

  const fetchStatus = useCallback(async (isRetry = false) => {
    if (isRetry) setRetrying(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/status`, {
        cache: 'no-store', // Ensures real-time data in Next.js App Router
        headers: { 'Accept': 'application/json' },
      });
      
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      
      const json = await res.json();
      setData(json);
      setConnectionError(false);
    } catch (e) {
      console.error("[LifeOS Sync Error]:", e.message);
      setConnectionError(true);
      
      // Fallback data prevents the UI from crashing during build or downtime
      setData(prev => prev || {
        score: 85,
        health_index: 90,
        wealth_index: 95,
        focus_index: 40,
        insight: "INTELLIGENCE_LINK_OFFLINE: Re-establishing neural link. Verify Railway service status.",
        pending_actions: [
          { action_type: 'COGNITIVE_SHIELD', target: 'System', description: 'Protecting neural state from sync failure', priority: 10 }
        ]
      });
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [API_BASE]);

  // Standard Hydration Shield
  useEffect(() => {
    setMounted(true);
    fetchStatus();
    const interval = setInterval(() => fetchStatus(false), 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleExecute = async (action) => {
    if (connectionError) return;
    setExecuting(action.action_type);
    try {
      const response = await fetch(`${API_BASE}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      
      if (!response.ok) throw new Error("Execution failed");
      await fetchStatus();
    } catch (e) {
      console.error("[Action Execution Error]:", e.message);
    } finally {
      setExecuting(null);
    }
  };

  if (!mounted) return null;
  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Connectivity Banner */}
      {connectionError && (
        <div className="fixed top-0 left-0 w-full bg-amber-500 text-black py-2 px-6 z-50 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <WifiOff size={12} />
            Railway Backend Connectivity Lost — Local Simulation Active
          </div>
          <button 
            onClick={() => fetchStatus(true)}
            disabled={retrying}
            className="bg-black text-white px-3 py-1 rounded hover:bg-neutral-800 transition-all flex items-center gap-2"
          >
            {retrying ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
            {retrying ? 'Syncing...' : 'Reconnect'}
          </button>
        </div>
      )}

      <header className={`max-w-7xl mx-auto flex justify-between items-end mb-16 px-2 transition-all duration-700 ${connectionError ? 'mt-12' : 'mt-4'}`}>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${connectionError ? 'bg-amber-500' : 'bg-indigo-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-500 italic">Neural Link v1.0</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light italic tracking-tight italic">Life<span className="font-black text-indigo-500 uppercase not-italic">OS</span></h1>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-[10px] font-black uppercase text-neutral-600 tracking-widest mb-1">State</div>
          <div className={`text-xs font-mono ${connectionError ? 'text-amber-500' : 'text-emerald-500'}`}>
            {connectionError ? 'DATA_ISOLATION' : 'OPTIMAL_FLOW'}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Intelligence Score Card */}
          <div className="bg-neutral-900 border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-14 relative overflow-hidden group hover:border-white/10 transition-all duration-500">
            <div className="absolute -right-20 -top-20 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity duration-1000 pointer-events-none">
              <BrainCircuit size={450} className="text-indigo-500" />
            </div>
            <div className="relative z-10">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Global Alignment Trajectory</span>
              <div className="text-8xl md:text-[14rem] font-black leading-none tracking-tighter italic my-8 transition-transform group-hover:scale-[1.01] duration-700 select-none">
                {data?.score}
              </div>
              <p className={`max-w-lg text-lg md:text-xl leading-relaxed transition-colors ${connectionError ? 'text-amber-200/40' : 'text-neutral-400'}`}>
                {data?.insight}
              </p>
            </div>
          </div>

          {/* Intervention Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Pending Interventions</h3>
              <Sparkles className="text-indigo-500" size={14} />
            </div>
            
            <div className="grid gap-4">
              {data?.pending_actions?.map((action, i) => (
                <div key={i} className="bg-indigo-600 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-500/10 border border-white/10 hover:shadow-indigo-500/25 hover:scale-[1.01] transition-all duration-300">
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="bg-white/20 p-4 rounded-2xl shrink-0">
                      <Zap size={28} fill="white" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">{action.action_type}</div>
                      <div className="text-lg md:text-xl font-bold">{action.description}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleExecute(action)}
                    disabled={!!executing || connectionError}
                    className="w-full md:w-auto bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-neutral-100 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl"
                  >
                    {executing === action.action_type ? <Loader2 className="animate-spin" size={18}/> : 'Authorize Execution'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Metrics */}
        <div className="lg:col-span-4 space-y-4">
          <MetricTile label="Biological" value={data?.health_index} color="text-emerald-400" Icon={Activity} />
          <MetricTile label="Capital" value={data?.wealth_index} color="text-blue-400" Icon={Wallet} />
          <MetricTile label="Cognition" value={data?.focus_index} color="text-amber-400" Icon={Target} />
          
          <div className="p-10 bg-neutral-900 border border-white/5 rounded-[2.5rem] md:rounded-[3rem] mt-6">
            <div className="flex items-center gap-2 mb-8 text-neutral-500">
              <ShieldCheck size={14}/> <span className="text-[10px] font-black uppercase tracking-widest">System Matrix</span>
            </div>
            <div className="space-y-8">
              <StatBar label="Neural Compression" val={96} />
              <StatBar label="Decision Velocity" val={82} />
              <StatBar label="OS Persistence" val={100} />
            </div>
            <div className="mt-12 pt-8 border-t border-white/5">
              <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-4 italic tracking-tighter">Connected Daemons</div>
              <div className="flex flex-wrap gap-2">
                {['Calendar.v3', 'Stripe.v3', 'Gemini.Flash'].map(tag => (
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
}

const MetricTile = ({ label, value, color, Icon }) => (
  <div className="bg-neutral-900 border border-white/5 p-8 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-between hover:border-white/10 transition-all group cursor-pointer active:scale-[0.98]">
    <div className="flex items-center gap-5">
      <div className={`p-4 bg-white/5 rounded-2xl ${color} group-hover:bg-white/10 transition-colors`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">{label}</div>
        <div className="text-3xl font-black tracking-tighter">{value || 0}%</div>
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
  <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
    <div className="relative mb-8 text-indigo-500">
      <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse rounded-full"></div>
      <BrainCircuit size={64} className="relative z-10 animate-spin" style={{animationDuration: '3.5s'}} />
    </div>
    <div className="text-[10px] font-black uppercase tracking-[1em] text-neutral-500 animate-pulse ml-4">Syncing LifeOS Framework</div>
  </div>
);
