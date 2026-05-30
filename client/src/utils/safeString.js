export const safeString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  
  return String(value)
    .trim()
    .toLowerCase();
};
