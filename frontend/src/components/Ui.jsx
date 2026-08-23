import React, { useState } from 'react';

export const ProductImage = ({ src, alt, title = 'Listing', className = '', loading = 'lazy' }) => {
  const [hasError, setHasError] = useState(false);
  const initials = title.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-theme/10 via-accent/10 to-theme/5 ${className}`}>
      {!hasError && src ? (
        <img src={src} alt={alt || title} loading={loading} className="absolute inset-0 h-full w-full object-cover" onError={() => setHasError(true)} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-theme/35">
          <span className="text-4xl font-serif font-semibold tracking-tight">{initials || 'LPU'}</span>
          <span className="text-[9px] tracking-[0.28em] uppercase">Image unavailable</span>
        </div>
      )}
    </div>
  );
};

export const StatusPill = ({ children, tone = 'neutral' }) => {
  const tones = {
    good: 'bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/25',
    warn: 'bg-amber-400/15 text-amber-700 dark:text-amber-300 border-amber-400/25',
    danger: 'bg-rose-400/15 text-rose-700 dark:text-rose-300 border-rose-400/25',
    neutral: 'bg-theme/8 text-theme/65 border-theme/15'
  };

  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${tones[tone] || tones.neutral}`}>{children}</span>;
};

export const StatCard = ({ label, value, note, icon }) => (
  <div className="glass-panel rounded-2xl p-5">
    <div className="flex items-start justify-between gap-4"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-theme/45">{label}</p>{icon && <span className="text-lg text-theme/45">{icon}</span>}</div>
    <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
    {note && <p className="mt-2 text-xs text-theme/50">{note}</p>}
  </div>
);

export const PageIntro = ({ eyebrow, title, description, action }) => (
  <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
    <div><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.26em] text-accent">{eyebrow}</p><h1 className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">{title}</h1>{description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-theme/55">{description}</p>}</div>
    {action}
  </header>
);
