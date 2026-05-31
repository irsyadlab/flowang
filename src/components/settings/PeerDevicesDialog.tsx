/**
 * PeerDevicesDialog - shows a list of connected peer devices with browser & OS info.
 */

import { Monitor, Smartphone, Tablet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { PeerDevice } from '@/hooks/usePeerDevices';

interface PeerDevicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peers: PeerDevice[];
}

function DeviceIcon({ os, isMobile }: { os: string; isMobile: boolean }) {
  if (os === 'iPad') return <Tablet className="h-4 w-4 text-primary" />;
  if (isMobile) return <Smartphone className="h-4 w-4 text-primary" />;
  return <Monitor className="h-4 w-4 text-primary" />;
}

export default function PeerDevicesDialog({
  open,
  onOpenChange,
  peers,
}: PeerDevicesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Perangkat Terhubung</DialogTitle>
          <DialogDescription>
            {peers.length} perangkat aktif dalam sesi sinkronisasi ini
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 space-y-2">
          {peers.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Tidak ada perangkat lain yang terhubung
            </p>
          ) : (
            peers.map(({ clientId, device }) => (
              <div
                key={clientId}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <DeviceIcon os={device.os} isMobile={device.isMobile} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{device.os}</p>
                  <p className="text-xs text-muted-foreground">{device.browser}</p>
                </div>
                <span className="ml-auto flex h-2 w-2 shrink-0 rounded-full bg-green-500" />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
