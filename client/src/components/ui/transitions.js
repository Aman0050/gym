export const transitions = {
  fast:      { type: 'spring', stiffness: 450, damping: 32 },
  normal:    { type: 'spring', stiffness: 320, damping: 28 },
  slow:      { type: 'spring', stiffness: 200, damping: 22 },
  cinematic: { duration: 1.0, ease: [0.22, 1, 0.36, 1] },
};
