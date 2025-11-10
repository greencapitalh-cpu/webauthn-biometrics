import crypto from "crypto";

export const sha256Hex = (input) =>
  crypto.createHash("sha256").update(input).digest("hex");

export const randomBase64 = (size = 32) =>
  crypto.randomBytes(size).toString("base64url");
