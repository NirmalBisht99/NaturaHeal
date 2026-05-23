
//  Small helpers so every response has a consistent shape.

export function sendSuccess(res, data, statusCode) {
  const code = statusCode || 200;
  return res.status(code).json({ success: true, ...data });
}

export function sendError(res, message, statusCode) {
  const code = statusCode || 500;
  return res.status(code).json({ success: false, error: message });
}