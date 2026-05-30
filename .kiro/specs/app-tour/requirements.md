# Requirements Document

## Introduction

Fitur **App Tour / Onboarding Tour** pada Flowang adalah panduan interaktif langkah-demi-langkah yang memperkenalkan pengguna baru kepada fitur-fitur utama aplikasi. Tour ditampilkan secara otomatis saat pertama kali pengguna membuka aplikasi, dan dapat dilewati atau dilanjutkan kapan saja. Implementasi menggunakan library `react-joyride` yang memenuhi standar WAI-ARIA dan mendukung navigasi keyboard penuh.

Tour mencakup 6 langkah yang menyoroti: Dashboard, tombol tambah transaksi, halaman Transaksi, halaman Laporan, halaman Wallet, dan halaman Kategori — sesuai dengan alur pengenalan fitur utama Flowang.

---

## Glossary

- **Tour**: Panduan interaktif langkah-demi-langkah yang menyoroti elemen-elemen UI utama aplikasi.
- **Tour_Controller**: Komponen React yang mengelola state, logika, dan rendering tour menggunakan `react-joyride`.
- **Tour_Step**: Satu langkah dalam tour yang terdiri dari target elemen UI, judul, dan konten penjelasan.
- **Tour_Status**: Status penyelesaian tour yang disimpan di localStorage (`completed`, `skipped`, atau tidak ada).
- **Tour_Storage**: Mekanisme penyimpanan status tour menggunakan `localStorage` browser.
- **Tour_Overlay**: Lapisan semi-transparan yang menutupi area di luar elemen yang sedang di-highlight.
- **Tour_Tooltip**: Kotak popup yang menampilkan judul, konten, dan kontrol navigasi untuk setiap langkah.
- **Spotlight**: Area yang di-highlight pada elemen UI target dalam setiap langkah tour.
- **Beacon**: Indikator visual berupa titik berdenyut yang menandai elemen yang dapat di-klik untuk memulai tour.
- **App**: Aplikasi Flowang secara keseluruhan.
- **Pengguna**: Individu yang menggunakan aplikasi Flowang melalui browser.

---

## Requirements

### Requirement 1: Tampilan Tour Pertama Kali

**User Story:** Sebagai pengguna baru, saya ingin melihat panduan interaktif saat pertama kali membuka aplikasi, agar saya dapat memahami fitur-fitur utama Flowang dengan cepat.

#### Acceptance Criteria

1. WHEN pengguna membuka App untuk pertama kali dan `Tour_Status` tidak ditemukan di `Tour_Storage`, THE `Tour_Controller` SHALL menampilkan tour secara otomatis setelah halaman Dashboard selesai dimuat.
2. WHEN `Tour_Controller` memulai tour, THE `Tour_Controller` SHALL menunda tampilan tour selama 500 milidetik setelah halaman selesai dirender untuk memastikan semua elemen UI tersedia; "halaman selesai dirender" didefinisikan sebagai kondisi ketika event `DOMContentLoaded` telah terpicu dan semua komponen React pada halaman Dashboard telah menyelesaikan render awal mereka.
3. WHEN pengguna membuka App dan `Tour_Status` bernilai `completed` atau `skipped` di `Tour_Storage`, THE `Tour_Controller` SHALL tidak menampilkan tour secara otomatis.
4. THE `Tour_Controller` SHALL menampilkan tour yang terdiri dari tepat 6 langkah berurutan yang menyoroti fitur-fitur utama App; THE `Tour_Controller` SHALL memvalidasi jumlah langkah sebelum memulai tour dan tidak menjalankan tour jika jumlah langkah tidak sama dengan 6.
5. WHEN tour sedang berjalan, THE `Tour_Overlay` SHALL menampilkan lapisan semi-transparan dengan opacity 0.5 di atas seluruh halaman kecuali pada area `Spotlight` elemen yang sedang di-highlight.
6. WHEN `Tour_Controller` berhasil memulai tour, THE `Tour_Controller` SHALL menyimpan `Tour_Status` bernilai `in_progress` ke `Tour_Storage`; IF penyimpanan gagal karena `localStorage` tidak tersedia atau penuh, THEN THE `Tour_Controller` SHALL tetap menjalankan tour tanpa menyimpan status.
7. WHEN elemen target pada langkah manapun tidak ditemukan di DOM setelah 500 milidetik sejak langkah dimulai, THE `Tour_Controller` SHALL melewati langkah tersebut dan berpindah ke langkah berikutnya secara otomatis.

