
export function errorHandler(err, req, res, _next) {
  const status  = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  const payload = { error: message };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }

  console.error(`[${req.method}] ${req.path} → ${status}: ${message}`);
  res.status(status).json(payload);
}

export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

export function requestLogger(req, _res, next) {
  console.log(`→ [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
}