# PhotoSync

PhotoSync is an Expo/React Native app that automatically detects new photos and videos in your iPhone Camera Roll and uploads them to an SMB destination.

## Features

- Automatic photo and video detection from Camera Roll
- SMB connection settings (host, port, share, remote path)
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

## Current SMB Transport Status

This project includes a `MockSmbUploader` implementation wired into the full sync workflow.

- Detection, queueing, progress, state persistence, and settings are fully implemented.
- The transport layer is structured behind an interface so you can replace the mock uploader with a production SMB client/native module without changing the rest of the app.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start Expo:

```bash
npm run start
```

3. Run on iOS (recommended as a development build for full background behavior):

```bash
npm run ios
```

## Project Structure

- `app/(tabs)/index.tsx`: Sync dashboard (queue, progress, logs, controls)
- `app/(tabs)/settings.tsx`: SMB and sync settings
- `providers/photo-sync-provider.tsx`: Shared sync state machine, retry/cancel logic, queue actions
- `services/photosync/media-scanner.ts`: Camera Roll permission + new media scanning
- `services/photosync/smb-uploader.ts`: SMB uploader interface + mock implementation
- `services/photosync/background-task.ts`: Background fetch registration
- `services/photosync/storage.ts`: Persistent settings, metadata, logs, queue, and credentials
- `services/photosync/network.ts`: Network policy checks (Wi-Fi-only gate)
- `types/photosync.ts`: Shared app data contracts

## Notes

- iOS background execution behavior depends on system scheduling and development build capabilities.
- Replace `MockSmbUploader` in `services/photosync/smb-uploader.ts` with a production SMB implementation for real network share uploads.
