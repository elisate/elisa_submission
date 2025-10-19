import crypto from "crypto";

// Generate RSA keypair in memory
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

// Hash email with SHA-384
export function hashEmail(email) {
  return crypto.createHash("sha384").update(email).digest("hex");
}

// Sign hash using private key, return base64
export function signHash(hash) {
  const signature = crypto.sign("sha384", Buffer.from(hash, "hex"), privateKey);
  return signature.toString("base64");
}

// Verify signature, return boolean
export function verifySignature(hash, signatureBase64) {
  return crypto.verify(
    "sha384",
    Buffer.from(hash, "hex"),
    publicKey,
    Buffer.from(signatureBase64, "base64")
  );
}

// Export public key PEM
export const getPublicKey = () =>
  publicKey.export({ type: "pkcs1", format: "pem" });
