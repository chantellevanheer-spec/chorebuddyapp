import React from 'react';

export default function AnalyticsCard({ title, value, icon: Icon, color = "text-[#2B59C3]" }) {
  return (
    <div className="funky-card p-4 text-center border-3 border-[#5E3B85]">
      <div className="flex items-center justify-center mb-2">
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className={`header-font text-2xl ${color}`}>{value}</div>
      <div className="body-font-light text-sm text-gray-600">{title}</div>
    </div>
  );
}