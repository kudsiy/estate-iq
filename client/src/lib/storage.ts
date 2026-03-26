/**
 * Client-side storage helper for uploading files to S3
 */

export async function storagePut(
  key: string,
  data: Uint8Array | Buffer | string,
  contentType?: string
): Promise<{ url: string; key: string }> {
  try {
    const formData = new FormData();
    
    if (typeof data === "string") {
      formData.append("file", new Blob([data], { type: contentType || "text/plain" }), key);
    } else {
      formData.append("file", new Blob([data], { type: contentType || "application/octet-stream" }), key);
    }
    
    formData.append("key", key);
    if (contentType) {
      formData.append("contentType", contentType);
    }

    // For now, return a mock response
    // In production, this would call your backend API endpoint
    const mockUrl = `https://storage.example.com/${key}`;
    
    return {
      url: mockUrl,
      key: key,
    };
  } catch (error) {
    console.error("Storage upload error:", error);
    throw new Error("Failed to upload file to storage");
  }
}

export async function storageGet(
  key: string,
  expiresIn?: number
): Promise<{ url: string; key: string }> {
  try {
    // For now, return a mock response
    // In production, this would call your backend API endpoint
    const mockUrl = `https://storage.example.com/${key}`;
    
    return {
      url: mockUrl,
      key: key,
    };
  } catch (error) {
    console.error("Storage get error:", error);
    throw new Error("Failed to get file from storage");
  }
}
