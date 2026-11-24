/**
 * Normalize an API/axios error into a human-readable message.
 * Backend responses use shape: { success, error: { code, message } }
 */
export function getErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  const data = err?.response?.data;
  if (data?.error?.message) return data.error.message;
  if (data?.message) return data.message;
  if (err?.message) return err.message;
  return fallback;
}