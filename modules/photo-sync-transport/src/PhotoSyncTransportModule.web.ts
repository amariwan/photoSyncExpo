import { NativeModule, registerWebModule } from 'expo';

import type {
  NativeConnectionResult,
  NativeRemoteFileEntry,
  NativeSftpConnectionConfig,
  NativeSmbConnectionConfig,
  NativeUploadRequest,
  PhotoSyncTransportModuleType,
} from './PhotoSyncTransport.types';

const UNSUPPORTED_MESSAGE =
  'PhotoSyncTransport native module is not available on web. Use Android/iOS development build.';

class PhotoSyncTransportWebModule
  extends NativeModule
  implements PhotoSyncTransportModuleType {
  async testSmbConnection(_config: NativeSmbConnectionConfig): Promise<NativeConnectionResult> {
    return { ok: false, message: UNSUPPORTED_MESSAGE };
  }

  async listSmbDirectory(
    _config: NativeSmbConnectionConfig,
    _path: string
  ): Promise<NativeRemoteFileEntry[]> {
    throw new Error(UNSUPPORTED_MESSAGE);
  }

  async uploadSmbFile(
    _config: NativeSmbConnectionConfig,
    _request: NativeUploadRequest
  ): Promise<void> {
    throw new Error(UNSUPPORTED_MESSAGE);
  }

  async testSshConnection(_config: NativeSftpConnectionConfig): Promise<NativeConnectionResult> {
    return { ok: false, message: UNSUPPORTED_MESSAGE };
  }

  async testSftpConnection(_config: NativeSftpConnectionConfig): Promise<NativeConnectionResult> {
    return { ok: false, message: UNSUPPORTED_MESSAGE };
  }

  async listSftpDirectory(
    _config: NativeSftpConnectionConfig,
    _path: string
  ): Promise<NativeRemoteFileEntry[]> {
    throw new Error(UNSUPPORTED_MESSAGE);
  }

  async uploadSftpFile(
    _config: NativeSftpConnectionConfig,
    _request: NativeUploadRequest
  ): Promise<void> {
    throw new Error(UNSUPPORTED_MESSAGE);
  }
}

export default registerWebModule(PhotoSyncTransportWebModule, 'PhotoSyncTransport');
