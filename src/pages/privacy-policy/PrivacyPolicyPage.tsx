import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Database,
  Lock,
  HardDrive,
  UserCog,
} from "lucide-react";

const LAST_UPDATED = "29 Mei 2026";

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "privacy-first",
    icon: ShieldCheck,
    title: "Prinsip Privacy-First",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Flowang dibangun dengan prinsip privacy-first. Tidak ada akun pengguna, tidak ada
          registrasi, dan tidak ada data yang dikirim ke server untuk fitur utama seperti
          pencatatan transaksi, pengelolaan wallet, dan pengelolaan kategori.
        </p>
        <p>
          Seluruh data keuangan pengguna — transaksi, wallet, kategori, dan catatan — disimpan
          secara eksklusif di IndexedDB pada perangkat lokal Anda. Data tidak pernah dikirim ke
          server manapun selama fitur sinkronisasi tidak diaktifkan.
        </p>
        <p>
          Aplikasi berfungsi penuh tanpa koneksi internet untuk fitur utama. Tidak ada cookie
          pelacak, tidak ada layanan analitik pihak ketiga, dan tidak ada iklan.
        </p>
      </div>
    ),
  },
  {
    id: "data-collected",
    icon: Database,
    title: "Data yang Dikumpulkan",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>Flowang tidak mengumpulkan data pribadi apa pun. Secara spesifik, kami tidak mengumpulkan:</p>
        <ul className="space-y-1.5 mt-1">
          {[
            "Nama pengguna",
            "Alamat email",
            "Nomor telepon",
            "Lokasi perangkat",
            "Informasi identitas pribadi lainnya",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p>
          Data keuangan Anda — jumlah transaksi, nama wallet, nama kategori, dan catatan transaksi —
          hanya tersimpan di penyimpanan lokal perangkat Anda dan tidak pernah dikirim ke server
          manapun selama fitur sinkronisasi tidak aktif.
        </p>
        <p>
          Data tersebut berada sepenuhnya di bawah kendali Anda dan tidak dapat dibaca oleh pihak
          manapun selain Anda sendiri.
        </p>
      </div>
    ),
  },
  {
    id: "e2e-encryption",
    icon: Lock,
    title: "Enkripsi End-to-End untuk Fitur Sinkronisasi",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Fitur sinkronisasi bersifat opsional dan hanya aktif jika Anda mengaktifkannya secara
          eksplisit melalui halaman Pengaturan. Fitur ini memungkinkan sinkronisasi data antar
          perangkat menggunakan WebRTC peer-to-peer dan Yjs CRDT.
        </p>
        <p>
          Kunci enkripsi di-generate secara lokal di perangkat Anda menggunakan algoritma{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">AES-256-GCM</code>{" "}
          melalui Web Crypto API. Kunci ini tidak pernah dikirimkan ke server manapun — hanya Anda
          yang memiliki akses ke kunci enkripsi.
        </p>
        <p>
          Seluruh data yang dikirim melalui WebRTC maupun yang diupload ke Google Drive dienkripsi
          menggunakan kunci enkripsi sebelum meninggalkan perangkat Anda. Tidak ada pihak ketiga —
          termasuk operator server — yang dapat membaca konten data tersebut.
        </p>
        <p>
          Signaling server hanya berperan memfasilitasi negosiasi koneksi WebRTC awal antar
          perangkat. Setelah koneksi berhasil dibuat, komunikasi berlangsung secara peer-to-peer
          langsung tanpa melewati server.
        </p>
      </div>
    ),
  },
  {
    id: "google-drive",
    icon: HardDrive,
    title: "Google Drive App Data",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Fitur backup Google Drive bersifat opsional dan hanya aktif jika Anda login dengan akun
          Google melalui halaman Pengaturan. Data backup disimpan di App Data Folder — folder
          tersembunyi di Google Drive yang hanya dapat diakses oleh aplikasi ini.
        </p>
        <p>
          Aplikasi hanya menggunakan scope{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">drive.appdata</code>{" "}
          yang membatasi akses hanya ke App Data Folder. Folder ini tidak terlihat di Google Drive
          UI Anda dan tidak dapat diakses oleh aplikasi lain.
        </p>
        <p>
          Seluruh data yang diupload sudah dienkripsi menggunakan kunci enkripsi lokal Anda sebelum
          upload, sehingga Google tidak dapat membaca konten data keuangan Anda.
        </p>
        <p>
          Anda dapat mencabut akses Google Drive kapan saja melalui halaman Pengaturan atau melalui
          pengaturan akun Google Anda.
        </p>
      </div>
    ),
  },
  {
    id: "user-control",
    icon: UserCog,
    title: "Kontrol dan Hak Pengguna atas Data",
    content: (
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
        <p>
          Anda memiliki kendali penuh atas data Anda. Karena seluruh data tersimpan di perangkat
          lokal Anda, tidak ada pihak lain yang dapat mengakses atau mengelola data Anda.
        </p>
        <p>
          Anda dapat menghapus seluruh data aplikasi dengan cara menghapus data situs (site data)
          melalui pengaturan browser Anda. Ini akan menghapus seluruh data IndexedDB secara
          permanen.
        </p>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive/90">
          <span className="font-semibold">Peringatan:</span> Menghapus data browser akan menghapus
          seluruh data keuangan secara permanen dan tidak dapat dipulihkan, kecuali Anda telah
          melakukan backup ke Google Drive sebelumnya.
        </div>
        <p>
          Karena Flowang tidak menyimpan salinan data di server manapun, tidak ada proses
          "penghapusan akun" yang perlu dilakukan — cukup hapus data browser.
        </p>
        <p>
          Jika Anda menggunakan fitur Google Drive backup, Anda dapat menghapus data backup dari
          App Data Folder dengan cara mencabut akses aplikasi melalui pengaturan akun Google Anda.
        </p>
      </div>
    ),
  },
];

export default function PrivacyPolicyPage() {
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
          <h1 className="text-lg font-semibold text-foreground leading-tight">Kebijakan Privasi</h1>
          <p className="text-xs text-muted-foreground">Terakhir diperbarui: {LAST_UPDATED}</p>
        </div>
      </div>

      {/* Hero banner */}
      <div className="mt-2 mb-6 rounded-xl border bg-primary/5 px-4 py-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Data Anda, Kendali Anda</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Flowang tidak pernah mengumpulkan atau menjual data pribadi Anda. Semua data tersimpan
            lokal di perangkat Anda.
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
