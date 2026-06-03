import { useNavigate } from "react-router-dom";
import { ArrowLeft, Github, GitFork, Scale, Cpu } from "lucide-react";
import { useStickyHeader } from "@/hooks/useStickyHeader";

const VERSION = "1.0.0";

const TECH_STACK = [
  { label: "Runtime", value: "Bun" },
  { label: "Framework", value: "React 19" },
  { label: "Routing", value: "React Router v7" },
  { label: "Styling", value: "Tailwind CSS v4 + shadcn/ui" },
  { label: "State", value: "Zustand" },
  { label: "Storage", value: "IndexedDB" },
  { label: "Sync", value: "Yjs CRDT + y-webrtc" },
];

export default function AboutPage() {
  const stickyHeader = useStickyHeader();
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div className={`${stickyHeader} px-4 flex items-center gap-3 py-3`}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Tentang</h1>
      </div>
      <div className="px-4 pb-24">
        {/* Wordmark hero */}
        <div className="flex flex-col items-center gap-1.5 py-8">
          <img
            src="/icons/icon.svg"
            alt="Flowang"
            className="w-16 h-16 rounded-2xl shadow-lg mb-2"
            draggable={false}
          />
          <span
            aria-label="Flowang"
            className="select-none block text-7xl tracking-[-0.03em] font-light bg-gradient-to-br from-foreground/80 via-foreground/50 to-foreground/20 bg-clip-text text-transparent"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            flowang
          </span>
          <p className="text-xs text-muted-foreground/50 tabular-nums tracking-widest uppercase">
            v{VERSION}
          </p>
          <p className="text-xs text-muted-foreground/60 text-center max-w-[240px] leading-relaxed mt-1">
            Pencatat keuangan pribadi yang ringan, privat, dan bekerja penuh
            tanpa internet.
          </p>
        </div>

        <div className="space-y-6">
          {/* Creator & License */}
          <div className="rounded-xl border bg-card overflow-hidden">
            {/* Creator */}
            <a
              href="https://github.com/irsyadulibad"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted border-b"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Github className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Creator</p>
                <p className="text-xs text-muted-foreground">irsyadulibad</p>
              </div>
              <span className="text-xs text-muted-foreground/60">
                github.com
              </span>
            </a>

            {/* Repository */}
            <a
              href="https://github.com/irsyadlab/flowang"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted border-b"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <GitFork className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Repository</p>
                <p className="text-xs text-muted-foreground">
                  irsyadlab/flowang
                </p>
              </div>
              <span className="text-xs text-muted-foreground/60">
                github.com
              </span>
            </a>

            {/* License */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Scale className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">License</p>
                <p className="text-xs text-muted-foreground">MIT License</p>
              </div>
            </div>
          </div>

          {/* Tech stack */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Cpu className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-sm font-semibold">Tech Stack</p>
            </div>
            <div className="divide-y">
              {TECH_STACK.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-xs text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
