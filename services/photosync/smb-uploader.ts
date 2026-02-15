import type {
  FilenameStrategy,
  FolderStrategy,
  SmbConfig,
  UploadItem,
} from "@/types/photosync";

export interface SmbConnectionConfig extends SmbConfig {
  password: string;
}

export interface UploadProgress {
  fraction: number;
  transferredBytes: number;
  totalBytes: number;
}

export interface SmbUploadRequest {
  assetId: string;
  filename: string;
  localUri: string;
  mediaType: UploadItem["mediaType"];
  creationTime: number;
  remotePath: string;
}

export interface SmbUploader {
  readonly implementationName: string;
  uploadFile(
    config: SmbConnectionConfig,
    request: SmbUploadRequest,
    onProgress: (progress: UploadProgress) => void
  ): Promise<void>;
}

export function validateSmbConfig(config: SmbConnectionConfig): string[] {
  const errors: string[] = [];

  if (!config.host) {
    errors.push("SMB host is required.");
  }
  if (!config.share) {
    errors.push("SMB share is required.");
  }
  if (!config.username) {
    errors.push("SMB username is required.");
  }
  if (!config.password) {
    errors.push("SMB password is required.");
  }
  if (
    !Number.isInteger(config.port) ||
    config.port < 1 ||
    config.port > 65535
  ) {
    errors.push("SMB port must be an integer between 1 and 65535.");
  }

  return errors;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class MockSmbUploader implements SmbUploader {
  readonly implementationName = "Mock SMB Uploader";

  async uploadFile(
    _config: SmbConnectionConfig,
    request: SmbUploadRequest,
    onProgress: (progress: UploadProgress) => void
  ): Promise<void> {
    const simulatedTotalBytes = Math.max(
      request.filename.length * 1024 * 40,
      2_000_000
    );
    const totalSteps = 12;

    onProgress({
      fraction: 0,
      transferredBytes: 0,
      totalBytes: simulatedTotalBytes,
    });

    for (let step = 1; step <= totalSteps; step += 1) {
      await sleep(140);

      const fraction = step / totalSteps;
      onProgress({
        fraction,
        transferredBytes: Math.round(simulatedTotalBytes * fraction),
        totalBytes: simulatedTotalBytes,
      });
    }
  }
}

function sanitizeFilename(value: string): string {
  return (
    value
      .trim()
      .replace(/[/\\]/g, "_")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/\s+/g, " ")
      // Prevent filenames that are only dots (e.g. "." or ".."), which can create hidden files
      // or ambiguous/invalid path segments on the remote SMB share.
      .replace(/^\.+$/, "upload")
  );
}

function applyFilenameStrategy(
  filename: string,
  creationTime: number,
  strategy: FilenameStrategy
): string {
  const safeFilename = sanitizeFilename(filename);
  if (strategy === "original") {
    return safeFilename || `upload_${creationTime}.bin`;
  }

  return `${creationTime}_${safeFilename || "upload.bin"}`;
}

export function buildRemotePath(
  basePath: string,
  item: UploadItem,
  folderStrategy: FolderStrategy,
  filenameStrategy: FilenameStrategy
): string {
  const normalizedBase = basePath
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");
  const safeBase = normalizedBase
    ? normalizedBase.startsWith("/")
      ? normalizedBase
      : `/${normalizedBase}`
    : "/Camera Roll";
  const yyyyMm = new Date(item.creationTime).toISOString().slice(0, 7);
  const filename = applyFilenameStrategy(
    item.filename,
    item.creationTime,
    filenameStrategy
  );

  if (folderStrategy === "flat") {
    return `${safeBase}/${filename}`;
  }

  return `${safeBase}/${yyyyMm}/${filename}`;
}
