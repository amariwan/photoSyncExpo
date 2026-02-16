import { isRunningInExpoGo } from 'expo';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

const BACKGROUND_TASK_NAME = 'photosync.background.sync';
const DEFAULT_MINIMUM_INTERVAL_SECONDS = 15 * 60;

/**
 * Function that performs a background photo sync.
 *
 * @returns A promise that resolves to the number of items successfully
 *          uploaded during this background sync run.
 */
type BackgroundSyncRunner = () => Promise<number>;

let backgroundSyncRunner: BackgroundSyncRunner | null = null;

function canUseBackgroundTasks(): boolean {
  return Platform.OS !== 'web' && !isRunningInExpoGo();
}

if (canUseBackgroundTasks() && !TaskManager.isTaskDefined(BACKGROUND_TASK_NAME)) {
  TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
    // expo-background-task only supports Success/Failed results (no NewData/NoData)
    if (!backgroundSyncRunner) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    try {
      await backgroundSyncRunner();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export function setBackgroundSyncRunner(
  runner: BackgroundSyncRunner | null
): void {
  backgroundSyncRunner = runner;
}

export async function syncBackgroundTaskRegistration(
  enabled: boolean,
  minimumIntervalSeconds: number = DEFAULT_MINIMUM_INTERVAL_SECONDS
): Promise<void> {
  if (!canUseBackgroundTasks()) {
    return;
  }

  const taskManagerAvailable = await TaskManager.isAvailableAsync();
  if (!taskManagerAvailable) {
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_TASK_NAME
  );

  if (!enabled) {
    if (isRegistered) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    }
    return;
  }

  if (!isRegistered) {
    // BackgroundTask.minimumInterval is expressed in minutes
    const minimumIntervalMinutes = Math.max(
      1,
      Math.ceil(minimumIntervalSeconds / 60)
    );

    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: minimumIntervalMinutes,
    });
  }
}
