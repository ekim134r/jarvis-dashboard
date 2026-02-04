import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import type { EncryptedString } from "@/lib/types";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

let cachedKey: Buffer | null = null;
let warnedMissingKey = false;

function parseKey(input: string): Buffer {
  const trimmed = input.trim();
  const isHex = /^[0-9a-fA-F]+$/.test(trimmed);

  if (isHex && trimmed.length === 64) {
    return Buffer.from(trimmed, "hex");
  }

  const base64 = Buffer.from(trimmed, "base64");
  if (base64.length === 32) {
    return base64;
  }

  if (isHex) {
    const hex = Buffer.from(trimmed, "hex");
    if (hex.length === 32) {
      return hex;
    }
  }

  throw new Error(
    "JARVIS_DB_KEY must be a 32-byte key encoded as base64 or hex."
  );
}

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.JARVIS_DB_KEY?.trim();
  if (!raw) {
    cachedKey = randomBytes(32);
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.warn(
        "[Jarvis] JARVIS_DB_KEY is missing. Generated a temporary dev key; encrypted data will not persist across restarts."
      );
    }
    return cachedKey;
  }

  cachedKey = parseKey(raw);
  return cachedKey;
}

type ParsedPayload = {
  iv: Buffer;
  ciphertext: Buffer;
  tag: Buffer;
};

function parseEncryptedPayload(payload: string): ParsedPayload | null {
  const [version, ivB64, cipherB64, tagB64] = payload.split(":");
  if (version !== VERSION || !ivB64 || !cipherB64 || !tagB64) return null;

  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(cipherB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) return null;

  return { iv, ciphertext, tag };
}

export function isEncryptedPayload(value: string): boolean {
  return parseEncryptedPayload(value) !== null;
}

export function encryptString(value: string): EncryptedString {
  if (isEncryptedPayload(value)) {
    return value as EncryptedString;
  }

  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  const payload = [
    VERSION,
    iv.toString("base64"),
    ciphertext.toString("base64"),
    tag.toString("base64")
  ].join(":");

  return payload as EncryptedString;
}

export function decryptString(payload?: string | null): string {
  if (!payload) return "";

  const parsed = parseEncryptedPayload(payload);
  if (!parsed) {
    return payload;
  }

  try {
    const key = getKey();
    const decipher = createDecipheriv(ALGORITHM, key, parsed.iv);
    decipher.setAuthTag(parsed.tag);

    const plaintext = Buffer.concat([
      decipher.update(parsed.ciphertext),
      decipher.final()
    ]);

    return plaintext.toString("utf8");
  } catch (error) {
    console.warn("[Jarvis] Failed to decrypt payload.");
    return "";
  }
}
