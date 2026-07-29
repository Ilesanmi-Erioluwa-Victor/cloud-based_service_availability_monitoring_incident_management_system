import React from 'react';

const statusColors = {
  up: 'bg-green-500',
  degraded: 'bg-yellow-500',
  down: 'bg-red-500',
  flapping: 'bg-purple-500',
  maintenance: 'bg-blue-500',
  unknown: 'bg-gray-400',
};

const statusLabels = {
  up: 'Up',
  degraded: 'Degraded',
  down: 'Down',
  flapping: 'Flapping',
  maintenance: 'Maintenance',
  unknown: 'Unknown',
};

export default function ServiceCard({ service, onClick }) {
  return (
    <div
      onClick={() => onClick?.(service._id)}
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: statusColors[service.currentStatus]?.replace('bg-', '').replace('-500', '') ? undefined : '#9CA3AF',
        borderLeftWidth: '4px'
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{service.name}</h3>
          <p className="text-sm text-gray-500 truncate max-w-xs">{service.targetUrlOrHost}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${statusColors[service.currentStatus] || 'bg-gray-400'}`}>
          {statusLabels[service.currentStatus] || 'Unknown'}
        </span>
      </div>
      <div className="mt-2 flex items-center text-xs text-gray-400">
        <span>Type: {service.checkType}</span>
        {service.lastCheckedAt && (
          <span className="ml-3">Last checked: {new Date(service.lastCheckedAt).toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
}