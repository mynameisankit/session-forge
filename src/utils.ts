import { randomBytes, createHash } from "node:crypto";

export const createToken = (): string => randomBytes(32).toString("base64url");

export const getHash = (token: string): string => createHash("sha256").update(token).digest("hex");
