const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const validateUuidParam = (paramName = 'id') => {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (value && !uuidRegex.test(value)) {
      return res.status(400).json({ error: `Invalid UUID format for parameter: ${paramName}` });
    }
    next();
  };
};

const validateUuidParamMiddleware = (req, res, next, id) => {
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: `Invalid UUID format for parameter` });
  }
  next();
};

module.exports = { validateUuidParam, validateUuidParamMiddleware, uuidRegex };
