import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
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

// ─── helpers ────────────────────────────────────────────────────────────────

const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Parse YYYY-MM-DD → { y, m, d } without timezone shift */
function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

/** Build YYYY-MM-DD from local date parts */
function toYMD(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Format YYYY-MM-DD → "28 Mei 2026" */
export function formatDateID(ymd: string): string {
  const { y, m, d } = parseYMD(ymd);
  return `${d} ${MONTHS_ID[m - 1]} ${y}`;
}

/** Format YYYY-MM-DD → "Rab, 28 Mei" (short, for form rows) */
export function formatDateShortID(ymd: string): string {
  const { y, m, d } = parseYMD(ymd);
  const dow = new Date(y, m - 1, d).getDay();
  return `${DAYS_ID[dow]}, ${d} ${MONTHS_ID[m - 1].slice(0, 3)} ${y}`;
}

/** Days in a given month (1-indexed) */
function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

/** Day-of-week for the 1st of the month (0 = Sun) */
function firstDayOfWeek(y: number, m: number): number {
  return new Date(y, m - 1, 1).getDay();
}

// ─── Calendar grid ───────────────────────────────────────────────────────────

interface CalendarProps {
  value: string; // YYYY-MM-DD
  onChange: (ymd: string) => void;
}

function Calendar({ value, onChange }: CalendarProps) {
  const { y: selY, m: selM, d: selD } = parseYMD(value);
  const [viewY, setViewY] = useState(selY);
  const [viewM, setViewM] = useState(selM);

  const todayStr = (() => {
    const n = new Date();
    return toYMD(n.getFullYear(), n.getMonth() + 1, n.getDate());
  })();

  const totalDays = daysInMonth(viewY, viewM);
  const startDow = firstDayOfWeek(viewY, viewM);

  // Prev month fill
  const prevMonthDays = daysInMonth(
    viewM === 1 ? viewY - 1 : viewY,
    viewM === 1 ? 12 : viewM - 1
  );

  const prevMonth = () => {
    if (viewM === 1) { setViewY(y => y - 1); setViewM(12); }
    else setViewM(m => m - 1);
  };
  const nextMonth = () => {
    if (viewM === 12) { setViewY(y => y + 1); setViewM(1); }
    else setViewM(m => m + 1);
  };

  // Build 6×7 grid cells
  type Cell = { day: number; cur: boolean };
  const cells: Cell[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, cur: false });
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, cur: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, cur: false });
  }

  return (
    <div className="select-none">
      {/* Month / year navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-sm font-semibold text-foreground">
          {MONTHS_ID[viewM - 1]} {viewY}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_ID.map((d) => (
          <div
            key={d}
            className={cn(
              "text-center text-[11px] font-medium pb-2",
              d === "Min" ? "text-destructive/70" : "text-muted-foreground"
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          const cellYMD = cell.cur
            ? toYMD(viewY, viewM, cell.day)
            : cell.day <= 15
            ? toYMD(
                viewM === 12 ? viewY + 1 : viewY,
                viewM === 12 ? 1 : viewM + 1,
                cell.day
              )
            : toYMD(
                viewM === 1 ? viewY - 1 : viewY,
                viewM === 1 ? 12 : viewM - 1,
                cell.day
              );

          const isSelected = cell.cur && cellYMD === value;
          const isToday = cell.cur && cellYMD === todayStr;
          const isSunday = i % 7 === 0;

          return (
            <button
              key={i}
              type="button"
              disabled={!cell.cur}
              onClick={() => cell.cur && onChange(cellYMD)}
              className={cn(
                "relative mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-sm transition-all",
                !cell.cur && "pointer-events-none text-muted-foreground/25",
                cell.cur && !isSelected && !isToday && "hover:bg-muted",
                cell.cur && !isSelected && isSunday && "text-destructive/80",
                cell.cur && !isSelected && !isSunday && "text-foreground",
                isToday && !isSelected && "font-semibold text-primary ring-1 ring-primary/40",
                isSelected &&
                  "bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90"
              )}
            >
              {cell.day}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

interface DatePickerSheetProps {
  value: string; // YYYY-MM-DD
  onChange: (ymd: string) => void;
  /** Custom trigger element. If omitted, a default button is rendered. */
  trigger?: React.ReactNode;
  /** Extra class for the default trigger button */
  triggerClassName?: string;
  label?: string;
}

export function DatePickerSheet({
  value,
  onChange,
  trigger,
  triggerClassName,
  label,
}: DatePickerSheetProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();

  const handleSelect = (ymd: string) => {
    onChange(ymd);
    setOpen(false);
  };

  const defaultTrigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted",
        triggerClassName
      )}
    >
      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
      {formatDateID(value)}
    </button>
  );

  const calendarContent = (
    <>
      <Calendar value={value} onChange={handleSelect} />
      {/* Today shortcut */}
      <div className="mt-4 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => {
            const n = new Date();
            handleSelect(toYMD(n.getFullYear(), n.getMonth() + 1, n.getDate()));
          }}
          className="w-full rounded-xl border border-border bg-muted/50 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Hari Ini
        </button>
      </div>
    </>
  );

  const triggerEl = trigger ? (
    <div onClick={() => setOpen(true)} className="cursor-pointer flex-1 min-w-0">
      {trigger}
    </div>
  ) : (
    defaultTrigger
  );

  if (isDesktop) {
    return (
      <>
        {triggerEl}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{label ?? "Pilih Tanggal"}</DialogTitle>
            </DialogHeader>
            {calendarContent}
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
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
          <SheetHeader className="px-0 pb-4 pt-1">
            <SheetTitle className="text-base">
              {label ?? "Pilih Tanggal"}
            </SheetTitle>
          </SheetHeader>
          {calendarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
