# Requirements Document

## Introduction

Fitur ini menambahkan halaman Privacy Policy ke aplikasi Flowang. Halaman ini bersifat statis dan menjelaskan secara jujur dan transparan bagaimana aplikasi menangani data pengguna — menekankan bahwa Flowang adalah aplikasi privacy-first di mana semua data tersimpan lokal di perangkat pengguna menggunakan IndexedDB, tanpa server backend, tanpa akun, dan tanpa registrasi. Halaman ini juga menjelaskan aspek enkripsi end-to-end untuk fitur sinkronisasi opsional, penggunaan Google Drive App Data, dan peran Signaling Server WebRTC. Halaman dapat diakses dari halaman Lainnya (`/more`) dan mengikuti design system aplikasi yang sudah ada (mobile-first, Tailwind CSS v4, shadcn/ui).

---

## Glossary

- **Privacy_Policy_Page**: Halaman statis di rute `/privacy-policy` yang menampilkan kebijakan privasi Flowang.
- **App**: Aplikasi Flowang secara keseluruhan.
- **Halaman_Lainnya**: Halaman di rute `/more` yang berfungsi sebagai hub navigasi untuk Wallet, Kategori, Pengaturan, dan tautan lainnya.
- **Router**: Sistem routing React Router DOM yang mengelola navigasi antar halaman.
- **Bottom_Nav**: Komponen navigasi tetap di bagian bawah layar.
- **IndexedDB**: Mekanisme penyimpanan lokal browser yang digunakan Flowang untuk menyimpan seluruh data keuangan pengguna.
- **Storage**: Lapisan persistensi data berbasis IndexedDB di perangkat pengguna.
- **Sync_Feature**: Fitur sinkronisasi multi-device opsional yang menggunakan WebRTC P2P + Yjs CRDT dan Google Drive App Data.
- **Encryption_Key**: Kunci enkripsi AES-256-GCM yang di-generate secara lokal di perangkat pengguna dan tidak pernah meninggalkan perangkat.
- **Signaling_Server**: Server perantara yang memfasilitasi negosiasi koneksi WebRTC awal antar perangkat; tidak menyimpan data pengguna.
- **App_Data_Folder**: Folder tersembunyi di Google Drive milik pengguna yang hanya dapat diakses oleh aplikasi Flowang (scope `drive.appdata`); tidak terlihat di Google Drive UI.
- **WebRTC**: Teknologi komunikasi P2P (peer-to-peer) yang digunakan untuk sinkronisasi real-time antar perangkat.
- **CRDT**: Conflict-free Replicated Data Type — struktur data yang memungkinkan merge otomatis tanpa konflik dari beberapa sumber perubahan.
- **Design_System**: Sistem desain aplikasi Flowang yang menggunakan Tailwind CSS v4 dan shadcn/ui dengan pendekatan mobile-first.
- **MORE_PREFIXES**: Daftar prefix rute yang menyebabkan Nav_Item Lainnya tampil dalam Active_State, saat ini mencakup: `/more`, `/wallets`, `/categories`, `/settings`.

---

## Requirements

### Requirement 1: Rute dan Aksesibilitas Halaman

**User Story:** Sebagai pengguna, saya ingin dapat mengakses halaman Privacy Policy dari halaman Lainnya, sehingga saya dapat membaca kebijakan privasi aplikasi kapan saja.

#### Acceptance Criteria

1. THE Router SHALL mendaftarkan rute `/privacy-policy` sebagai child route di bawah `/` (AppLayout), sehingga Privacy_Policy_Page dirender di dalam layout utama aplikasi yang sama dengan halaman lain (termasuk Bottom_Nav).
2. THE Halaman_Lainnya SHALL menampilkan tautan navigasi ke `/privacy-policy` dengan label "Kebijakan Privasi" dan ikon `ShieldCheck` dari lucide-react.
3. WHEN pengguna mengetuk tautan "Kebijakan Privasi" di Halaman_Lainnya, THE Router SHALL menavigasi ke rute `/privacy-policy`.
4. WHEN Privacy_Policy_Page berhasil dirender dan ditampilkan kepada pengguna, THE Bottom_Nav SHALL menampilkan Nav_Item Lainnya dalam Active_State karena `/privacy-policy` termasuk dalam MORE_PREFIXES.
5. THE Privacy_Policy_Page SHALL menampilkan tombol atau tautan kembali yang ketika diaktifkan mengarahkan pengguna ke halaman sebelumnya dalam history navigasi; IF history navigasi tidak memiliki entri sebelumnya, THEN tombol tersebut SHALL mengarahkan pengguna ke `/more`.

