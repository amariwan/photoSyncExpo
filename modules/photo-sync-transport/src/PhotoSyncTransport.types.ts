export interface NativeConnectionResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export interface NativeRemoteFileEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedTime?: number;
  path: string;
}

export interface NativeSmbConnectionConfig {
  host: string;
  port: number;
  share: string;
  remotePath: string;
  username: string;
  password: string;
}

export interface NativeSftpConnectionConfig {
  host: string;
  port: number;
  remotePath: string;
  username: string;
  authType: 'password' | 'key';
  password?: string;
  privateKey?: string;
}

export interface NativeUploadRequest {
  assetId: string;
  filename: string;
  localUri: string;
  mediaType: 'photo' | 'video';
  creationTime: number;
  remotePath: string;
}

export interface PhotoSyncTransportModuleType {
  testSmbConnection(config: NativeSmbConnectionConfig): Promise<NativeConnectionResult>;
  listSmbDirectory(config: NativeSmbConnectionConfig, path: string): Promise<NativeRemoteFileEntry[]>;
  uploadSmbFile(config: NativeSmbConnectionConfig, request: NativeUploadRequest): Promise<void>;
  testSshConnection(config: NativeSftpConnectionConfig): Promise<NativeConnectionResult>;
  testSftpConnection(config: NativeSftpConnectionConfig): Promise<NativeConnectionResult>;
  listSftpDirectory(config: NativeSftpConnectionConfig, path: string): Promise<NativeRemoteFileEntry[]>;
  uploadSftpFile(config: NativeSftpConnectionConfig, request: NativeUploadRequest): Promise<void>;
}
