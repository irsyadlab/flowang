/**
 * AboutCard - app identity section with elegant serif wordmark.
 */

export default function AboutCard() {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      {/* Wordmark */}
      <span
        aria-label="Flowang"
        className="select-none block text-5xl tracking-[-0.03em] font-light bg-gradient-to-br from-foreground/80 via-foreground/50 to-foreground/20 bg-clip-text text-transparent"
        style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
      >
        flowang
      </span>

      {/* Meta */}
      <div className="flex flex-col items-center gap-0.5">
        <p className="text-[11px] text-muted-foreground/50 tabular-nums tracking-widest uppercase">
          v0.1.0
        </p>
        <p className="text-[11px] text-muted-foreground/40 tracking-wide">
          by <span className="font-medium text-muted-foreground/60">irsyadulibad</span>
        </p>
      </div>
    </div>
  );
}
