import axios from 'axios';
import { decrypt } from '../encryptionService.js';

export async function apiHealthCheck(targetUrl, expectedStatusCodes, timeoutMs, encryptedAuthHeader) {
  const start = Date.now();

  try {
    const headers = { 'User-Agent': 'UptimeGuard/1.0' };

    if (encryptedAuthHeader) {
      const authHeader = decrypt(encryptedAuthHeader);
      headers['Authorization'] = authHeader;
    }

    const response = await axios({
      method: 'GET',
      url: targetUrl,
      timeout: timeoutMs,
      validateStatus: () => true,
      headers,
    });

    const responseTimeMs = Date.now() - start;
    const statusCode = response.status;
    const statusInRange = expectedStatusCodes.includes(statusCode);

    let bodyValid = true;
    let bodyError = null;

    if (statusInRange && typeof response.data === 'object' && response.data !== null) {
      if (response.data.status && response.data.status !== 'ok' && response.data.status !== 'healthy' && response.data.status !== 'up') {
        bodyValid = false;
        bodyError = `Health endpoint returned status: ${response.data.status}`;
      }
    }

    const success = statusInRange && bodyValid;

    return {
      success,
      statusCode,
      responseTimeMs,
      errorType: !statusInRange ? 'wrong_status_code' : !bodyValid ? 'invalid_response_body' : null,
      errorMessage: !statusInRange
        ? `Expected status ${expectedStatusCodes.join(' or ')}, got ${statusCode}`
        : bodyError,
    };
  } catch (err) {
    const responseTimeMs = Date.now() - start;

    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return {
        success: false, statusCode: null, responseTimeMs,
        errorType: 'timeout', errorMessage: `Request timed out after ${timeoutMs}ms`,
      };
    }

    return {
      success: false, statusCode: null, responseTimeMs,
      errorType: null, errorMessage: err.message,
    };
  }
}