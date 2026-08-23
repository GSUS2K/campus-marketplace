import React, { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, Eye, MapPin, RefreshCw, TrendingUp } from 'lucide-react';
import { DEMO_ANALYTICS } from '../data/demoContent';
import { requestJson } from '../lib/api';
import { PageIntro, StatCard, StatusPill } from '../components/Ui';

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const fetchDemand = async () => {
    try {
      const token = localStorage.getItem('trms_token');
      const { response, data: nextData } = await requestJson('/api/analytics/demand', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Analytics unavailable');
      setData(nextData);
      setIsLive(true);
    } catch (_error) {
      setData(DEMO_ANALYTICS);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDemand();
    const interval = setInterval(fetchDemand, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-5"><p className="text-sm text-theme/45">Preparing your insights...</p></div>;

  const categories = data?.trendingCategories || [];
  const locations = data?.surgeLocations || [];
  const maxVolume = Math.max(...categories.map((item) => item.volume || 0), 1);
  const totalVolume = categories.reduce((sum, item) => sum + Number(item.volume || 0), 0);

  return <div className="mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-8 sm:px-8">
    <PageIntro eyebrow="Seller workspace" title="Your insights" description="Understand what people are searching for and where demand is moving." action={<button onClick={fetchDemand} className="flex items-center gap-2 rounded-xl border border-theme/15 px-4 py-3 text-sm font-medium hover:bg-theme/8"><RefreshCw size={15} />Refresh</button>} />
    <div className="mb-8 flex items-center gap-3"><StatusPill tone={isLive ? 'good' : 'warn'}>{isLive ? 'Live data' : 'Preview data'}</StatusPill><span className="text-xs text-theme/45">Updated just now · auto refreshes every 30 seconds</span></div>
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Active connections" value={data?.activeConnections ?? 0} note="People browsing now" icon={<Activity size={18} />} /><StatCard label="Demand volume" value={totalVolume.toLocaleString()} note="Search activity across campus" icon={<TrendingUp size={18} />} /><StatCard label="Top location" value={locations[0]?.name || 'Campus'} note={locations[0] ? `${locations[0].demand}% demand signal` : 'No location signal'} icon={<MapPin size={18} />} /><StatCard label="Conversion focus" value="Trust" note="Verified listings move faster" icon={<Eye size={18} />} /></div>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="glass-panel rounded-3xl p-6 sm:p-8"><div className="mb-8 flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-theme/45">What is moving</p><h2 className="mt-2 text-2xl font-semibold">Category demand</h2></div><ArrowUpRight className="text-accent" /></div><div className="space-y-6">{categories.map((item) => <div key={item.name}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">{item.name}</span><span className="text-theme/45">{Number(item.volume || 0).toLocaleString()} searches</span></div><div className="h-3 overflow-hidden rounded-full bg-theme/8"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.max(5, (item.volume / maxVolume) * 100)}%` }} /></div></div>)}</div></section>
      <section className="glass-panel rounded-3xl p-6 sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-theme/45">Where to list</p><h2 className="mt-2 text-2xl font-semibold">Campus hotspots</h2><div className="mt-8 space-y-5">{locations.map((item) => <div key={item.name} className="flex items-center gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent"><MapPin size={17} /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-4 text-sm"><span className="truncate font-medium">{item.name}</span><span className="text-theme/45">{item.demand}%</span></div><div className="mt-2 h-2 rounded-full bg-theme/8"><div className="h-full rounded-full bg-theme/55" style={{ width: `${item.demand}%` }} /></div></div></div>)}</div></section>
    </div>
  </div>;
};

export default AnalyticsDashboard;
