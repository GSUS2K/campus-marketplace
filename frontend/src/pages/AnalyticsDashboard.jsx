import React, { useEffect, useState } from 'react';
import { DEMO_ANALYTICS } from '../data/demoContent';

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDemand = async () => {
    try {
      const token = localStorage.getItem('trms_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/analytics/demand`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setData(DEMO_ANALYTICS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDemand();
    const interval = setInterval(fetchDemand, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full bg-bg min-h-screen pt-32 flex justify-center">
        <p className="text-[10px] tracking-[0.4em] uppercase text-theme/30 animate-pulse">Initializing Data Stream...</p>
      </div>
    );
  }

  const maxVolume = Math.max(...(data?.trendingCategories?.map(c => c.volume) || [1]));

  return (
    <div className="w-full bg-transparent text-theme min-h-screen pt-32 pb-32 px-8 sm:px-14 animate-fade-in transition-colors duration-300 relative z-10">
      <div className="max-w-[1200px] mx-auto bg-bg/95 backdrop-blur-xl border border-theme/10 rounded-[3rem] p-10 lg:p-16 shadow-2xl">

        <header className="mb-20 text-center">
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-shu_light dark:bg-shu_dark animate-pulse inline-block" />
            <p className="text-[9px] tracking-[0.5em] uppercase text-shu_light dark:text-shu_dark">Live Kafka Stream</p>
          </div>
          <h1 className="text-6xl md:text-8xl font-serif font-light">
            Market <em className="not-italic italic opacity-50">Intelligence</em>.
          </h1>
          <p className="mt-8 text-[9px] tracking-[0.4em] uppercase text-theme/40">
            Active Network Nodes: <strong className="text-theme font-normal">{data?.activeConnections}</strong>
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">

          {/* Geographic Surge */}
          <div className="border border-theme/40 p-8">
            <h3 className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-10 border-b border-theme/40 pb-4">
              Geographic Demand Surge
            </h3>
            <div className="space-y-8">
              {data?.surgeLocations.map((loc, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2 text-xs tracking-widest uppercase">
                    <span>{loc.name}</span>
                    <span className="text-theme/40">{loc.demand}%</span>
                  </div>
                  <div className="h-[2px] w-full bg-theme/20 overflow-visible relative mt-1">
                    <div
                      className="absolute top-0 left-0 h-[4px] bg-theme transition-all duration-1000 -translate-y-[1px]"
                      style={{ width: `${loc.demand}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Class Velocity */}
          <div className="border border-theme/40 p-8">
            <h3 className="text-[9px] tracking-[0.4em] uppercase text-theme/30 mb-10 border-b border-theme/40 pb-4">
              Asset Class Velocity
            </h3>
            <div className="space-y-8">
              {data?.trendingCategories.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2 text-xs tracking-widest uppercase">
                    <span>{cat.name}</span>
                    <span className="text-theme/40">{cat.volume.toLocaleString()} queries</span>
                  </div>
                  <div className="h-[2px] w-full bg-theme/20 overflow-visible relative mt-1">
                    <div
                      className="absolute top-0 left-0 h-[4px] bg-theme transition-all duration-1000 -translate-y-[1px]"
                      style={{ width: `${(cat.volume / maxVolume) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Refresh indicator */}
        <p className="text-center text-[8px] tracking-[0.4em] uppercase text-theme/20">
          Auto-refreshes every 5 seconds
        </p>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
