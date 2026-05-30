/**
 * getErrorMessage — Safe error-to-string utility
 * Prevents React "Objects are not valid as a React child" crashes.
 * Use this EVERYWHERE you display an error in JSX or toast.
 */
export const getErrorMessage = (err) => {
  if (!err) return 'Something went wrong';
  if (typeof err === 'string') return err;
  if (typeof err === 'number') return String(err);
  if (err?.response?.data?.error) {
    const e = err.response.data.error;
    if (typeof e === 'string') return e;
    if (e?.message) return e.message;
    return 'Server Error';
  }
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message) return err.message;
  if (err?.status) return `Error ${err.status}`;
  if (err?.statusCode) return `Error ${err.statusCode}`;
  // Last resort — never render a raw object
  try { return JSON.stringify(err); } catch { return 'Unknown error'; }
};

export default getErrorMessage;
