/**
 * usePeerDevices - returns device info for all connected peers (excluding self).
 */

import { useEffect, useState } from 'react';
import { getProvider } from '@/sync/webrtcProvider';
import { useSyncStore } from '@/sync/syncStore';
import type { DeviceInfo } from '@/lib/deviceInfo';

export interface PeerDevice {
  clientId: number;
  device: DeviceInfo;
}

export function usePeerDevices(): PeerDevice[] {
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const [peers, setPeers] = useState<PeerDevice[]>([]);

  useEffect(() => {
    if (syncStatus !== 'connected') return;

    const provider = getProvider();
    if (!provider) return;

    const awareness = provider.awareness;

    const update = () => {
      const selfId = awareness.clientID;
      const result: PeerDevice[] = [];

      awareness.getStates().forEach((state, clientId) => {
        if (clientId === selfId) return;
        if (state.device) {
          result.push({ clientId, device: state.device as DeviceInfo });
        }
      });

      setPeers(result);
    };

    update();
    awareness.on('change', update);
    provider.on('peers', update);

    return () => {
      awareness.off('change', update);
      provider.off('peers', update);
    };
  }, [syncStatus]);

  return peers;
}