---

### Requirement 2: Langkah-Langkah Tour

**User Story:** Sebagai pengguna baru, saya ingin setiap langkah tour menjelaskan fitur yang relevan dengan jelas, agar saya tahu fungsi setiap bagian aplikasi.

#### Acceptance Criteria

1. WHEN tour dimulai, THE `Tour_Controller` SHALL menampilkan langkah pertama sebagai modal terpusat di layar dengan judul sambutan dan penjelasan singkat tentang Flowang (maksimal 2 kalimat), tanpa menyoroti elemen spesifik.
2. WHEN tour berada pada langkah kedua, THE `Tour_Controller` SHALL menyoroti elemen Dashboard yang menampilkan total saldo, daftar wallet, serta ringkasan income dan expense bulan berjalan; IF elemen target tidak ditemukan atau gagal di-highlight dalam 3000 milidetik, THEN THE `Tour_Controller` SHALL melewati langkah tersebut dan berpindah ke langkah berikutnya secara otomatis.
3. WHEN tour berada pada langkah ketiga, THE `Tour_Controller` SHALL menyoroti tombol tambah transaksi dan menjelaskan cara mencatat transaksi baru (income, expense, atau transfer).
4. WHEN tour berada pada langkah keempat, THE `Tour_Controller` SHALL menyoroti tautan navigasi menuju halaman Transaksi (`/transactions`) dan menjelaskan fitur riwayat dan filter transaksi.
5. WHEN tour berada pada langkah kelima, THE `Tour_Controller` SHALL menyoroti tautan navigasi menuju halaman Laporan (`/reports`) dan menjelaskan fitur rekap keuangan dengan tab Realtime, Bulanan, dan Custom.
6. WHEN tour berada pada langkah keenam, THE `Tour_Controller` SHALL menyoroti tautan navigasi menuju halaman Wallet (`/wallets`) dan Kategori (`/categories`) serta menjelaskan cara mengelola keduanya.
7. THE `Tour_Tooltip` SHALL menampilkan judul singkat (maksimal 15 kata) dan deskripsi ringkas (maksimal 2 kalimat) pada setiap langkah.
8. WHEN elemen target pada langkah ketiga hingga keenam tidak ditemukan di DOM setelah 3000 milidetik sejak langkah dimulai, THE `Tour_Controller` SHALL melewati langkah tersebut dan berpindah ke langkah berikutnya secara otomatis.

---

### Requirement 3: Kontrol Navigasi Tour

**User Story:** Sebagai pengguna, saya ingin dapat mengontrol jalannya tour dengan tombol navigasi yang jelas, agar saya bisa maju, mundur, atau melewati tour sesuai keinginan.

#### Acceptance Criteria

