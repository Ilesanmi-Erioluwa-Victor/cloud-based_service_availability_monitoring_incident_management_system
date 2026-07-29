export function logAudit(action, details, userId) {
  const entry = {
    timestamp: new Date(),
    action,
    details,
    userId: userId || null,
  };
  console.log('[AUDIT]', JSON.stringify(entry));
}