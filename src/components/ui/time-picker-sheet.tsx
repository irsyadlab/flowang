/**
 * TimePickerSheet
 * - Mobile: bottom sheet
 * - Desktop: dialog
 * - Digital mode: scroll drum + manual text input
 * - Analog mode: interactive clock face SVG
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Responsive hook ──────────────────────────────────────────────────────────

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseHM(value: string): { h: number; m: number } {
  const [h, m] = value.split(":").map(Number);
  return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
}

function toHM(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatTimeDisplay(value: string): string {
  if (!value) return "";
  const { h, m } = parseHM(value);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ─── Drum Column ──────────────────────────────────────────────────────────────

const ITEM_H = 48;

interface DrumColumnProps {
  items: number[];
  value: number;
  onChange: (v: number) => void;
  label: string;
}

function DrumColumn({ items, value, onChange, label }: DrumColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el || isScrolling.current) return;
    const idx = items.indexOf(value);
    if (idx === -1) return;
    el.scrollTop = idx * ITEM_H;
  }, [value, items]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clamped] !== value) onChange(items[clamped]);
  }, [items, value, onChange]);

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: ITEM_H * 5 }}>
        {/* Selection band */}
        <div
          className="pointer-events-none absolute inset-x-2 z-10 rounded-xl bg-primary/10 border border-primary/20"
          style={{ top: ITEM_H * 2, height: ITEM_H }}
        />
        {/* Fade top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-background to-transparent" style={{ height: ITEM_H * 1.5 }} />
        {/* Fade bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background to-transparent" style={{ height: ITEM_H * 1.5 }} />

        <div
          ref={listRef}
          onScroll={handleScroll}
          className="h-full overflow-y-scroll"
          style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none" }}
        >
          {/* Top padding — 2 items */}
          <div style={{ height: ITEM_H * 2 }} />
          {items.map((item) => (
            <div
              key={item}
              onClick={() => {
                onChange(item);
                const el = listRef.current;
                if (el) {
                  const idx = items.indexOf(item);
                  el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
                }
              }}
              style={{ height: ITEM_H, scrollSnapAlign: "start" }}
              className={cn(
                "flex cursor-pointer items-center justify-center text-2xl font-bold tabular-nums transition-colors select-none",
                item === value
                  ? "text-primary"
                  : "text-muted-foreground/40 hover:text-muted-foreground"
              )}
            >
              {String(item).padStart(2, "0")}
            </div>
          ))}
          {/* Bottom padding — 2 items */}
          <div style={{ height: ITEM_H * 2 }} />
        </div>
      </div>
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

// ─── Digital Picker ───────────────────────────────────────────────────────────

interface DigitalPickerProps {
  value: string;
  onChange: (v: string) => void;
}

