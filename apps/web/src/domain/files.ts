export interface FilePreview {
  name: string;
  type: string;
  sizeBytes: number;
  url: string | null;
  text: string | null;
}

const imageTypes = new Set(["image/jpeg", "image/png", "image/gif"]);
const textTypes = new Set(["text/plain"]);

export function validateAttachment(file: File): string | null {
  if (imageTypes.has(file.type)) {
    return null;
  }

  if (textTypes.has(file.type)) {
    return file.size <= 100 * 1024 ? null : "TXT file cannot exceed 100 KB";
  }

  return "Only JPG, GIF, PNG, and TXT files are supported";
}

export async function createFilePreview(file: File): Promise<FilePreview> {
  if (textTypes.has(file.type)) {
    return {
      name: file.name,
      type: file.type,
      sizeBytes: file.size,
      url: null,
      text: await file.text()
    };
  }

  return {
    name: file.name,
    type: file.type,
    sizeBytes: file.size,
    url: URL.createObjectURL(file),
    text: null
  };
}
