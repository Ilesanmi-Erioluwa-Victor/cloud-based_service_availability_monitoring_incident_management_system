import React from 'react';

const severityColors = {
  critical: 'bg-red-100 text-red-800',
  major: 'bg-orange-100 text-orange-800',
  minor: 'bg-yellow-100 text-yellow-800',
};

const statusColors = {
  open: 'bg-red-100 text-red-800',
  acknowledged: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
};

export default function IncidentCard({ incident }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4"
      style={{
        borderLeftColor: incident.status === 'open' ? '#EF4444' : incident.status === 'acknowledged' ? '#3B82F6' : '#10B981',
        borderLeftWidth: '4px'
      }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            {incident.serviceId?.name || 'Unknown Service'}
          </h3>
          <p className="text-xs text-gray-500">ID: {incident._id}</p>
        </div>
        <div className="flex space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[incident.severity] || 'bg-gray-100 text-gray-800'}`}>
            {incident.severity}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[incident.status] || 'bg-gray-100 text-gray-800'}`}>
            {incident.status}
          </span>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        <p>Detected: {new Date(incident.detectedAt).toLocaleString()}</p>
        {incident.resolvedAt && <p>Resolved: {new Date(incident.resolvedAt).toLocaleString()}</p>}
        {incident.downtimeDurationSeconds != null && (
          <p>Downtime: {Math.floor(incident.downtimeDurationSeconds / 60)}m {incident.downtimeDurationSeconds % 60}s</p>
        )}
      </div>
      {incident.timeline && incident.timeline.length > 0 && (
        <div className="mt-2 border-t pt-2">
          <p className="text-xs font-medium text-gray-500 mb-1">Timeline:</p>
          {incident.timeline.slice(-3).map((entry, i) => (
            <p key={i} className="text-xs text-gray-400">
              {new Date(entry.timestamp).toLocaleTimeString()} - {entry.event}{entry.note ? `: ${entry.note}` : ''}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}