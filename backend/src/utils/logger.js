
function timestamp() {
  return new Date().toISOString();
}

export const logger = {
  info: function(msg) {
    console.log("[" + timestamp() + "] INFO  " + msg);
  },
  warn: function(msg) {
    console.warn("[" + timestamp() + "] WARN  " + msg);
  },
  error: function(msg, err) {
    console.error("[" + timestamp() + "] ERROR " + msg);
    if (err) {
      console.error(err);
    }
  },
};