function DigitalPicker({ value, onChange }: DigitalPickerProps) {
  const { h, m } = parseHM(value);

  // Manual input state
  const [hInput, setHInput] = useState(String(h).padStart(2, "0"));
  const [mInput, setMInput] = useState(String(m).padStart(2, "0"));

  // Sync input when drum changes
  useEffect(() => { setHInput(String(h).padStart(2, "0")); }, [h]);
  useEffect(() => { setMInput(String(m).padStart(2, "0")); }, [m]);

  function commitH(raw: string) {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 0 && n <= 23) {
      onChange(toHM(n, m));
      setHInput(String(n).padStart(2, "0"));
    } else {
      setHInput(String(h).padStart(2, "0"));
    }
  }

  function commitM(raw: string) {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 0 && n <= 59) {
      onChange(toHM(h, n));
      setMInput(String(n).padStart(2, "0"));
    } else {
      setMInput(String(m).padStart(2, "0"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drums */}
      <div className="flex items-center gap-2 px-2">
        <DrumColumn items={HOURS} value={h} onChange={(v) => onChange(toHM(v, m))} label="Jam" />
        <span className="text-3xl font-bold text-muted-foreground/30 mt-6 shrink-0">:</span>
        <DrumColumn items={MINUTES} value={m} onChange={(v) => onChange(toHM(h, v))} label="Menit" />
      </div>

      {/* Manual input */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3">
        <span className="text-xs font-medium text-muted-foreground shrink-0">Ketik manual</span>
        <div className="flex items-center gap-1 ml-auto">
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={hInput}
            onChange={(e) => setHInput(e.target.value.replace(/\D/g, ""))}
            onBlur={(e) => commitH(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitH(hInput)}
            className="w-10 rounded-lg bg-background border border-border text-center text-sm font-bold tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 py-1"
          />
          <span className="text-sm font-bold text-muted-foreground">:</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={mInput}
            onChange={(e) => setMInput(e.target.value.replace(/\D/g, ""))}
            onBlur={(e) => commitM(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitM(mInput)}
            className="w-10 rounded-lg bg-background border border-border text-center text-sm font-bold tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 py-1"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Analog Clock ─────────────────────────────────────────────────────────────

type ClockMode = "hour" | "minute";

interface AnalogClockProps {
  value: string;
  onChange: (v: string) => void;
}

function AnalogClock({ value, onChange }: AnalogClockProps) {
  const { h, m } = parseHM(value);
  const [mode, setMode] = useState<ClockMode>("hour");
  const svgRef = useRef<SVGSVGElement>(null);

  const SIZE = 260;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const RADIUS = 100;
  const INNER_RADIUS = 68;

  function getAngle(clientX: number, clientY: number): number {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = clientX - rect.left - CX;
    const y = clientY - rect.top - CY;
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return angle;
  }

  function angleToHour(angle: number, inner: boolean): number {
    const raw = Math.round(angle / 30) % 12;
    const base = raw === 0 ? 12 : raw;
    return inner ? (base === 12 ? 0 : base + 12) : base;
  }

  function angleToMinute(angle: number): number {
    return Math.round(angle / 6) % 60;
  }

  function isInnerRadius(clientX: number, clientY: number): boolean {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = clientX - rect.left - CX;
    const y = clientY - rect.top - CY;
    return Math.sqrt(x * x + y * y) < (INNER_RADIUS + RADIUS) / 2;
  }

  function handlePointer(clientX: number, clientY: number, commit = false) {
    const angle = getAngle(clientX, clientY);
    if (mode === "hour") {
      const inner = isInnerRadius(clientX, clientY);
      const newH = angleToHour(angle, inner);
      onChange(toHM(newH, m));
      if (commit) setMode("minute");
    } else {
      onChange(toHM(h, angleToMinute(angle)));
    }
  }

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handlePointer(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => handlePointer(ev.clientX, ev.clientY);
    const onUp = (ev: MouseEvent) => {
      handlePointer(ev.clientX, ev.clientY, true);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    const onMove = (ev: TouchEvent) => handlePointer(ev.touches[0].clientX, ev.touches[0].clientY);
    const onEnd = (ev: TouchEvent) => {
      handlePointer(ev.changedTouches[0].clientX, ev.changedTouches[0].clientY, true);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  };

  const handAngle = mode === "hour" ? (h % 12) * 30 + m * 0.5 : m * 6;
  const handR = mode === "hour" ? (h >= 1 && h <= 12 ? RADIUS : INNER_RADIUS) : RADIUS;
  const handRad = (handAngle - 90) * (Math.PI / 180);
  const handX = CX + handR * Math.cos(handRad);
  const handY = CY + handR * Math.sin(handRad);

  function renderHourNumbers() {
    const nums = [];
    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = CX + RADIUS * Math.cos(angle);
      const y = CY + RADIUS * Math.sin(angle);
      const isSelected = h === i || (i === 12 && h === 12);
      nums.push(
        <text key={`o${i}`} x={x} y={y} textAnchor="middle" dominantBaseline="central"
          fontSize={13} fontWeight={isSelected ? "700" : "500"}
          style={{ fill: isSelected ? "var(--primary-foreground)" : "var(--foreground)", userSelect: "none" }}>
          {i}
        </text>
      );
    }
    for (let i = 0; i <= 11; i++) {
      const label = i === 0 ? "00" : String(i + 12);
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = CX + INNER_RADIUS * Math.cos(angle);
      const y = CY + INNER_RADIUS * Math.sin(angle);
      const val = i === 0 ? 0 : i + 12;
      const isSelected = h === val;
      nums.push(
        <text key={`i${i}`} x={x} y={y} textAnchor="middle" dominantBaseline="central"
          fontSize={11} fontWeight={isSelected ? "700" : "400"}
          style={{ fill: isSelected ? "var(--primary-foreground)" : "var(--muted-foreground)", userSelect: "none" }}>
          {label}
        </text>
      );
    }
    return nums;
  }

  function renderMinuteNumbers() {
    return Array.from({ length: 12 }, (_, i) => {
      const val = i * 5;
      const angle = (val * 6 - 90) * (Math.PI / 180);
      const x = CX + RADIUS * Math.cos(angle);
      const y = CY + RADIUS * Math.sin(angle);
      const isSelected = m === val;
      return (
        <text key={val} x={x} y={y} textAnchor="middle" dominantBaseline="central"
          fontSize={13} fontWeight={isSelected ? "700" : "500"}
          style={{ fill: isSelected ? "var(--primary-foreground)" : "var(--foreground)", userSelect: "none" }}>
          {String(val).padStart(2, "0")}
        </text>
      );
    });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Digital display / mode toggle */}
      <div className="flex items-center gap-1 rounded-2xl bg-muted/50 p-1">
        <button type="button" onClick={() => setMode("hour")}
          className={cn("rounded-xl px-5 py-2 text-2xl font-bold tabular-nums transition-colors",
            mode === "hour" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {String(h).padStart(2, "0")}
        </button>
        <span className="text-2xl font-bold text-muted-foreground/50">:</span>
        <button type="button" onClick={() => setMode("minute")}
          className={cn("rounded-xl px-5 py-2 text-2xl font-bold tabular-nums transition-colors",
            mode === "minute" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {String(m).padStart(2, "0")}
        </button>
      </div>

      <svg ref={svgRef} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
        onMouseDown={onMouseDown} onTouchStart={onTouchStart}
        className="cursor-pointer touch-none" style={{ userSelect: "none" }}>
        <circle cx={CX} cy={CY} r={SIZE / 2 - 4} style={{ fill: "var(--muted)" }} />
        {Array.from({ length: 60 }, (_, i) => {
          const angle = (i * 6 - 90) * (Math.PI / 180);
          const isMajor = i % 5 === 0;
          const r1 = SIZE / 2 - 4;
          const r2 = r1 - (isMajor ? 10 : 5);
          return <line key={i}
            x1={CX + r1 * Math.cos(angle)} y1={CY + r1 * Math.sin(angle)}
            x2={CX + r2 * Math.cos(angle)} y2={CY + r2 * Math.sin(angle)}
            style={{ stroke: "var(--border)" }} strokeWidth={isMajor ? 2 : 1} />;
        })}
        <line x1={CX} y1={CY} x2={handX} y2={handY}
          style={{ stroke: "var(--primary)" }} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={4} style={{ fill: "var(--primary)" }} />
        <circle cx={handX} cy={handY} r={18} style={{ fill: "var(--primary)" }} opacity={0.15} />
        <circle cx={handX} cy={handY} r={6} style={{ fill: "var(--primary)" }} />
        {mode === "hour" ? renderHourNumbers() : renderMinuteNumbers()}
      </svg>

      <p className="text-xs text-muted-foreground">
        {mode === "hour" ? "Pilih jam, lalu menit" : "Pilih menit"}
      </p>
    </div>
  );
}

// ─── Picker Content ───────────────────────────────────────────────────────────

type PickerMode = "digital" | "analog";

interface PickerContentProps {
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
}

function PickerContent({ value, onChange, onConfirm }: PickerContentProps) {
  const [mode, setMode] = useState<PickerMode>("digital");

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle — full width */}
      <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 w-full">
        <button type="button" onClick={() => setMode("digital")}
          className={cn("flex-1 rounded-lg px-5 py-1.5 text-xs font-semibold transition-colors",
            mode === "digital" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          Digital
        </button>
        <button type="button" onClick={() => setMode("analog")}
          className={cn("flex-1 rounded-lg px-5 py-1.5 text-xs font-semibold transition-colors",
            mode === "analog" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          Analog
        </button>
      </div>

      {mode === "digital"
        ? <DigitalPicker value={value} onChange={onChange} />
        : <AnalogClock value={value} onChange={onChange} />
      }

      <button type="button" onClick={onConfirm}
        className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80">
        Selesai
      </button>
    </div>
  );
}

// ─── Public Component ─────────────────────────────────────────────────────────

interface TimePickerSheetProps {
  value: string;
  onChange: (v: string) => void;
  trigger?: React.ReactNode;
  label?: string;
}

export function TimePickerSheet({ value, onChange, trigger, label = "Pilih Waktu" }: TimePickerSheetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "00:00");
  const isDesktop = useIsDesktop();

  const handleOpen = () => {
    setDraft(value || "00:00");
    setOpen(true);
  };

  const handleConfirm = () => {
    onChange(draft);
    setOpen(false);
  };

  const defaultTrigger = (
    <button type="button" onClick={handleOpen}
      className="flex h-8 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      {value ? formatTimeDisplay(value) : "Pilih jam"}
    </button>
  );

  const triggerEl = trigger
    ? <div onClick={handleOpen} className="cursor-pointer shrink-0">{trigger}</div>
    : defaultTrigger;

  const content = <PickerContent value={draft} onChange={setDraft} onConfirm={handleConfirm} />;

  if (isDesktop) {
    return (
      <>
        {triggerEl}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[340px] max-w-[340px] sm:max-w-[340px]">
            <DialogHeader>
              <DialogTitle>{label}</DialogTitle>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {triggerEl}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl pb-8 px-4 pt-0">
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
          <SheetHeader className="px-0 pb-4 pt-1">
            <SheetTitle className="text-base">{label}</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}
