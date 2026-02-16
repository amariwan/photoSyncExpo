# PhotoSync

PhotoSync is an Expo/React Native app that detects new photos/videos and syncs to SMB or SFTP targets.

## Features

- Automatic photo and video detection from Camera Roll
- iOS-style Photos tab with month sections, smart grid, and fullscreen preview
- Modernized UI/UX across Sync, Photos, and Settings with adaptive cards and docked actions
- SMB and SFTP connection settings
- Manual server connection test from settings
- Username/password authentication with secure credential storage
- Upload queue with per-file and overall progress visibility
- Configurable sync behavior (auto-launch scan, background sync toggle, max batch size)
- Wi-Fi-only upload policy
- Media filters (photos only, videos only, or both)
- Retry policy with per-item attempt tracking
- Queue actions: retry failed, clear failed, clear completed, clear all
- Stop sync after current item
- Naming and folder strategy controls (flat vs monthly, original vs timestamp-prefixed names)
- Auto-cleanup of completed queue items older than N days
- Persisted queue state between launches
- Background fetch registration with configurable interval

## Transport Status

This project now uses a local Expo native module at `modules/photo-sync-transport`:

- Android native implementation:
     - SMB via `jcifs-ng`
     - SSH/SFTP via `sshj`
- iOS native implementation is scaffolded but currently returns "not wired yet" errors for SMB/SFTP methods.
- If no native module is available in the running client, the app returns a clear connection error.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start Expo:

```bash
npm run start
```

3. Build and run a development client (required for native transport):

```bash
npx expo run:android
# or
npx expo run:ios
```

## Project Structure

- `app/(tabs)/index.tsx`: Sync dashboard (queue, progress, logs, controls)
- `app/(tabs)/gallery.tsx`: Photos-style library with timeline sections, filters, and fullscreen preview
- `app/(tabs)/settings.tsx`: SMB/SFTP and sync settings
- `providers/photo-sync-provider.tsx`: Shared sync state machine, retry/cancel logic, queue actions
- `services/photosync/media-scanner.ts`: Camera Roll permission + new media scanning
- `services/photosync/smb-uploader.ts`: SMB uploader interface + native/mock selection
- `services/photosync/sftp-uploader.ts`: SFTP uploader interface + native/mock selection
- `modules/photo-sync-transport/`: local Expo native module for SMB/SFTP/SSH
- `services/photosync/background-task.ts`: Background fetch registration
- `services/photosync/storage.ts`: Persistent settings, metadata, logs, queue, and credentials
- `services/photosync/network.ts`: Network policy checks (Wi-Fi-only gate)
- `types/photosync.ts`: Shared app data contracts

## Notes

- iOS background execution behavior depends on system scheduling and development build capabilities.
- Expo Go has platform limitations for this project:
     - On Android, `expo-media-library` does not provide full library access in Expo Go.
     - `expo-background-task` is unavailable in Expo Go.
- Use a development build (`npx expo run:ios` or `npx expo run:android`) when validating transport, media-library permissions, and background sync behavior.
- SSH host-key verification in the current Android module uses a permissive verifier for initial connectivity. Harden this before production use.
