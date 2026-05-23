// src/components/ui/ValidatedInput.jsx
// Drop-in replacement for plain <input> that shows inline validation errors

const BASE = {
  width: "100%", padding: "11px 14px",
  border: "1px solid #E5E7EB", borderRadius: 8,
  fontSize: 14, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
  background: "#fff", transition: "border-color .2s",
};

export default function ValidatedInput({
  label,
  error,
  type = "text",
  required = false,
  hint,
  style = {},
  inputStyle = {},
  ...props
}) {
  const hasError = Boolean(error);

  return (
    <div style={{ marginBottom: 4, ...style }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6, color: "#374151" }}>
          {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
        </label>
      )}
      <input
        type={type}
        {...props}
        style={{
          ...BASE,
          borderColor: hasError ? "#EF4444" : "#E5E7EB",
          background:  hasError ? "#FFF8F8" : "#fff",
          ...inputStyle,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = hasError ? "#EF4444" : "#15803D";
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = hasError ? "#EF4444" : "#E5E7EB";
          props.onBlur?.(e);
        }}
        // Block numeric input for name fields
        onKeyDown={(e) => {
          if (props["data-no-numbers"] && /^\d$/.test(e.key)) {
            e.preventDefault();
          }
          props.onKeyDown?.(e);
        }}
        onPaste={(e) => {
          if (props["data-no-numbers"]) {
            const pasted = e.clipboardData.getData("text");
            if (/\d/.test(pasted)) e.preventDefault();
          }
          props.onPaste?.(e);
        }}
      />
      {hasError && (
        <div style={{ fontSize: 12, color: "#EF4444", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <span>⚠</span> {error}
        </div>
      )}
      {!hasError && hint && (
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>{hint}</div>
      )}
    </div>
  );
}