1. WHERE tour sedang berjalan dan langkah saat ini bukan langkah terakhir, THE `Tour_Tooltip` SHALL menampilkan tombol "Lanjut" (Next) yang dapat diklik untuk berpindah ke langkah berikutnya.
2. WHEN tour berada pada langkah kedua atau lebih, THE `Tour_Tooltip` SHALL menampilkan tombol "Kembali" (Previous) yang dapat diklik untuk kembali ke langkah sebelumnya.
3. THE `Tour_Tooltip` SHALL menampilkan tombol "Lewati" (Skip) yang dapat diklik pada setiap langkah, termasuk langkah terakhir, untuk menutup tour sebelum selesai.
4. WHEN tour berada pada langkah terakhir (langkah ke-6), THE `Tour_Tooltip` SHALL menampilkan tombol "Selesai" (Finish) sebagai pengganti tombol "Lanjut".
5. WHEN tour berada pada langkah terakhir (langkah ke-6), THE `Tour_Tooltip` SHALL menyembunyikan tombol "Lanjut" sepenuhnya dari tampilan dan dari DOM.
6. THE `Tour_Tooltip` SHALL menampilkan indikator progres berupa teks "Langkah X dari 6" pada setiap langkah tour.
7. WHEN pengguna menekan tombol "Lewati" pada langkah manapun, THE `Tour_Controller` SHALL menutup tour dalam waktu kurang dari 300 milidetik dan menyimpan `Tour_Status` bernilai `skipped` ke `Tour_Storage`; IF penyimpanan ke `Tour_Storage` gagal, THEN THE `Tour_Controller` SHALL tetap menutup tour dan mencatat pesan error ke konsol browser.
8. WHEN pengguna menekan tombol "Selesai" pada langkah terakhir, THE `Tour_Controller` SHALL menutup tour dalam waktu kurang dari 300 milidetik dan menyimpan `Tour_Status` bernilai `completed` ke `Tour_Storage`; IF penyimpanan ke `Tour_Storage` gagal, THEN THE `Tour_Controller` SHALL tetap menutup tour dan mencatat pesan error ke konsol browser.

---

### Requirement 4: Penyimpanan Status Tour

**User Story:** Sebagai pengguna, saya ingin tour tidak muncul lagi setelah saya menyelesaikan atau melewatinya, agar saya tidak terganggu saat menggunakan aplikasi di sesi berikutnya.

#### Acceptance Criteria

1. WHEN pengguna menyelesaikan tour (menekan "Selesai" pada langkah terakhir), THE `Tour_Storage` SHALL menyimpan entri dengan kunci `flowang_tour_status` dan nilai `completed` di `localStorage` browser.
2. WHEN pengguna melewati tour (menekan "Lewati"), THE `Tour_Storage` SHALL menyimpan entri dengan kunci `flowang_tour_status` dan nilai `skipped` di `localStorage` browser.
3. WHEN `Tour_Storage` membaca kunci `flowang_tour_status` setelah penyimpanan dan nilai yang dibaca tidak sama persis dengan nilai yang disimpan, THE `Tour_Controller` SHALL memperlakukan kondisi tersebut sebagai tidak ada `Tour_Status` dan tidak menjalankan tour secara otomatis.
4. IF `Tour_Storage` mengalami korupsi data sehingga nilai yang dibaca tidak valid (bukan `completed`, `skipped`, atau `in_progress`), THEN THE `Tour_Controller` SHALL memperlakukan kondisi tersebut sebagai tidak ada `Tour_Status` dan tidak menjalankan tour secara otomatis.
5. WHEN pengguna membuka App pada sesi berikutnya dan `Tour_Storage` memiliki kunci `flowang_tour_status` dengan nilai `completed` atau `skipped`, THE `Tour_Controller` SHALL tidak menjalankan tour secara otomatis, terlepas dari cara App dibuka (oleh pengguna maupun secara programatik).
6. IF `localStorage` tidak tersedia di browser pengguna, THEN THE `Tour_Controller` SHALL tidak menampilkan tour; pencatatan pesan peringatan di konsol browser dilakukan sebagai upaya terbaik dan kegagalan pencatatan tidak boleh mempengaruhi keputusan untuk tidak menampilkan tour.

---

### Requirement 5: Kemampuan Dismiss dan Resume Tour

**User Story:** Sebagai pengguna, saya ingin bisa menghentikan tour di tengah jalan dan melanjutkannya nanti, agar saya tidak kehilangan progres saat perlu menggunakan aplikasi.

#### Acceptance Criteria

