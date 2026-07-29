import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function UptimeChart({ data, dataKey = 'responseTimeMs', xKey = 'checkedAt', color = '#3B82F6' }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-400 text-sm p-4 text-center">No data available</div>;
  }

  const chartData = data.map(d => ({
    ...d,
    [xKey]: new Date(d[xKey]).toLocaleTimeString(),
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}