const sanitizeHtml = require('sanitize-html');

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {}
    }).trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    const cleanObject = {};
    Object.entries(value).forEach(([key, nestedValue]) => {
      cleanObject[key] = sanitizeValue(nestedValue);
    });
    return cleanObject;
  }

  return value;
}

function sanitizeInput(req, res, next) {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  next();
}

module.exports = { sanitizeInput, sanitizeValue };
