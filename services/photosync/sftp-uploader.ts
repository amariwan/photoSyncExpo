import PhotoSyncTransportModule, {
  type NativeSftpConnectionConfig,
  type NativeUploadRequest,
  type PhotoSyncTransportModuleType,
} from "@/modules/photo-sync-transport";
import type {
  FilenameStrategy,
  FolderStrategy,
  RemoteFileEntry,
  SftpConfig,
  UploadItem,
} from "@/types/photosync";

export interface SftpConnectionConfig extends SftpConfig {
  password?: string;
  privateKey?: string;
}

export interface UploadProgress {
  fraction: number;
  transferredBytes: number;
  totalBytes: number;
}

export interface SftpUploadRequest {
  assetId: string;
  filename: string;
  localUri: string;
  mediaType: UploadItem["mediaType"];
  creationTime: number;
  remotePath: string;
}

export interface SftpConnectionTestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export interface SftpUploader {
  readonly implementationName: string;
  testConnection(
    config: SftpConnectionConfig
  ): Promise<SftpConnectionTestResult>;
  uploadFile(
    config: SftpConnectionConfig,
    request: SftpUploadRequest,
    onProgress: (progress: UploadProgress) => void
  ): Promise<void>;
  listDirectory(
    config: SftpConnectionConfig,
    path: string
  ): Promise<RemoteFileEntry[]>;
}

