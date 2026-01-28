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
 * LifeOS Dashboard - Production Version
 * REQUIREMENTS:
 * npm install lucide-react
 * NEXT_PUBLIC_API_URL set in Vercel
 */
export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const getApiBase = () => {
    const defaultUrl = 'https://lifeos-production-4154.up.railway.app';
    try {
      if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
      }
    } catch {}
    return defaultUrl;
  };

  const API_BASE = getApiBase();

  const fetchStatus = useCallback(async (isRetry = false) => {
    if (isRetry) setRetrying(true);
    try {
      const res = await fetch(`${API_BASE}/api/status`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      const json = await res.json();
      setData(json);
      setConnectionError(false);
    } catch (e) {
      console.error('[LifeOS Sync Error]', e);
      setConnectionError(true);
      setData(prev => prev || {
        score: 85,
        health_index: 90,
        wealth_index: 95,
        focus_index: 40,
        insight:
          'INTELLIGENCE_LINK_OFFLINE: Re-establishing neural link. Verify Railway service and CORS configuration.',
        pending_actions: [
          {
            action_type: 'COGNITIVE_SHIELD',
            target: 'System',
            description: 'Protecting neural state from sync failure',
            priority: 10
          }
        ]
      });
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    setMounted(true);
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleExecute = async (action) => {
    if (connectionError) return;
    setExecuting(action.action_type);
    try {
      const res = await fetch(`${API_BASE}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      if (!res.ok) throw new Error('Execution failed');
      await fetchStatus();
    } catch (e) {
      console.error('[Action Execution Error]', e);
    } finally {
      setExecuting(null);
    }
  };

  if (!mounted) return null;
  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 font-sans overflow-x-hidden">
      {connectionError && (
        <div className="fixed top-0 left-0 w-full bg-amber-500 text-black py-2 px-6 z-50 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <WifiOff size={12} />
            Railway Backend Connectivity Lost
          </div>
          <button
            onClick={() => fetchStatus(true)}
            disabled={retrying}
            className="bg-black text-white px-3 py-1 rounded flex items-center gap-2"
          >
            {retrying ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
            {retrying ? 'Syncing...' : 'Reconnect'}
          </button>
        </div>
      )}

      <header className="max-w-7xl mx-auto mb-12">
        <h1 className="text-5xl font-light italic">
          Life<span className="font-black text-indigo-500 not-italic">OS</span>
        </h1>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-neutral-900 rounded-3xl p-12">
            <div className="text-8xl font-black italic">{data?.score}</div>
            <p className="text-neutral-400 mt-4">{data?.insight}</p>
          </div>

          {data?.pending_actions?.map((action, i) => (
            <div key={i} className="bg-indigo-600 rounded-3xl p-8 flex justify-between items-center">
              <div>
                <div className="text-xs font-black uppercase">{action.action_type}</div>
                <div className="text-xl font-bold">{action.description}</div>
              </div>
              <button
                onClick={() => handleExecute(action)}
                disabled={executing || connectionError}
                className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-black uppercase text-xs"
              >
                {executing === action.action_type ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  'Authorize'
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Metric label="Biological" value={data?.health_index} Icon={Activity} />
          <Metric label="Capital" value={data?.wealth_index} Icon={Wallet} />
          <Metric label="Cognition" value={data?.focus_index} Icon={Target} />
        </div>
      </main>
    </div>
  );
}

const Metric = ({ label, value, Icon }) => (
  <div className="bg-neutral-900 rounded-3xl p-6 flex justify-between items-center">
    <div className="flex items-center gap-4">
      <Icon size={24} />
      <div>
        <div className="text-xs uppercase text-neutral-500">{label}</div>
        <div className="text-3xl font-black">{value || 0}%</div>
      </div>
    </div>
    <ArrowUpRight />
  </div>
);

const LoadingScreen = () => (
  <div className="h-screen w-screen bg-black flex items-center justify-center">
    <BrainCircuit size={64} className="animate-spin text-indigo-500" />
  </div>
);