---

### Requirement 2: Konten — Prinsip Privacy-First

**User Story:** Sebagai pengguna, saya ingin memahami bahwa Flowang tidak mengumpulkan data pribadi saya, sehingga saya dapat menggunakan aplikasi dengan tenang tanpa khawatir privasi saya dilanggar.

#### Acceptance Criteria

1. THE Privacy_Policy_Page SHALL menampilkan section yang menjelaskan bahwa Flowang adalah aplikasi privacy-first: tidak ada akun pengguna, tidak ada registrasi, tidak ada data yang dikirim ke server untuk fitur utama (pencatatan transaksi, pengelolaan wallet, pengelolaan kategori) — dengan Sync_Feature sebagai pengecualian opsional yang dijelaskan secara terpisah.
2. THE Privacy_Policy_Page SHALL menampilkan pernyataan eksplisit bahwa seluruh data keuangan pengguna (transaksi, wallet, kategori) disimpan secara eksklusif di Storage lokal perangkat pengguna menggunakan IndexedDB dan tidak pernah dikirimkan ke server manapun selama Sync_Feature tidak aktif.
3. THE Privacy_Policy_Page SHALL menampilkan pernyataan bahwa App tidak memerlukan koneksi internet untuk menjalankan fitur utama: pencatatan transaksi, pengelolaan wallet, dan pengelolaan kategori.
4. THE Privacy_Policy_Page SHALL menampilkan pernyataan bahwa App tidak menggunakan cookie pelacak, tidak mengintegrasikan layanan analitik pihak ketiga, dan tidak menampilkan iklan.

---

### Requirement 3: Konten — Data yang Dikumpulkan dan Tidak Dikumpulkan

**User Story:** Sebagai pengguna, saya ingin mengetahui secara spesifik data apa saja yang dikumpulkan atau tidak dikumpulkan oleh aplikasi, sehingga saya memiliki gambaran yang jelas tentang jejak data saya.

#### Acceptance Criteria

1. THE Privacy_Policy_Page SHALL menampilkan section yang secara eksplisit menyebutkan data yang tidak dikumpulkan oleh App, mencakup setidaknya: nama pengguna, alamat email, nomor telepon, lokasi perangkat, dan informasi identitas pribadi lainnya (daftar ini bersifat non-exhaustive dan semua item yang disebutkan harus hadir).
2. IF Sync_Feature tidak aktif, THEN THE Privacy_Policy_Page SHALL menampilkan pernyataan bahwa data keuangan pengguna (jumlah transaksi, nama wallet, nama kategori, catatan transaksi) hanya tersimpan di Storage lokal dan tidak pernah dikirim ke server App manapun.
3. THE Privacy_Policy_Page SHALL menampilkan pernyataan bahwa App tidak memiliki akses ke data yang tersimpan di Storage lokal perangkat pengguna — data tersebut berada sepenuhnya di bawah kendali pengguna dan tidak dapat dibaca oleh pihak manapun selain pengguna itu sendiri.
4. WHERE Sync_Feature diaktifkan oleh pengguna, THE Privacy_Policy_Page SHALL menampilkan penjelasan bahwa data yang disinkronkan dienkripsi end-to-end menggunakan Encryption_Key yang di-generate lokal sebelum meninggalkan perangkat, sehingga tidak ada pihak ketiga — termasuk operator server — yang dapat membaca konten data tersebut.

---

### Requirement 4: Konten — Enkripsi End-to-End untuk Fitur Sinkronisasi

**User Story:** Sebagai pengguna yang menggunakan fitur sinkronisasi, saya ingin memahami bagaimana data saya dilindungi selama proses sinkronisasi, sehingga saya dapat mempercayai bahwa data keuangan saya aman meskipun melewati server perantara.

#### Acceptance Criteria

