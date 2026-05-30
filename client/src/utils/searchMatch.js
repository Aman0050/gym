import { safeString } from './safeString';

export const searchMatch = (searchTerm, ...fields) => {
  const query = safeString(searchTerm);

  if (!query) return true;

  return fields.some((field) => safeString(field).includes(query));
};