1. WHEN pengguna menekan tombol "Lewati" atau menekan tombol ESC saat tour berjalan, THE `Tour_Controller` SHALL menutup tour tanpa menghapus nomor langkah terakhir yang telah dicapai dari state React dalam memori sesi browser saat ini.
2. WHEN pengguna memilih opsi "Mulai Ulang Tour" dari antarmuka bantuan App, THE `Tour_Controller` SHALL menghapus `Tour_Status` dari `Tour_Storage` dan memulai tour dari langkah pertama; IF tour gagal dimulai setelah status dihapus, THEN THE `Tour_Controller` SHALL memulihkan nilai `Tour_Status` sebelumnya ke `Tour_Storage`.
3. WHERE `Tour_Status` di `Tour_Storage` bernilai `skipped` atau `in_progress`, THE App SHALL menampilkan opsi "Mulai Ulang Tour" di antarmuka bantuan sehingga pengguna dapat memulai kembali tour dari awal.
4. WHEN pengguna memilih opsi "Lanjutkan Tour" setelah sebelumnya menutup tour dengan "Lewati" atau ESC dalam sesi yang sama, THE `Tour_Controller` SHALL melanjutkan tour dari nomor langkah terakhir yang tersimpan di state React, bukan dari langkah pertama.

---

### Requirement 6: Aksesibilitas Tour

**User Story:** Sebagai pengguna dengan kebutuhan aksesibilitas, saya ingin dapat menggunakan tour sepenuhnya melalui keyboard dan screen reader, agar pengalaman onboarding saya setara dengan pengguna lain.

#### Acceptance Criteria

1. WHEN tour sedang berjalan, THE `Tour_Controller` SHALL memastikan fokus keyboard terjebak di dalam `Tour_Tooltip` sehingga pengguna tidak dapat berpindah ke elemen di luar tooltip menggunakan tombol Tab maupun Shift+Tab.
2. WHEN `Tour_Tooltip` pertama kali ditampilkan atau berpindah ke langkah baru, THE `Tour_Controller` SHALL memindahkan fokus keyboard ke elemen pertama yang dapat difokus di dalam `Tour_Tooltip` secara otomatis.
3. WHEN pengguna menekan tombol Tab saat tour berjalan, THE `Tour_Controller` SHALL memindahkan fokus secara berurutan maju di antara tombol-tombol kontrol yang tersedia di dalam `Tour_Tooltip`; WHEN pengguna menekan Shift+Tab, THE `Tour_Controller` SHALL memindahkan fokus secara berurutan mundur.
4. WHEN pengguna menekan tombol ESC saat tour berjalan, THE `Tour_Controller` SHALL menutup tour dengan perilaku yang sama seperti menekan tombol "Lewati".
5. WHEN pengguna menekan tombol panah kanan (→) atau Enter saat fokus berada di `Tour_Tooltip` dan tour tidak berada pada langkah terakhir, THE `Tour_Controller` SHALL berpindah ke langkah berikutnya; IF tour berada pada langkah terakhir, THEN THE `Tour_Controller` SHALL memperlakukan aksi tersebut sebagai menekan tombol "Selesai".
6. WHEN pengguna menekan tombol panah kiri (←) saat fokus berada di `Tour_Tooltip` dan tour berada pada langkah kedua atau lebih, THE `Tour_Controller` SHALL kembali ke langkah sebelumnya; IF tour berada pada langkah pertama, THEN THE `Tour_Controller` SHALL mengabaikan input tersebut tanpa efek apapun.
7. THE `Tour_Tooltip` SHALL memiliki atribut `role="dialog"`, `aria-modal="true"`, `aria-labelledby` yang merujuk ke id elemen judul langkah, dan `aria-describedby` yang merujuk ke id elemen konten langkah.
8. WHEN tour berpindah ke langkah baru (maju maupun mundur), THE `Tour_Controller` SHALL mengumumkan teks "Langkah X dari 6: [judul langkah]" kepada screen reader melalui elemen dengan atribut `aria-live="polite"`.
9. WHEN pengguna telah mengaktifkan preferensi `prefers-reduced-motion` di sistem operasi, THE `Tour_Controller` SHALL menonaktifkan semua animasi dan transisi pada `Tour_Overlay` dan `Tour_Tooltip`, dan menggunakan perubahan tampilan secara instan (durasi transisi 0 milidetik).
10. WHEN tour ditutup (baik melalui "Lewati", "Selesai", maupun ESC), THE `Tour_Controller` SHALL mengembalikan fokus keyboard ke elemen yang memiliki fokus sebelum tour dimulai.