1. THE Privacy_Policy_Page SHALL menampilkan section dengan heading yang dapat diidentifikasi yang menjelaskan bahwa Sync_Feature bersifat opsional dan hanya aktif jika pengguna secara eksplisit mengaktifkannya melalui halaman Pengaturan.
2. WITHIN section tersebut, THE Privacy_Policy_Page SHALL menampilkan penjelasan bahwa Encryption_Key di-generate secara lokal di perangkat pengguna menggunakan algoritma AES-256-GCM melalui Web Crypto API dan tidak pernah dikirimkan ke server manapun.
3. WITHIN section tersebut, THE Privacy_Policy_Page SHALL menampilkan pernyataan bahwa seluruh data yang dikirim melalui WebRTC maupun yang diupload ke Google Drive dienkripsi menggunakan Encryption_Key sebelum meninggalkan perangkat — bukan jaminan runtime, melainkan penjelasan tentang cara kerja sistem yang harus tertulis di halaman.
4. WITHIN section tersebut, THE Privacy_Policy_Page SHALL menampilkan penjelasan tentang peran Signaling_Server: hanya memfasilitasi negosiasi koneksi WebRTC awal (handshake) antar perangkat, tidak menyimpan data pengguna, dan tidak dapat membaca konten data yang dipertukarkan karena data sudah terenkripsi sebelum dikirim.
5. WITHIN section tersebut, THE Privacy_Policy_Page SHALL menampilkan penjelasan bahwa setelah koneksi WebRTC berhasil dibuat, komunikasi data berlangsung secara P2P langsung antar perangkat tanpa melewati Signaling_Server.

---

### Requirement 5: Konten — Google Drive App Data

**User Story:** Sebagai pengguna yang menggunakan fitur backup Google Drive, saya ingin memahami data apa yang disimpan di Google Drive dan bagaimana aksesnya dibatasi, sehingga saya dapat membuat keputusan yang tepat tentang penggunaan fitur ini.

#### Acceptance Criteria

1. THE Privacy_Policy_Page SHALL menampilkan section yang menjelaskan bahwa fitur Google Drive backup bersifat opsional dan hanya aktif jika pengguna secara eksplisit login dengan akun Google melalui halaman Pengaturan.
2. THE Privacy_Policy_Page SHALL menampilkan penjelasan bahwa App hanya menggunakan scope `drive.appdata` yang membatasi akses hanya ke App_Data_Folder — folder tersembunyi yang tidak terlihat di Google Drive UI pengguna dan tidak dapat diakses oleh aplikasi lain.
3. THE Privacy_Policy_Page SHALL menampilkan pernyataan bahwa seluruh data yang diupload ke App_Data_Folder sudah dienkripsi menggunakan Encryption_Key sebelum upload, sehingga Google tidak dapat membaca konten data keuangan pengguna.
4. THE Privacy_Policy_Page SHALL menampilkan penjelasan bahwa App tidak mengakses file Google Drive pengguna di luar App_Data_Folder dan tidak membaca, memodifikasi, atau menghapus file lain milik pengguna.
5. THE Privacy_Policy_Page SHALL menampilkan pernyataan bahwa pengguna dapat mencabut akses Google Drive kapan saja melalui halaman Pengaturan atau melalui pengaturan akun Google pengguna; WHEN pengguna mencabut akses melalui halaman Pengaturan, THE App SHALL menghapus token autentikasi Google dari Storage lokal dan menampilkan kembali tombol "Login dengan Google".

---

### Requirement 6: Konten — Kontrol dan Hak Pengguna atas Data

**User Story:** Sebagai pengguna, saya ingin mengetahui hak-hak saya atas data yang tersimpan di aplikasi, sehingga saya tahu cara mengelola atau menghapus data saya sepenuhnya.

#### Acceptance Criteria

1. THE Privacy_Policy_Page SHALL menampilkan section yang menjelaskan bahwa pengguna memiliki kendali penuh atas data lokal mereka karena data tersimpan di Storage perangkat pengguna sendiri.
2. THE Privacy_Policy_Page SHALL menampilkan penjelasan bahwa pengguna dapat menghapus seluruh data aplikasi dengan cara menghapus data situs (site data) melalui pengaturan browser, yang akan menghapus seluruh data IndexedDB secara permanen.
3. THE Privacy_Policy_Page SHALL menampilkan penjelasan bahwa menghapus data browser akan menghapus seluruh data keuangan secara permanen dan tidak dapat dipulihkan kecuali pengguna telah melakukan backup ke Google Drive sebelum menghapus data lokal.
4. THE Privacy_Policy_Page SHALL menampilkan pernyataan bahwa App tidak menyimpan salinan data pengguna di server manapun sehingga tidak ada proses "penghapusan akun" yang perlu dilakukan — pengguna cukup menghapus data browser.
5. THE Privacy_Policy_Page SHALL menampilkan penjelasan bahwa pengguna yang menggunakan fitur Google Drive backup dapat menghapus data backup dari App_Data_Folder dengan cara mencabut akses aplikasi melalui pengaturan akun Google, yang akan menghapus seluruh data yang tersimpan di App_Data_Folder.

