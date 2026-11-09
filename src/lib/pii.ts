import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function keyBytes() {
  const hex = process.env.PII_ENCRYPTION_KEY ?? '';
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error('PII_ENCRYPTION_KEY must be a 32-byte hexadecimal key.');
  return Buffer.from(hex, 'hex');
}

export function encryptPii(value: Buffer | string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBytes(), iv);
  const ciphertext = Buffer.concat([cipher.update(value), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decryptPii(value: string) {
  const [version, ivText, tagText, ciphertextText] = value.split(':');
  if (version !== 'v1' || !ivText || !tagText || !ciphertextText) throw new Error('Encrypted identity record is malformed.');
  const decipher = createDecipheriv('aes-256-gcm', keyBytes(), Buffer.from(ivText, 'base64'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextText, 'base64')), decipher.final()]);
}

export function parseIdentityPhoto(dataUrl: unknown) {
  if (typeof dataUrl !== 'string') throw new Error('Foto KTP wajib diunggah.');
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error('Format foto harus JPG, PNG, atau WebP.');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) throw new Error('Ukuran foto KTP maksimal 5 MB.');
  const isJpeg = match[1] === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  const isPng = match[1] === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const isWebp = match[1] === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!(isJpeg || isPng || isWebp)) throw new Error('Isi file tidak cocok dengan format foto yang dipilih.');
  return { bytes, mimeType: match[1] };
}