---

### Requirement 7: Pengalaman Pengguna dan Non-Blocking

**User Story:** Sebagai pengguna, saya ingin dapat menggunakan aplikasi tanpa harus menyelesaikan tour terlebih dahulu, agar saya bebas mengeksplorasi aplikasi sesuai keinginan.

#### Acceptance Criteria

1. THE `Tour_Controller` SHALL tidak memblokir akses pengguna ke fitur-fitur App selama tour berlangsung — pengguna dapat menutup tour kapan saja dan langsung menggunakan aplikasi.
2. WHEN tour sedang berjalan dan pengguna menekan tombol "Lewati", THE App SHALL menampilkan halaman yang sedang aktif tanpa gangguan visual dalam waktu kurang dari 300 milidetik setelah tour ditutup; "tanpa gangguan visual" didefinisikan sebagai tidak adanya flash, flicker, atau perubahan layout yang tidak disengaja pada konten halaman.
3. THE `Tour_Tooltip` SHALL ditampilkan dengan posisi yang tidak menutupi elemen bottom navigation bar App; IF posisi default tooltip akan menutupi bottom navigation bar, THEN THE `Tour_Controller` SHALL memindahkan tooltip ke posisi di atas bottom navigation bar.
4. WHEN tour sedang berjalan pada perangkat dengan lebar layar kurang dari atau sama dengan 480 piksel, THE `Tour_Tooltip` SHALL menyesuaikan posisi dan ukurannya agar seluruh area tooltip berada di dalam batas viewport (tidak ada bagian yang terpotong).
5. THE `Tour_Controller` SHALL tidak memulai tour secara otomatis lebih dari satu kali per sesi browser; pembatasan ini hanya berlaku untuk tour yang dimulai secara otomatis, bukan untuk tour yang dimulai secara manual oleh pengguna melalui opsi "Mulai Ulang Tour" atau "Lanjutkan Tour".

---

### Requirement 8: Kompatibilitas Mobile-First

**User Story:** Sebagai pengguna yang mengakses Flowang dari smartphone, saya ingin tour dapat digunakan dengan nyaman di layar kecil, agar pengalaman onboarding saya optimal di perangkat mobile.

#### Acceptance Criteria

1. WHEN tour ditampilkan pada perangkat dengan lebar layar kurang dari atau sama dengan 480 piksel, THE `Tour_Tooltip` SHALL memiliki lebar maksimal 90% dari lebar viewport dan lebar minimal 280 piksel.
2. THE `Tour_Tooltip` SHALL menampilkan tombol-tombol kontrol (Kembali, Lanjut/Selesai, Lewati) dengan ukuran area sentuh minimal 44×44 piksel sesuai standar WCAG 2.5.5.
3. WHEN jarak antara tepi `Tour_Tooltip` dan tepi viewport kurang dari atau sama dengan 8 piksel pada sisi manapun, THE `Tour_Controller` SHALL secara otomatis menyesuaikan posisi tooltip agar jarak minimum 8 piksel dari semua tepi viewport terpenuhi.
4. IF tidak ada posisi yang memungkinkan tooltip memenuhi jarak minimum 8 piksel dari semua tepi viewport sambil tetap menampilkan panah/pointer yang menunjuk ke elemen target, THEN THE `Tour_Controller` SHALL memindahkan tooltip ke posisi yang memenuhi jarak minimum 8 piksel meskipun panah/pointer tooltip tidak dapat menunjuk langsung ke elemen target.
5. WHILE tour aktif, THE `Tour_Overlay` SHALL memiliki nilai `z-index` absolut minimal 10000 dan nilai tersebut SHALL lebih tinggi dari `z-index` bottom navigation bar App dengan selisih minimal 100.
