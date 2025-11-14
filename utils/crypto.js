import crypto from "crypto";
export const sha256Hex = (str) => crypto.createHash("sha256").update(str).digest("hex");