---

### Requirement 7: Struktur dan Tampilan Halaman

**User Story:** Sebagai pengguna, saya ingin halaman Privacy Policy mudah dibaca dan konsisten dengan tampilan aplikasi, sehingga pengalaman membaca terasa nyaman dan tidak asing.

#### Acceptance Criteria

1. THE Privacy_Policy_Page SHALL menggunakan layout dan komponen dari Design_System yang konsisten dengan halaman lain di aplikasi (Tailwind CSS v4, shadcn/ui, warna dari CSS variables tema).
2. THE Privacy_Policy_Page SHALL menampilkan konten dengan lebar minimum 375px dan lebar maksimal 480px yang ditengahkan secara horizontal, konsisten dengan halaman lain di aplikasi.
3. THE Privacy_Policy_Page SHALL menampilkan judul halaman "Kebijakan Privasi" dan tanggal terakhir diperbarui dalam format DD Bulan YYYY (contoh: "1 Januari 2025") di bagian atas halaman.
4. THE Privacy_Policy_Page SHALL mengorganisasi konten dalam section-section di mana setiap section memiliki heading yang dirender sebagai elemen `<h2>` dan terlihat tanpa perlu scroll saat pengguna berada di bagian atas section tersebut.
5. THE Privacy_Policy_Page SHALL menggunakan tipografi dengan hierarki berikut: judul halaman menggunakan `text-xl font-bold`, heading section menggunakan `text-base font-semibold`, dan body text menggunakan minimal `text-sm` (14px).
6. THE Privacy_Policy_Page SHALL memastikan semua elemen teks memiliki kontras warna yang memenuhi standar WCAG 2.1 Level AA (rasio kontras minimal 4.5:1 untuk teks normal) dengan menggunakan CSS variables warna dari tema aplikasi.
7. THE Privacy_Policy_Page SHALL menerapkan padding bawah minimal `pb-24` (96px) pada konten agar tidak tertutup oleh Bottom_Nav.

---

### Requirement 8: Aksesibilitas Halaman

**User Story:** Sebagai pengguna dengan kebutuhan aksesibilitas, saya ingin halaman Privacy Policy dapat diakses menggunakan teknologi asistif, sehingga semua pengguna dapat membaca kebijakan privasi tanpa hambatan.

#### Acceptance Criteria

1. THE Privacy_Policy_Page SHALL menggunakan elemen HTML semantik yang tepat: `<main>` untuk konten utama, `<h1>` untuk judul halaman, `<h2>` untuk judul section, dan `<p>` untuk paragraf konten.
2. THE Privacy_Policy_Page SHALL memastikan tombol atau tautan kembali memiliki label teks atau atribut `aria-label` yang mengidentifikasi tujuan navigasi atau aksi secara spesifik (minimal satu kata yang bermakna, bukan label generik seperti "klik di sini").
3. THE Privacy_Policy_Page SHALL memastikan semua elemen interaktif (tombol kembali, tautan) dapat diakses dan diaktifkan menggunakan keyboard (Tab untuk fokus, Enter atau Space untuk aktivasi) dan menampilkan indikator fokus yang terlihat berupa outline minimal 2px saat elemen difokus.
4. THE Privacy_Policy_Page SHALL memastikan semua elemen interaktif yang diakses melalui sentuhan (tombol kembali, tautan) memiliki area sentuh minimal 44×44 piksel sesuai standar aksesibilitas WCAG 2.5.5; elemen yang secara primer diakses melalui keyboard atau screen reader dapat memiliki area sentuh lebih kecil selama memiliki label aksesibilitas yang memenuhi standar kriteria 2 di atas.
