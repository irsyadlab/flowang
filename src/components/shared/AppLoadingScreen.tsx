/**
 * AppLoadingScreen - full-screen loading splash shown during DB initialization.
 * Features the app icon with a spinning border ring.
 */

export default function AppLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
      {/* Icon + spinner ring */}
      <div className="relative flex items-center justify-center">
        {/* Spinning border ring */}
        <div className="absolute h-20 w-20 animate-spin rounded-full border-[3px] border-border border-t-primary" />

        {/* App icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a2035] shadow-lg">
          <svg viewBox="0 0 512 512" className="h-9 w-9" aria-hidden="true">
            {/* Main F stem */}
            <rect x="148" y="128" width="52" height="256" rx="16" fill="#ffffff" />
            {/* Top bar of F */}
            <rect x="148" y="128" width="200" height="52" rx="16" fill="#ffffff" />
            {/* Middle bar of F */}
            <rect x="148" y="228" width="160" height="48" rx="16" fill="#ffffff" />
            {/* Accent dot */}
            <circle cx="370" cy="352" r="40" fill="#6c8cff" opacity="0.9" />
            <path
              d="M358 340 Q370 328 382 340 Q394 352 382 364 Q370 376 358 364 Q346 352 358 340Z"
              fill="#1a2035"
              opacity="0.5"
            />
          </svg>
        </div>
      </div>

      {/* App name */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-base font-semibold text-foreground tracking-wide">Flowang</p>
        <p className="text-xs text-muted-foreground">Memuat data...</p>
      </div>
    </div>
  );
}
