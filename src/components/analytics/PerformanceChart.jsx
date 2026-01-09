import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function PerformanceChart({ data, title }) {
  return (
    <div className="funky-card p-6 border-4 border-[#2B59C3] bg-blue-50">
      <h3 className="header-font text-2xl text-[#2B59C3] mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis 
              dataKey="week" 
              tick={{ fontSize: 12, fill: '#5E3B85' }}
              tickLine={{ stroke: '#5E3B85' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#5E3B85' }}
              tickLine={{ stroke: '#5E3B85' }}
            />
            <Bar 
              dataKey="completed" 
              fill="#C3B1E1" 
              stroke="#5E3B85"
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}