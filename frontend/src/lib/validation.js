// Shared validation helpers used across all forms

export const rules = Object.freeze({
  // Name fields — no digits, only letters/spaces/dots/hyphens
  name(value, label = "Name") {
    const v = String(value || "").trim();
    if (!v) return `${label} is required`;
    if (/\d/.test(v)) return `${label} must not contain numbers`;
    if (!/^[a-zA-Z\s.\-']+$/.test(v)) return `${label} may only contain letters, spaces, dots, or hyphens`;
    if (v.length < 2) return `${label} must be at least 2 characters`;
    if (v.length > 60) return `${label} must be at most 60 characters`;
    return null;
  },

  // City / state — letters only, no digits
  cityOrState(value, label = "City") {
    const v = String(value || "").trim();
    if (!v) return `${label} is required`;
    if (/^\d+$/.test(v)) return `${label} must not be a number`;
    if (v.length < 2) return `${label} must be at least 2 characters`;
    return null;
  },

  // Indian phone number
  phone(value) {
    const v = String(value || "").replace(/[\s\-\+]/g, "");
    if (!v) return "Phone number is required";
    // Accept 10-digit starting with 6-9, or with 91 prefix
    if (/^91[6-9]\d{9}$/.test(v)) return null;
    if (/^[6-9]\d{9}$/.test(v)) return null;
    return "Enter a valid Indian mobile number (10 digits, starting with 6–9)";
  },

  // 6-digit pincode
  pincode(value) {
    const v = String(value || "").trim();
    if (!v) return "Pincode is required";
    if (!/^\d{6}$/.test(v)) return "Pincode must be exactly 6 digits";
    return null;
  },

  // Email
  email(value) {
    const v = String(value || "").trim();
    if (!v) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
    return null;
  },

  // Password
  password(value) {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return null;
  },

  // Address line — free text, just required
  address(value) {
    const v = String(value || "").trim();
    if (!v) return "Address is required";
    if (v.length < 5) return "Please enter a complete address";
    return null;
  },

  // Generic required text
  required(value, label = "This field") {
    const v = String(value || "").trim();
    if (!v) return `${label} is required`;
    return null;
  },

  // Positive number (price, etc.)
  positiveNumber(value, label = "Value") {
    const n = parseFloat(value);
    if (isNaN(n) || n <= 0) return `${label} must be a positive number`;
    return null;
  },

  // Non-negative integer (stock)
  nonNegativeInt(value, label = "Value") {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) return `${label} must be 0 or greater`;
    return null;
  },
});

// Run a map of { fieldKey: errorString|null } and return first error or null
export function firstError(errorMap) {
  return Object.values(errorMap).find(Boolean) || null;
}

// Build a full errors object from a values map + rule map
// Usage: buildErrors({ name: "123abc", phone: "+91..." }, { name: rules.name, phone: rules.phone })
export function buildErrors(values, ruleMap) {
  const errors = {};
  for (const [key, ruleFn] of Object.entries(ruleMap)) {
    errors[key] = ruleFn(values[key]);
  }
  return errors;
}

// Returns true if all values in an errors object are null/falsy
export function isValid(errors) {
  return Object.values(errors).every((e) => !e);
}