import React from 'react';

const Marquee = ({ text, className = '', reverse = false, speed = 'normal' }) => {
  const speedClass = speed === 'fast' ? 'animate-marquee-fast' : 'animate-marquee';
  const direction = reverse ? 'reverse' : 'normal';
  const content = text || 'LPU MARKETPLACE';

  return (
    <div className={`marquee-window flex overflow-hidden whitespace-nowrap w-full select-none ${className}`} aria-label={content}>
      <div className={`marquee-track flex w-max shrink-0 ${speedClass}`} style={{ animationDirection: direction }} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <span key={index} className="px-5">{content}</span>)}
      </div>
    </div>
  );
};

export default Marquee;
