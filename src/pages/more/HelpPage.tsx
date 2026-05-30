import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  HelpCircle,
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  HandCoins,
  Wallet,
  Tag,
  Settings,
  RefreshCw,
  Smartphone,
} from "lucide-react";

const LAST_UPDATED = "31 Mei 2026";

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "getting-started",
    icon: Smartphone,
    title: "Memulai",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Flowang adalah aplikasi pencatat keuangan pribadi yang bekerja sepenuhnya di perangkat
          kamu — tanpa akun, tanpa registrasi, dan tanpa koneksi internet untuk fitur utama.
        </p>
        <p>
          Langkah pertama yang disarankan:
        </p>
        <ol className="space-y-1.5 mt-1 list-none">
          {[
            "Buat wallet di halaman Lainnya → Wallet",
            "Tambahkan kategori sesuai kebutuhanmu",
            "Mulai catat transaksi dari beranda atau halaman Transaksi",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary mt-0.5">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
        <p>
          Kamu juga bisa menjalankan ulang tur panduan kapan saja dari halaman Lainnya untuk
          melihat penjelasan setiap fitur secara interaktif.
        </p>
      </div>
    ),
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Beranda",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Beranda menampilkan ringkasan keuangan bulan ini — total saldo semua wallet, pemasukan,
          pengeluaran, dan persentase tabungan.
        </p>
        <ul className="space-y-1.5 mt-1">
          {[
            "Tap ikon mata untuk menyembunyikan semua angka saldo demi privasi",
            "Tap tombol \"Catat\" di pojok kanan atas untuk mencatat transaksi baru dengan cepat",
            "Scroll ke bawah untuk melihat daftar wallet dan transaksi terbaru",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "transactions",
    icon: ArrowLeftRight,
    title: "Transaksi",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Halaman Transaksi menampilkan semua transaksi yang sudah dicatat, difilter berdasarkan
          tanggal aktif.
        </p>
        <ul className="space-y-1.5 mt-1">
          {[
            "Gunakan tombol panah kiri/kanan untuk berpindah hari, atau tap tanggal di tengah untuk memilih tanggal tertentu",
            "Tap tombol Filter untuk menyaring berdasarkan wallet, kategori, atau tipe transaksi",
            "Tap tombol \"Tambah\" di pojok kanan bawah untuk mencatat transaksi baru",
            "Tipe transaksi: Keluar (pengeluaran), Masuk (pemasukan), Transfer (antar wallet)",
            "Tap transaksi yang sudah ada untuk mengedit atau menghapusnya",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "reports",
    icon: BarChart3,
    title: "Laporan",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Halaman Laporan menyediakan tiga jenis analisis keuangan:
        </p>
        <ul className="space-y-2 mt-1">
          {[
            {
              label: "Realtime",
              desc: "Ringkasan bulan berjalan — pemasukan, pengeluaran, saldo bersih, dan breakdown pengeluaran per kategori dalam bentuk pie chart.",
            },
            {
              label: "Bulanan",
              desc: "Tren 6 bulan terakhir dalam grafik batang. Tap salah satu bulan untuk melihat detail chart harian, breakdown per kategori, dan pengelompokan per judul transaksi.",
            },
            {
              label: "Custom",
              desc: "Pilih rentang tanggal bebas untuk melihat laporan periode tertentu.",
            },
          ].map((item) => (
            <li key={item.label} className="flex items-start gap-2 list-none">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
              <span>
                <span className="font-medium text-foreground">{item.label}</span>
                {" — "}
                {item.desc}
              </span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "loans",
    icon: HandCoins,
    title: "Hutang & Piutang",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Halaman Piutang membantu kamu melacak hutang dan piutang per kontak.
        </p>
        <ul className="space-y-1.5 mt-1">
          {[
            "Piutang: uang yang kamu pinjamkan ke orang lain",
            "Hutang: uang yang kamu pinjam dari orang lain",
            "Tap kontak untuk melihat detail semua entri dan riwayat pembayaran",
            "Tap ikon kartu kredit pada entri aktif untuk mencatat pembayaran sebagian",
            "Tap ikon centang untuk menandai entri sebagai lunas",
            "Aktifkan \"Catat sebagai transaksi\" saat membuat entri agar otomatis tercatat di riwayat transaksi",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "wallets",
    icon: Wallet,
    title: "Wallet",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Wallet adalah dompet virtual untuk memisahkan saldo — misalnya dompet tunai, rekening
          bank, atau tabungan.
        </p>
        <ul className="space-y-1.5 mt-1">
          {[
            "Buat beberapa wallet untuk memisahkan saldo sesuai kebutuhan",
            "Setiap transaksi harus dikaitkan dengan wallet tertentu",
            "Gunakan tipe Transfer untuk memindahkan saldo antar wallet",
            "Tap ikon mata untuk menyembunyikan saldo di halaman wallet",
            "Tap wallet untuk melihat detail dan riwayat transaksi wallet tersebut",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "categories",
    icon: Tag,
    title: "Kategori",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Kategori membantu mengelompokkan transaksi agar laporan lebih informatif.
        </p>
        <ul className="space-y-1.5 mt-1">
          {[
            "Buat kategori untuk pemasukan, pengeluaran, atau keduanya",
            "Kategori bisa dibuat langsung dari form transaksi tanpa perlu ke halaman Kategori",
            "Kategori default tidak bisa dihapus",
            "Hapus kategori kustom yang sudah tidak digunakan",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "settings",
    icon: Settings,
    title: "Pengaturan",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Halaman Pengaturan menyediakan opsi sinkronisasi, backup, dan tampilan.
        </p>
        <ul className="space-y-2 mt-1">
          {[
            {
              label: "Sync Key",
              desc: "Scan QR Code atau salin key untuk menghubungkan perangkat lain. Data akan tersinkronisasi secara real-time dan terenkripsi end-to-end.",
            },
            {
              label: "Google Drive Backup",
              desc: "Backup data terenkripsi ke Google Drive. Berguna untuk memulihkan data jika perangkat hilang atau data browser terhapus.",
            },
            {
              label: "Tema",
              desc: "Pilih tampilan terang, gelap, atau ikuti pengaturan sistem.",
            },
          ].map((item) => (
            <li key={item.label} className="flex items-start gap-2 list-none">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
              <span>
                <span className="font-medium text-foreground">{item.label}</span>
                {" — "}
                {item.desc}
              </span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "tour",
    icon: RefreshCw,
    title: "Tur Panduan",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Tur panduan interaktif akan muncul otomatis saat pertama kali membuka aplikasi. Tur ini
          akan memandu kamu menjelajahi setiap fitur utama secara berurutan.
        </p>
        <p>
          Kamu bisa menjalankan ulang tur kapan saja dari halaman Lainnya dengan menekan tombol
          "Mulai Ulang Tur". Tur akan dimulai dari beranda dan berjalan melalui semua halaman
          secara otomatis.
        </p>
        <p>
          Selama tur berjalan, gunakan tombol "Lanjut" untuk melanjutkan ke langkah berikutnya,
          "Kembali" untuk kembali ke langkah sebelumnya, atau "Lewati" untuk menutup tur.
        </p>
      </div>
    ),
  },
];

export default function HelpPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/more");
    }
  };

  return (
    <div className="px-4 pt-1 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 py-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali ke halaman sebelumnya"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-foreground leading-tight">Bantuan</h1>
          <p className="text-xs text-muted-foreground">Terakhir diperbarui: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Hero banner */}
      <div className="mt-2 mb-6 rounded-xl border bg-primary/5 px-4 py-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Panduan Penggunaan Flowang</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Temukan penjelasan lengkap setiap fitur di sini. Kamu juga bisa menjalankan tur
            panduan interaktif dari halaman Lainnya.
          </p>
        </div>
      </div>

      {/* Sections */}
      <main className="space-y-3">
        {sections.map((section) => (
          <div key={section.id} className="rounded-xl border bg-card">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <section.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
            </div>
            <div className="px-4 py-3.5">{section.content}</div>
          </div>
        ))}
      </main>
    </div>
  );
}
