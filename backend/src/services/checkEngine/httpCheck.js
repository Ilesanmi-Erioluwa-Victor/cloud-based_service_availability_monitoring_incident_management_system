import axios from 'axios';

export async function httpCheck(targetUrl, expectedStatusCodes, timeoutMs) {
  const start = Date.now();
  try {
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      timeout: timeoutMs,
      validateStatus: () => true,
      headers: { 'User-Agent': 'UptimeGuard/1.0' },
    });

    const responseTimeMs = Date.now() - start;
    const statusCode = response.status;
    const success = expectedStatusCodes.includes(statusCode);

    return {
      success,
      statusCode,
      responseTimeMs,
      errorType: success ? null : 'wrong_status_code',
      errorMessage: success
        ? null
        : `Expected status ${expectedStatusCodes.join(' or ')}, got ${statusCode}`,
    };
  } catch (err) {
    const responseTimeMs = Date.now() - start;

    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return {
        success: false,
        statusCode: null,
        responseTimeMs,
        errorType: 'timeout',
        errorMessage: `Request timed out after ${timeoutMs}ms`,
      };
    }

    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'EHOSTUNREACH') {
      return {
        success: false,
        statusCode: null,
        responseTimeMs,
        errorType: 'connection_refused',
        errorMessage: `Connection failed: ${err.message}`,
      };
    }

    return {
      success: false,
      statusCode: null,
      responseTimeMs,
      errorType: null,
      errorMessage: err.message,
    };
  }
}