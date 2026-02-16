import { requireNativeView } from 'expo';
import * as React from 'react';

const NativeView: React.ComponentType<Record<string, never>> =
  requireNativeView('PhotoSyncTransport');

export default function PhotoSyncTransportView() {
  return <NativeView />;
}
