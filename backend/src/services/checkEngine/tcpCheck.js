import net from 'node:net';

export function tcpCheck(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      const responseTimeMs = Date.now() - start;
      socket.destroy();
      resolve({
        success: true,
        statusCode: null,
        responseTimeMs,
        errorType: null,
        errorMessage: null,
      });
    });

    socket.on('error', (err) => {
      const responseTimeMs = Date.now() - start;
      socket.destroy();

      let errorType = null;
      if (err.code === 'ECONNREFUSED') errorType = 'connection_refused';
      else if (err.code === 'ENOTFOUND') errorType = 'connection_refused';

      resolve({
        success: false,
        statusCode: null,
        responseTimeMs,
        errorType,
        errorMessage: `TCP connect failed: ${err.message}`,
      });
    });

    socket.on('timeout', () => {
      const responseTimeMs = Date.now() - start;
      socket.destroy();
      resolve({
        success: false,
        statusCode: null,
        responseTimeMs,
        errorType: 'timeout',
        errorMessage: `TCP connect timed out after ${timeoutMs}ms`,
      });
    });

    socket.connect(port, host);
  });
}