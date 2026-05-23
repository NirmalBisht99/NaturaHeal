// Reusable field presence check
export function validate(requiredFields) {
  return function (req, res, next) {
    const missing = requiredFields.filter((f) => {
      const v = req.body[f];
      return v === undefined || v === null || v === "";
    });

    if (missing.length > 0) {
      return res.status(400).json({ error: "Missing required fields: " + missing.join(", ") });
    }
    next();
  };
}

// Validates individual fields with type rules
export function validateFields(rules) {
  return function (req, res, next) {
    const errors = [];

    for (const [field, checks] of Object.entries(rules)) {
      const value = req.body[field];

      if (checks.required && (value === undefined || value === null || value === "")) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value === undefined || value === null || value === "") continue;

      const str = String(value).trim();

      // Name fields must not be purely numeric or contain numbers
      if (checks.noNumbers && /\d/.test(str)) {
        errors.push(`${field} must not contain numbers`);
      }

      // Minimum length
      if (checks.minLength && str.length < checks.minLength) {
        errors.push(`${field} must be at least ${checks.minLength} characters`);
      }

      // Maximum length
      if (checks.maxLength && str.length > checks.maxLength) {
        errors.push(`${field} must be at most ${checks.maxLength} characters`);
      }

      // Only letters, spaces, dots, hyphens (for names)
      if (checks.nameFormat && !/^[a-zA-Z\s.\-']+$/.test(str)) {
        errors.push(`${field} must contain only letters, spaces, dots, or hyphens`);
      }

      // Valid Indian phone
      if (checks.indianPhone) {
        const digits = str.replace(/[\s\-\+]/g, "");
        if (!/^[6-9]\d{9}$/.test(digits) && !/^\+91[6-9]\d{9}$/.test(str.replace(/\s/g, ""))) {
          errors.push(`${field} must be a valid Indian phone number`);
        }
      }

      // Valid pincode
      if (checks.pincode && !/^\d{6}$/.test(str)) {
        errors.push(`${field} must be a 6-digit pincode`);
      }

      // Positive number
      if (checks.positive && (isNaN(parseFloat(str)) || parseFloat(str) <= 0)) {
        errors.push(`${field} must be a positive number`);
      }

      // Non-negative integer
      if (checks.nonNegativeInt && (isNaN(parseInt(str)) || parseInt(str) < 0)) {
        errors.push(`${field} must be a non-negative integer`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join("; ") });
    }

    next();
  };
}