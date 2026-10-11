import React from 'react';
import GlassCard from './GlassCard';

export default function StatCard({ icon: Icon, value, label, subtext, gradient = 'from-purple-600 to-indigo-700' }) {
  return (
    <GlassCard hover className="flex items-center gap-4 border-purple-200">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center shadow-lg shrink-0`}>
        {Icon && <Icon className="w-7 h-7 text-white" />}
      </div>
      <div>
        <div className="text-2xl md:text-3xl font-black text-[#24104F] tracking-tight">{value}</div>
        <div className="text-sm font-black text-[#3B2568]">{label}</div>
        {subtext && <div className="text-xs text-[#4B5563] font-medium mt-0.5">{subtext}</div>}
      </div>
    </GlassCard>
  );
}