export function validateSftpConfig(config: SftpConnectionConfig): string[] {
  const errors: string[] = [];

  if (!config.host) {
    errors.push("SFTP host is required.");
  }
  if (!config.username) {
    errors.push("SFTP username is required.");
  }
  if (config.authType === "password" && !config.password) {
    errors.push("SFTP password is required for password authentication.");
  }
  if (config.authType === "key" && !config.privateKey) {
    errors.push("Private key is required for key-based authentication.");
  }
  if (
    !Number.isInteger(config.port) ||
    config.port < 1 ||
    config.port > 65535
  ) {
    errors.push("SFTP port must be an integer between 1 and 65535.");
  }

  return errors;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const NATIVE_MODULE_MISSING_MESSAGE =
  "PhotoSyncTransport native module is not available. Build a development client (npx expo run:android / npx expo run:ios).";
const USE_MOCK_TRANSPORT =
  process.env.EXPO_PUBLIC_PHOTOSYNC_ALLOW_MOCK_TRANSPORT === "1";

function toNativeSftpConfig(
  config: SftpConnectionConfig
): NativeSftpConnectionConfig {
  return {
    host: config.host,
    port: config.port,
    remotePath: config.remotePath,
    username: config.username,
    authType: config.authType,
    password: config.password,
    privateKey: config.privateKey,
  };
}

function toNativeUploadRequest(request: SftpUploadRequest): NativeUploadRequest {
  return {
    assetId: request.assetId,
    filename: request.filename,
    localUri: request.localUri,
    mediaType: request.mediaType,
    creationTime: request.creationTime,
    remotePath: request.remotePath,
  };
}

function normalizePath(path: string): string {
  const normalized = path.trim().replace(/\\/g, "/").replace(/\/+/g, "/");
  if (!normalized || normalized === ".") {
    return "/";
  }
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function joinPath(basePath: string, childName: string): string {
  const safeBase = normalizePath(basePath);
  if (safeBase === "/") {
    return `/${childName}`;
  }
  return `${safeBase}/${childName}`;
}

function lastPathPart(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === "/") {
    return "";
  }
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

function buildMockDirectoryEntries(path: string): RemoteFileEntry[] {
  const now = Date.now();
  const currentPart = lastPathPart(path);
  const normalizedPath = normalizePath(path);

  const file = (
    name: string,
    size: number,
    modifiedOffsetMs: number
  ): RemoteFileEntry => ({
    name,
    type: "file",
    path: joinPath(normalizedPath, name),
    size,
    modifiedTime: now - modifiedOffsetMs,
  });

  const directory = (
    name: string,
    modifiedOffsetMs: number
  ): RemoteFileEntry => ({
    name,
    type: "directory",
    path: joinPath(normalizedPath, name),
    modifiedTime: now - modifiedOffsetMs,
  });

  if (/^\d{4}-\d{2}$/.test(currentPart)) {
    return [
      file("IMG_0001.jpg", 4_203_122, 2 * 60 * 60 * 1000),
      file("IMG_0002.heic", 3_202_010, 3 * 60 * 60 * 1000),
      file("VID_0001.mp4", 62_000_000, 6 * 60 * 60 * 1000),
      file("IMG_0003.png", 1_105_281, 9 * 60 * 60 * 1000),
    ];
  }

  if (currentPart === "clips") {
    return [
      file("clip-001.mp4", 24_000_000, 4 * 60 * 60 * 1000),
      file("clip-002.mov", 18_250_000, 8 * 60 * 60 * 1000),
      file("clip-003.mp4", 31_480_000, 14 * 60 * 60 * 1000),
    ];
  }

  if (currentPart === "archive") {
    return [
      directory("2024-06", 220 * 24 * 60 * 60 * 1000),
      directory("2024-05", 260 * 24 * 60 * 60 * 1000),
      file("old-memory.jpg", 3_600_000, 280 * 24 * 60 * 60 * 1000),
    ];
  }

  return [
    directory("2026-02", 30 * 60 * 1000),
    directory("2026-01", 26 * 60 * 60 * 1000),
    directory("clips", 3 * 60 * 60 * 1000),
    directory("archive", 21 * 24 * 60 * 60 * 1000),
    file("cover.jpg", 2_403_120, 90 * 60 * 1000),
  ];
}

export class MockSftpUploader implements SftpUploader {
  readonly implementationName = "Mock SFTP Uploader";

  async testConnection(
    config: SftpConnectionConfig
  ): Promise<SftpConnectionTestResult> {
    const validationErrors = validateSftpConfig(config);
    if (validationErrors.length > 0) {
      return {
        ok: false,
        message: validationErrors[0],
      };
    }

    const startedAt = Date.now();
    await sleep(280);

    const normalizedHost = config.host.trim().toLowerCase();

    if (
      normalizedHost.includes("invalid") ||
      normalizedHost.includes("offline") ||
      normalizedHost.includes("fail")
    ) {
      return {
        ok: false,
        message: `Could not reach ${config.host}:${config.port}.`,
        latencyMs: Date.now() - startedAt,
      };
    }

    return {
      ok: true,
      message: `Connected to ${config.host}:${config.port} via SFTP.`,
      latencyMs: Date.now() - startedAt,
    };
  }

  async uploadFile(
    _config: SftpConnectionConfig,
    request: SftpUploadRequest,
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

  async listDirectory(
    _config: SftpConnectionConfig,
    path: string
  ): Promise<RemoteFileEntry[]> {
    await sleep(200);
    return buildMockDirectoryEntries(path);
  }
}

export class NativeSftpUploader implements SftpUploader {
  readonly implementationName = "Native SFTP Uploader (PhotoSyncTransport)";

  constructor(private readonly nativeModule: PhotoSyncTransportModuleType) {}

  async testConnection(
    config: SftpConnectionConfig
  ): Promise<SftpConnectionTestResult> {
    return this.nativeModule.testSftpConnection(toNativeSftpConfig(config));
  }

  async uploadFile(
    config: SftpConnectionConfig,
    request: SftpUploadRequest,
    onProgress: (progress: UploadProgress) => void
  ): Promise<void> {
    onProgress({
      fraction: 0,
      transferredBytes: 0,
      totalBytes: 1,
    });

    await this.nativeModule.uploadSftpFile(
      toNativeSftpConfig(config),
      toNativeUploadRequest(request)
    );

    onProgress({
      fraction: 1,
      transferredBytes: 1,
      totalBytes: 1,
    });
  }

  async listDirectory(
    config: SftpConnectionConfig,
    path: string
  ): Promise<RemoteFileEntry[]> {
    const entries = await this.nativeModule.listSftpDirectory(
      toNativeSftpConfig(config),
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

class UnavailableSftpUploader implements SftpUploader {
  readonly implementationName = "Unavailable SFTP Uploader";

  async testConnection(
    _config: SftpConnectionConfig
  ): Promise<SftpConnectionTestResult> {
    return {
      ok: false,
      message: NATIVE_MODULE_MISSING_MESSAGE,
    };
  }

  async uploadFile(
    _config: SftpConnectionConfig,
    _request: SftpUploadRequest,
    _onProgress: (progress: UploadProgress) => void
  ): Promise<void> {
    throw new Error(NATIVE_MODULE_MISSING_MESSAGE);
  }

  async listDirectory(
    _config: SftpConnectionConfig,
    _path: string
  ): Promise<RemoteFileEntry[]> {
    throw new Error(NATIVE_MODULE_MISSING_MESSAGE);
  }
}

export function createSftpUploader(): SftpUploader {
  if (PhotoSyncTransportModule) {
    return new NativeSftpUploader(PhotoSyncTransportModule);
  }

  if (USE_MOCK_TRANSPORT) {
    return new MockSftpUploader();
  }

  return new UnavailableSftpUploader();
}

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[/\\]/g, "_")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\.+$/, "upload");
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
    : "/home/user/photos";
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
