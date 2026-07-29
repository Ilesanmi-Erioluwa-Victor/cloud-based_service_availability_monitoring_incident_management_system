import { Server } from 'socket.io';

let ioInstance = null;

export function setupSocketHandlers(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('subscribe:service', (serviceId) => {
      socket.join(`service:${serviceId}`);
    });

    socket.on('unsubscribe:service', (serviceId) => {
      socket.leave(`service:${serviceId}`);
    });

    socket.on('subscribe:incidents', () => {
      socket.join('incidents');
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

export function getIO() {
  return ioInstance;
}

export function emitCheckResult(serviceId, result) {
  if (ioInstance) {
    ioInstance.to(`service:${serviceId}`).emit('check:result', { serviceId, result });
  }
}

export function emitServiceStatusChanged(serviceId, newStatus) {
  if (ioInstance) {
    ioInstance.emit('service:status-changed', { serviceId, newStatus });
  }
}

export function emitIncidentOpened(incident) {
  if (ioInstance) {
    ioInstance.to('incidents').emit('incident:opened', incident);
    ioInstance.emit('incident:opened', incident);
  }
}

export function emitIncidentAcknowledged(incident) {
  if (ioInstance) {
    ioInstance.to('incidents').emit('incident:acknowledged', incident);
    ioInstance.emit('incident:acknowledged', incident);
  }
}

export function emitIncidentResolved(incident) {
  if (ioInstance) {
    ioInstance.to('incidents').emit('incident:resolved', incident);
    ioInstance.emit('incident:resolved', incident);
  }
}