import * as BackgroundFetch from "expo-background-fetch";
import { Platform } from "react-native";
import * as TaskManager from "expo-task-manager";

const BACKGROUND_TASK_NAME = "photosync.background.sync";
const DEFAULT_MINIMUM_INTERVAL_SECONDS = 15 * 60;

/**
 * Function that performs a background photo sync.
 *
 * @returns A promise that resolves to the number of items successfully
 *          uploaded during this background sync run.
 */
type BackgroundSyncRunner = () => Promise<number>;

let backgroundSyncRunner: BackgroundSyncRunner | null = null;

if (!TaskManager.isTaskDefined(BACKGROUND_TASK_NAME)) {
  TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
    if (!backgroundSyncRunner) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    try {
      const uploadedCount = await backgroundSyncRunner();
      return uploadedCount > 0
        ? BackgroundFetch.BackgroundFetchResult.NewData
        : BackgroundFetch.BackgroundFetchResult.NoData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
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
  if (Platform.OS === "web") {
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
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    }
    return;
  }

  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: Math.max(60, minimumIntervalSeconds),
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}
