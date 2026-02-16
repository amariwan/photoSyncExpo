import * as Network from 'expo-network';

export interface NetworkGateResult {
  ok: boolean;
  reason?: string;
}

export async function checkNetworkAvailable(): Promise<NetworkGateResult> {
  const state = await Network.getNetworkStateAsync();
  const hasConnection = Boolean(state.isConnected || state.isInternetReachable);

  if (!hasConnection) {
    return {
      ok: false,
      reason: 'No network connection available.',
    };
  }

  return { ok: true };
}

export async function checkNetworkGate(wifiOnly: boolean): Promise<NetworkGateResult> {
  if (!wifiOnly) {
    return { ok: true };
  }

  const connectivityGate = await checkNetworkAvailable();

  if (!connectivityGate.ok) {
    return connectivityGate;
  }

  const state = await Network.getNetworkStateAsync();

  if (state.type !== Network.NetworkStateType.WIFI && state.type !== Network.NetworkStateType.ETHERNET) {
    return {
      ok: false,
      reason: `Wi-Fi only is enabled. Current network: ${state.type ?? 'UNKNOWN'}.`,
    };
  }

  return { ok: true };
}
