import PhotoSyncTransportModule, {
  type NativeSmbConnectionConfig,
  type NativeUploadRequest,
  type PhotoSyncTransportModuleType,
} from "@/modules/photo-sync-transport";
import type {
  FilenameStrategy,
  FolderStrategy,
  RemoteFileEntry,
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

export interface SmbConnectionTestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export interface SmbUploader {
  readonly implementationName: string;
  testConnection(
    config: SmbConnectionConfig
  ): Promise<SmbConnectionTestResult>;
  uploadFile(
    config: SmbConnectionConfig,
    request: SmbUploadRequest,
    onProgress: (progress: UploadProgress) => void
  ): Promise<void>;
  listDirectory(
    config: SmbConnectionConfig,
    path: string
  ): Promise<RemoteFileEntry[]>;
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

const NATIVE_MODULE_MISSING_MESSAGE =
  "PhotoSyncTransport native module is not available. Build a development client (npx expo run:android / npx expo run:ios).";

function toNativeSmbConfig(config: SmbConnectionConfig): NativeSmbConnectionConfig {
  return {
    host: config.host,
    port: config.port,
    share: config.share,
    remotePath: config.remotePath,
    username: config.username,
    password: config.password,
  };
}

function toNativeUploadRequest(request: SmbUploadRequest): NativeUploadRequest {
  return {
    assetId: request.assetId,
    filename: request.filename,
    localUri: request.localUri,
    mediaType: request.mediaType,
    creationTime: request.creationTime,
    remotePath: request.remotePath,
  };
}






export class NativeSmbUploader implements SmbUploader {
  readonly implementationName = "Native SMB Uploader (PhotoSyncTransport)";

  constructor(private readonly nativeModule: PhotoSyncTransportModuleType) {}

  async testConnection(
    config: SmbConnectionConfig
  ): Promise<SmbConnectionTestResult> {
    return this.nativeModule.testSmbConnection(toNativeSmbConfig(config));
  }

  async uploadFile(
    config: SmbConnectionConfig,
    request: SmbUploadRequest,
    onProgress: (progress: UploadProgress) => void
  ): Promise<void> {
    onProgress({
      fraction: 0,
      transferredBytes: 0,
      totalBytes: 1,
    });

    await this.nativeModule.uploadSmbFile(
      toNativeSmbConfig(config),
      toNativeUploadRequest(request)
    );

    onProgress({
      fraction: 1,
      transferredBytes: 1,
      totalBytes: 1,
    });
  }

  async listDirectory(
    config: SmbConnectionConfig,
    path: string
  ): Promise<RemoteFileEntry[]> {
    const entries = await this.nativeModule.listSmbDirectory(
      toNativeSmbConfig(config),
      path
    );

    return entries.map((entry) => ({
      name: entry.name,
      type: entry.type === "directory" ? "directory" : "file",
      size: entry.size,
      modifiedTime: entry.modifiedTime,
      path: entry.path,
    }));
  }
}

class UnavailableSmbUploader implements SmbUploader {
  readonly implementationName = "Unavailable SMB Uploader";

  async testConnection(
    _config: SmbConnectionConfig
  ): Promise<SmbConnectionTestResult> {
    return {
      ok: false,
      message: NATIVE_MODULE_MISSING_MESSAGE,
    };
  }

  async uploadFile(
    _config: SmbConnectionConfig,
    _request: SmbUploadRequest,
    _onProgress: (progress: UploadProgress) => void
  ): Promise<void> {
    throw new Error(NATIVE_MODULE_MISSING_MESSAGE);
  }

  async listDirectory(
    _config: SmbConnectionConfig,
    _path: string
  ): Promise<RemoteFileEntry[]> {
    throw new Error(NATIVE_MODULE_MISSING_MESSAGE);
  }
}

export function createSmbUploader(): SmbUploader {
  if (PhotoSyncTransportModule) {
    return new NativeSmbUploader(PhotoSyncTransportModule);
  }

  return new UnavailableSmbUploader();
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
