import jwt from "jsonwebtoken";

export function generateResetToken(email) {
  return jwt.sign(
    { email }, 
    process.env.JWT_SECRET, 
    { expiresIn: "15m" } 
  );
}