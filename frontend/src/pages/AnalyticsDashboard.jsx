import React, { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, Eye, MapPin, RefreshCw, TrendingUp } from 'lucide-react';
import { DEMO_ANALYTICS } from '../data/demoContent';
import { requestJson } from '../lib/api';
import { PageIntro, StatCard, StatusPill } from '../components/Ui';

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState('');

  const fetchDemand = async () => {
    try {
      const isDemoMode = new URLSearchParams(window.location.search).get('demo') === '1';
      if (isDemoMode && !localStorage.getItem('trms_token')) {
        setData(DEMO_ANALYTICS);
        setIsLive(false);
        setError('');
        setIsLoading(false);
        return;
      }
      const token = localStorage.getItem('trms_token');
      const { response, data: nextData } = await requestJson('/api/analytics/demand', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(nextData.msg || 'Analytics unavailable');
      setData(nextData);
      setIsLive(true);
      setError('');
    } catch (fetchError) {
      setData(null);
      setIsLive(false);
      setError(fetchError.message || 'Analytics unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDemand();
    const interval = setInterval(fetchDemand, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div className="page-shell flex min-h-[60vh] items-center justify-center"><p className="text-sm text-theme/45">Preparing your insights...</p></div>;
  if (error || !data) return <section className="page-shell"><PageIntro eyebrow="Insights" title="Analytics unavailable." description={error || 'No analytics data is available yet.'} action={<button onClick={fetchDemand} className="button-secondary"><RefreshCw size={15} /> Retry</button>} /><div className="glass-panel rounded-3xl p-10 text-center text-sm text-theme/50">Once buyers search, view listings, or place orders, the real activity will appear here.</div></section>;

  const categories = data?.trendingCategories || [];
  const locations = data?.surgeLocations || [];
  const maxVolume = Math.max(...categories.map((item) => item.volume || 0), 1);

  const user = JSON.parse(localStorage.getItem('trms_user') || '{}');
  const isAdmin = user.role === 'admin';
  return <section className="page-shell">
    <PageIntro eyebrow={isAdmin ? 'Marketplace intelligence' : 'Seller workspace'} title={isAdmin ? 'See what is really moving.' : 'Your insights'} description={isAdmin ? 'Monitor demand, supply, and activity across the whole campus marketplace.' : 'Understand what people are searching for and where demand is moving.'} action={<button onClick={fetchDemand} className="button-secondary"><RefreshCw size={15} />Refresh</button>} />
    <div className="mb-8 flex items-center gap-3"><StatusPill tone={isLive ? 'good' : 'warn'}>{isLive ? 'Live data' : 'Preview data'}</StatusPill><span className="text-xs text-theme/45">Updated just now · auto refreshes every 30 seconds</span></div>
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Active connections" value={data?.activeConnections ?? 0} note="Live socket connections" icon={<Activity size={18} />} /><StatCard label="Search events" value={Number(data?.totalSearches || 0).toLocaleString()} note="Persisted telemetry" icon={<TrendingUp size={18} />} /><StatCard label="Listing views" value={Number(data?.totalViews || 0).toLocaleString()} note="Persisted product views" icon={<Eye size={18} />} /><StatCard label={isAdmin ? 'Active supply' : 'Your listings'} value={isAdmin ? data?.totalActiveListings ?? 0 : data?.sellerListings ?? 0} note={isAdmin ? 'Verified listings live now' : `${data?.sellerViews ?? 0} views · ${data?.sellerOrders ?? 0} sales`} icon={<MapPin size={18} />} /></div>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="glass-panel rounded-3xl p-6 sm:p-8"><div className="mb-8 flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-theme/45">What is moving</p><h2 className="mt-2 text-2xl font-semibold">Category demand</h2></div><ArrowUpRight className="text-accent" /></div><div className="space-y-6">{categories.map((item) => <div key={item.name}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">{item.name}</span><span className="text-theme/45">{Number(item.volume || 0).toLocaleString()} searches</span></div><div className="h-3 overflow-hidden rounded-full bg-theme/8"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.max(5, (item.volume / maxVolume) * 100)}%` }} /></div></div>)}</div></section>
      <section className="glass-panel rounded-3xl p-6 sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-theme/45">Where to list</p><h2 className="mt-2 text-2xl font-semibold">Campus hotspots</h2><div className="mt-8 space-y-5">{locations.map((item) => <div key={item.name} className="flex items-center gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent"><MapPin size={17} /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-4 text-sm"><span className="truncate font-medium">{item.name}</span><span className="text-theme/45">{item.demand}%</span></div><div className="mt-2 h-2 rounded-full bg-theme/8"><div className="h-full rounded-full bg-theme/55" style={{ width: `${item.demand}%` }} /></div></div></div>)}</div></section>
    </div>
  </section>;
};

export default AnalyticsDashboard;
