import api from './api';

/**
 * Capture high-fidelity user interaction events
 */
export const trackEvent = async (event, metadata = {}) => {
  try {
    await api.post('/analytics/log', {
      event,
      path: window.location.pathname,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      }
    });
  } catch (err) {
    // Silent fail for analytics to prevent UX disruption
    console.warn('[Analytics] Failed to capture event', err);
  }
};

/**
 * Submit structured user feedback
 */
export const submitFeedback = async (data) => {
  try {
    const res = await api.post('/analytics/feedback', data);
    return res.data;
  } catch (err) {
    throw err;
  }
};

/**
 * Component Usage Hook (Optional for automated tracking)
 */
export const useFeatureTrack = (featureName) => {
  const track = (action, meta = {}) => trackEvent(`${featureName}_${action}`, meta);
  return { track };
};
