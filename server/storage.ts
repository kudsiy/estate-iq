import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function saveBase64Image(base64Data: string): Promise<string> {
  // Extract content type and data
  const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 image data");
  }

  const extension = matches[1] === "jpeg" ? "jpg" : matches[1];
  const data = Buffer.from(matches[2], "base64");
  const filename = `${nanoid()}.${extension}`;
  const filepath = path.join(UPLOADS_DIR, filename);

  fs.writeFileSync(filepath, data);
  
  // Return the public URL path
  return `/uploads/${filename}`;
}

export function deleteImage(publicPath: string): void {
  const filename = path.basename(publicPath);
  const filepath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

export async function storagePut(key: string, data: Buffer, contentType: string): Promise<{ url: string }> {
  const filepath = path.join(UPLOADS_DIR, key);
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, data);
  return { url: `/uploads/${key}` };
}
