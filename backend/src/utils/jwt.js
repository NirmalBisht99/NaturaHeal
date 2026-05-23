
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "naturaheal_admin_secret_change_in_production";

export function signAdminToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "8h" });
}

export function verifyAdminToken(token) {
  return jwt.verify(token, SECRET);
}