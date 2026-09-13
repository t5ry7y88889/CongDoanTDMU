const { z } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.') || 'body'}: ${i.message}`);
      return res.status(400).json({ success: false, error: `Dữ liệu không hợp lệ: ${issues.join('; ')}` });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validate, z };