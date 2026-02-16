import type { SyncPhase, UploadItem } from '@/types/photosync';

export type SyncState = 'idle' | 'syncing' | 'partial_failure';

interface DeriveSyncStateInput {
  phase: SyncPhase;
  queue: UploadItem[];
}

export function deriveSyncState({ phase, queue }: DeriveSyncStateInput): SyncState {
  if (phase === 'syncing' || phase === 'scanning') {
    return 'syncing';
  }

  const hasFailures = queue.some((item) => item.status === 'failed');
  return hasFailures ? 'partial_failure' : 'idle';
}

export function syncStateLabel(state: SyncState): string {
  switch (state) {
    case 'idle':
      return 'Idle';
    case 'syncing':
      return 'Syncing';
    case 'partial_failure':
      return 'Partial Failure';
    default:
      return assertNever(state);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled SyncState: ${String(value)}`);
}
