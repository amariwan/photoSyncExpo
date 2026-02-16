import { requireOptionalNativeModule } from 'expo-modules-core';

import type { PhotoSyncTransportModuleType } from './PhotoSyncTransport.types';

const moduleInstance = requireOptionalNativeModule<PhotoSyncTransportModuleType>('PhotoSyncTransport');

export default moduleInstance;
