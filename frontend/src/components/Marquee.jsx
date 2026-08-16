import React from 'react';

const Marquee = ({ text, className = '', reverse = false, speed = 'normal' }) => {
  const speedClass = speed === 'fast' ? 'animate-marquee-fast' : 'animate-marquee';
  const direction = reverse ? 'reverse' : 'normal';
  const content = Array(4).fill(text).join(' - ');

  return (
    <div className={`flex overflow-hidden whitespace-nowrap w-full select-none ${className}`}>
      <div className={`flex shrink-0 ${speedClass}`} style={{ animationDirection: direction }}>
        <span className="px-4">{content}</span>
        <span className="px-4">{content}</span>
      </div>
    </div>
  );
};

export default Marquee;
