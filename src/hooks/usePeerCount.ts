/**
 * usePeerCount - tracks the number of other peers connected via WebRTC awareness.
 * Returns 0 when not connected or no peers present.
 */

import { useEffect, useState } from 'react';
import { getProvider } from '@/sync/webrtcProvider';
import { useSyncStore } from '@/sync/syncStore';

export function usePeerCount(): number {
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const [peerCount, setPeerCount] = useState(0);

  useEffect(() => {
    if (syncStatus !== 'connected') return;

    const provider = getProvider();
    if (!provider) return;

    const awareness = provider.awareness;

    const update = () => {
      // awareness.getStates() includes self, so subtract 1
      const count = Math.max(0, awareness.getStates().size - 1);
      setPeerCount(count);
    };

    // Set initial count — peers that announced before this hook subscribed
    update();

    awareness.on('change', update);

    // y-webrtc also emits 'peers' on the provider itself when the peer list
    // changes (separate from awareness). Subscribe to both so we don't miss
    // peers that connected just before the awareness listener was attached.
    provider.on('peers', update);

    return () => {
      awareness.off('change', update);
      provider.off('peers', update);
      setPeerCount(0);
    };
  }, [syncStatus]);

  return peerCount;
}
