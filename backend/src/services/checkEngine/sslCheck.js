import tls from 'node:tls';

export function sslCheck(host, port = 443, expiryWarningDays = 14) {
  return new Promise((resolve) => {
    const start = Date.now();

    try {
      const socket = tls.connect({
        host,
        port,
        servername: host,
        rejectUnauthorized: false,
      });

      socket.setTimeout(10000);

      socket.on('secureConnect', () => {
        const responseTimeMs = Date.now() - start;
        const cert = socket.getPeerCertificate();

        if (!cert || Object.keys(cert).length === 0) {
          socket.destroy();
          resolve({
            success: false, statusCode: null, responseTimeMs,
            errorType: 'ssl_error', errorMessage: 'No certificate returned by server',
          });
          return;
        }

        const now = new Date();
        const validTo = new Date(cert.valid_to);
        const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

        socket.destroy();

        if (now > validTo) {
          resolve({
            success: false, statusCode: null, responseTimeMs,
            errorType: 'ssl_error', errorMessage: `Certificate expired on ${cert.valid_to}`,
          });
          return;
        }

        if (daysUntilExpiry <= expiryWarningDays) {
          resolve({
            success: true, statusCode: null, responseTimeMs,
            errorType: null, errorMessage: `Certificate expires in ${daysUntilExpiry} days (warning threshold: ${expiryWarningDays} days)`,
            sslExpiryDays: daysUntilExpiry,
            sslValidTo: cert.valid_to,
            sslIssuer: cert.issuer,
          });
          return;
        }

        resolve({
          success: true, statusCode: null, responseTimeMs,
          errorType: null, errorMessage: null,
          sslExpiryDays: daysUntilExpiry,
          sslValidTo: cert.valid_to,
          sslIssuer: cert.issuer,
        });
      });

      socket.on('error', (err) => {
        const responseTimeMs = Date.now() - start;
        resolve({
          success: false, statusCode: null, responseTimeMs,
          errorType: null, errorMessage: `SSL check connection failed: ${err.message}`,
        });
      });

      socket.on('timeout', () => {
        const responseTimeMs = Date.now() - start;
        socket.destroy();
        resolve({
          success: false, statusCode: null, responseTimeMs,
          errorType: 'timeout', errorMessage: 'SSL check timed out',
        });
      });
    } catch (err) {
      resolve({
        success: false, statusCode: null, responseTimeMs: Date.now() - start,
        errorType: null, errorMessage: `SSL check failed: ${err.message}`,
      });
    }
  });
}