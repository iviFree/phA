import crypto from "crypto";

export const ZERO_PAD = (n: number) => n.toString().padStart(4, "0");

export function hashCode(plain: string) {
  const pepper = process.env.CODE_PEPPER || "";
  const normalized = plain.toUpperCase();
  return crypto.createHash("sha256").update(pepper + normalized).digest("hex");
}
