import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const FORMBOLD_ACTION = "https://formbold.com/s/91mAa";

type Status = "idle" | "submitting" | "success" | "error";

const CATEGORIES = [
  { value: "Bug", label: "🐛 Bug" },
  { value: "Improvement", label: "✨ Improvement" },
  { value: "Fitur", label: "💡 Fitur" },
  { value: "Lainnya", label: "💬 Lainnya" },
];

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("idle");
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [subject, setSubject] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const data = new FormData(form);

    // Merge category into subject: [Bug] - subjeknya
    data.set("subject", `[${category}] - ${subject}`);

    try {
      const res = await fetch(FORMBOLD_ACTION, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      form.reset();
      setCategory(CATEGORIES[0].value);
      setSubject("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="px-4 pt-1 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Kirim Feedback</h1>
      </div>

      {status === "success" ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <p className="text-base font-semibold">Terima kasih!</p>
          <p className="text-sm text-muted-foreground max-w-[260px]">
            Feedback kamu sudah kami terima dan akan kami tinjau.
          </p>
          <Button variant="outline" className="mt-2" onClick={() => setStatus("idle")}>
            Kirim lagi
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-6">
            Ada saran, laporan bug, atau masukan? Ceritakan di sini.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                    category === cat.value
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{cat.label.split(" ")[0]}</span>
                  <span>{cat.label.split(" ")[1]}</span>
                </button>
              ))}
            </div>

            {/* Email + Subject */}
            <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="email@kamu.com"
                  required
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">Subjek</span>
                <div className="flex flex-1 items-center gap-1 min-w-0">
                  <span className="shrink-0 text-xs font-medium text-primary">[{category}]</span>
                  <input
                    type="text"
                    placeholder="Ringkasan singkat..."
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40 min-w-0"
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 pt-3 pb-1">
                <span className="text-xs font-medium text-muted-foreground">Pesan</span>
              </div>
              <textarea
                name="message"
                placeholder="Tulis feedback kamu di sini..."
                required
                rows={5}
                className="w-full bg-transparent px-4 pb-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 resize-none"
              />
            </div>

            {status === "error" && (
              <p className="text-xs text-destructive px-1">
                Gagal mengirim feedback. Coba lagi beberapa saat.
              </p>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={status === "submitting"}
            >
              <Send className="h-4 w-4" />
              {status === "submitting" ? "Mengirim..." : "Kirim Feedback"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
