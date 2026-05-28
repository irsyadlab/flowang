# Requirements Document

## Introduction

Fitur Sinkronisasi Data Multi-Device memungkinkan pengguna Flowang menyinkronkan data keuangan mereka secara otomatis antar beberapa perangkat. Fitur ini menggunakan arsitektur hybrid zero-server-database: sinkronisasi real-time P2P via WebRTC + Yjs (CRDT) saat perangkat aktif bersamaan, dan Google Drive App Data sebagai cloud backup/persistence saat perangkat lain sedang offline. Seluruh data dienkripsi end-to-end menggunakan kunci yang di-generate lokal dan tidak pernah meninggalkan perangkat pengguna. Fitur ini diakses melalui halaman Settings baru yang dapat dijangkau dari Bottom Navigation.

---

## Glossary

- **Sync_Manager**: Modul utama yang mengkoordinasikan sinkronisasi data antara IndexedDB lokal, Yjs CRDT layer, dan Google Drive.
- **WebRTC_Provider**: Komponen yang mengelola koneksi WebRTC P2P antar perangkat menggunakan library y-webrtc.
- **Yjs_Doc**: Dokumen CRDT berbasis Yjs yang merepresentasikan state data Flowang (transaksi, wallet, kategori) yang dapat disinkronkan.
- **CRDT**: Conflict-free Replicated Data Type — struktur data yang memungkinkan merge otomatis tanpa konflik dari beberapa sumber perubahan secara bersamaan.
- **Sync_Room**: Ruang virtual P2P yang diidentifikasi oleh Room_Name unik; perangkat dalam room yang sama akan saling menyinkronkan data.
- **Room_Name**: String unik yang mengidentifikasi Sync_Room, di-generate secara lokal dan menjadi bagian dari Sync_Key.
- **Encryption_Key**: Kunci enkripsi simetris yang di-generate secara lokal di perangkat pertama, digunakan untuk mengenkripsi semua data sebelum dikirim via WebRTC maupun sebelum diupload ke Google Drive.
- **Sync_Key**: String konfigurasi yang mengandung Room_Name dan Encryption_Key, digunakan untuk menghubungkan perangkat ke Sync_Room yang sama.
- **QR_Code**: Representasi visual dari Sync_Key yang dapat dipindai oleh kamera perangkat lain untuk bergabung ke Sync_Room.
- **Signaling_Server**: Server perantara yang memfasilitasi negosiasi koneksi WebRTC awal antar perangkat (menggunakan y-webrtc signaling protocol); tidak menyimpan data pengguna.
- **STUN_Server**: Server yang membantu perangkat menemukan alamat IP publik mereka untuk memfasilitasi koneksi P2P.
- **TURN_Server**: Server relay yang meneruskan traffic WebRTC saat koneksi P2P langsung tidak memungkinkan (misalnya di balik NAT ketat).
- **Google_Drive_Provider**: Komponen yang mengelola autentikasi Google OAuth dan operasi backup/restore ke Google Drive App Data folder.
- **App_Data_Folder**: Folder tersembunyi di Google Drive milik pengguna yang hanya dapat diakses oleh aplikasi Flowang (scope `drive.appdata`); tidak terlihat oleh pengguna di Google Drive UI.
- **Incremental_Backup**: Mekanisme backup yang hanya menyimpan perubahan terbaru (delta) sejak backup terakhir, bukan seluruh dataset.
- **Sync_Status**: Status koneksi WebRTC saat ini: `disconnected`, `connecting`, atau `connected`.
- **Settings_Page**: Halaman baru `/settings` yang berisi konfigurasi sinkronisasi multi-device.
- **Sync_Indicator**: Indikator visual kecil di Bottom Navigation yang menampilkan Sync_Status secara real-time.
- **Bottom_Navigation**: Navigasi utama aplikasi yang terletak di bagian bawah layar (sudah ada, akan ditambah item Settings).
- **IndexedDB**: Penyimpanan lokal browser yang digunakan Flowang untuk menyimpan seluruh data keuangan.
- **Storage**: Lapisan persistensi data berbasis IndexedDB (mengacu pada definisi yang sama di requirements utama Flowang).

---

## Requirements

### Requirement 1: Halaman Settings

**User Story:** Sebagai pengguna, saya ingin mengakses halaman pengaturan sinkronisasi dari navigasi utama, sehingga saya dapat mengkonfigurasi dan memantau sinkronisasi data antar perangkat dengan mudah.

#### Acceptance Criteria

1. THE Bottom_Navigation SHALL menampilkan item navigasi "Pengaturan" dengan ikon Settings (gear) dari Lucide React sebagai item keenam.
2. WHEN pengguna menekan item "Pengaturan" di Bottom_Navigation, THE App SHALL mengarahkan pengguna ke Settings_Page di rute `/settings`.
3. THE Settings_Page SHALL dapat diakses melalui rute `/settings` dan dirender dalam layout utama aplikasi yang sama dengan halaman lain (termasuk Bottom_Navigation).
4. THE Settings_Page SHALL menampilkan section "Sinkronisasi Perangkat" yang berisi kontrol untuk setup koneksi WebRTC, indikator Sync_Status, dan kontrol Google Drive backup.
5. WHEN Settings_Page aktif, THE Bottom_Navigation SHALL menampilkan item "Pengaturan" dengan warna teks `text-primary`, latar belakang ikon `bg-primary/8`, dan opacity label penuh, konsisten dengan pola active state item navigasi lainnya.

---

### Requirement 2: Generate dan Tampilkan Sync Key

**User Story:** Sebagai pengguna yang ingin menghubungkan perangkat pertama, saya ingin mendapatkan Sync Key yang dapat dibagikan ke perangkat lain, sehingga perangkat-perangkat tersebut dapat bergabung ke Sync Room yang sama.

#### Acceptance Criteria

1. WHEN pengguna membuka Settings_Page dan Storage tidak mengandung Sync_Key, THE Sync_Manager SHALL men-generate Sync_Key baru yang mengandung Room_Name unik dan Encryption_Key secara lokal di perangkat tanpa mengirim data apapun ke server.
2. THE Sync_Manager SHALL menyimpan Sync_Key yang telah di-generate ke Storage lokal sehingga Sync_Key tetap sama setelah aplikasi ditutup dan dibuka kembali.
3. THE Settings_Page SHALL menampilkan QR_Code yang merepresentasikan Sync_Key saat ini, dengan ukuran minimal 200×200 piksel agar dapat dipindai dengan mudah.
4. THE Settings_Page SHALL menampilkan Sync_Key sebagai teks fallback di bawah QR_Code untuk pengguna yang tidak dapat menggunakan kamera.
5. WHILE Sync_Key dalam kondisi tersembunyi, THE Settings_Page SHALL menampilkan Sync_Key sebagai karakter `•` (bullet) untuk setiap karakter dan menyediakan tombol "Tampilkan" untuk mengungkapkan teks lengkapnya.
6. WHEN pengguna menekan tombol "Tampilkan" pada Sync_Key yang tersembunyi, THE Settings_Page SHALL menampilkan teks Sync_Key secara lengkap dan mengubah label tombol menjadi "Sembunyikan".
7. WHEN pengguna menekan tombol "Sembunyikan" pada Sync_Key yang terlihat, THE Settings_Page SHALL menyembunyikan kembali teks Sync_Key dengan karakter `•` dan mengubah label tombol menjadi "Tampilkan".
8. THE Settings_Page SHALL menyediakan tombol "Salin" yang menyalin Sync_Key ke clipboard perangkat dan menampilkan konfirmasi visual "Tersalin!" selama 2 detik.
9. THE Settings_Page SHALL menyediakan tombol "Reset Sync Key" yang memungkinkan pengguna men-generate ulang Sync_Key baru, dengan dialog konfirmasi sebelum eksekusi karena perangkat lain perlu di-pair ulang.

---

### Requirement 3: Scan QR Code untuk Bergabung ke Sync Room

**User Story:** Sebagai pengguna yang ingin menghubungkan perangkat kedua atau seterusnya, saya ingin memindai QR Code dari perangkat pertama, sehingga perangkat saya dapat bergabung ke Sync Room yang sama tanpa perlu mengetik Sync Key secara manual.

#### Acceptance Criteria

1. THE Settings_Page SHALL menyediakan tombol "Scan QR Code" yang mengaktifkan mode pemindaian menggunakan kamera perangkat.
2. WHEN pengguna menekan tombol "Scan QR Code", THE Settings_Page SHALL meminta izin akses kamera kepada pengguna melalui browser MediaDevices API sebelum mengaktifkan kamera.
3. IF pengguna menolak izin akses kamera, THEN THE Settings_Page SHALL menampilkan pesan bahwa izin kamera diperlukan untuk memindai QR Code dan menampilkan field input manual Sync_Key sebagai alternatif.
4. WHEN kamera aktif, THE Settings_Page SHALL menampilkan pratinjau kamera secara real-time dengan latensi tidak lebih dari 100 milidetik dan memindai QR_Code secara otomatis tanpa memerlukan tombol tambahan.
5. WHEN QR_Code berhasil dipindai dan mengandung Sync_Key yang valid (string base64url panjang 32–512 karakter yang dapat di-decode menjadi Room_Name dan Encryption_Key), THE Sync_Manager SHALL menyimpan Sync_Key tersebut ke Storage.
6. WHEN Sync_Key dari QR_Code berhasil disimpan, THE Sync_Manager SHALL menonaktifkan kamera dan memulai koneksi ke Sync_Room yang sesuai.
7. IF QR_Code yang dipindai tidak mengandung format Sync_Key yang valid, THEN THE Settings_Page SHALL menampilkan pesan error "QR Code tidak valid" dan melanjutkan pemindaian tanpa menutup kamera.
8. WHEN koneksi ke Sync_Room gagal setelah Sync_Key dari QR_Code disimpan, THE Settings_Page SHALL menampilkan pesan error bahwa koneksi gagal dan mempertahankan Sync_Key baru di Storage untuk percobaan ulang.
9. THE Settings_Page SHALL menyediakan tombol "Batal" untuk menutup mode pemindaian kamera, menonaktifkan kamera, dan kembali ke tampilan QR_Code milik perangkat saat ini.
10. THE Settings_Page SHALL menyediakan field input teks untuk memasukkan Sync_Key secara manual sebagai alternatif pemindaian QR Code, dengan tombol "Hubungkan" untuk memproses Sync_Key yang dimasukkan.
11. IF Sync_Key yang dimasukkan secara manual tidak memiliki format yang valid (bukan string base64url panjang 32–512 karakter), THEN THE Settings_Page SHALL menampilkan pesan validasi "Format Sync Key tidak valid" di bawah field input.

---

### Requirement 4: Indikator Status Koneksi WebRTC

**User Story:** Sebagai pengguna, saya ingin melihat status koneksi sinkronisasi secara real-time, sehingga saya tahu apakah data saya sedang disinkronkan atau tidak.

#### Acceptance Criteria

1. THE Settings_Page SHALL menampilkan indikator Sync_Status berupa status dot berukuran minimal 8×8 piksel beserta label teks yang mencerminkan kondisi koneksi WebRTC saat ini.
2. WHILE Sync_Status adalah `disconnected`, THE Settings_Page SHALL menampilkan status dot berwarna merah solid dengan label "Tidak Terhubung".
3. WHILE Sync_Status adalah `connecting`, THE Settings_Page SHALL menampilkan status dot berwarna kuning dengan animasi pulse berkedip pada frekuensi 1 Hz (1 kali per detik) dan label "Menghubungkan...".
4. WHILE Sync_Status adalah `connected`, THE Settings_Page SHALL menampilkan status dot berwarna hijau solid dengan label "Terhubung (Real-time)".
5. THE Bottom_Navigation SHALL menampilkan Sync_Indicator berupa status dot berukuran 6×6 piksel di sudut atas kanan ikon item "Pengaturan", dengan warna yang mencerminkan Sync_Status saat ini (merah/kuning/hijau), termasuk animasi pulse untuk status `connecting`.
6. WHEN Sync_Status berubah, THE Settings_Page dan THE Bottom_Navigation SHALL memperbarui tampilan indikator dalam waktu kurang dari 1 detik tanpa perlu reload halaman.
7. WHILE Sync_Status adalah `disconnected` dan Sync_Key sudah tersimpan di Storage, THE Settings_Page SHALL menampilkan tombol "Hubungkan" yang ketika ditekan mengubah Sync_Status menjadi `connecting` dan memulai percobaan koneksi WebRTC ke Sync_Room.

---

### Requirement 5: Konfigurasi Environment Variables

**User Story:** Sebagai developer yang men-deploy Flowang, saya ingin semua URL dan kredensial dikonfigurasi melalui environment variables, sehingga tidak ada nilai sensitif yang ter-hardcode di dalam kode sumber.

#### Acceptance Criteria

1. THE Sync_Manager SHALL membaca URL Signaling_Server dari environment variable `VITE_WEBRTC_SIGNALING_URL` dan menggunakannya sebagai endpoint koneksi y-webrtc; nilai ini tidak boleh di-hardcode di dalam kode sumber.
2. THE WebRTC_Provider SHALL membaca URL STUN_Server dari environment variable `VITE_STUN_URL` untuk konfigurasi ICE server WebRTC; nilai ini tidak boleh di-hardcode di dalam kode sumber.
3. THE WebRTC_Provider SHALL membaca URL TURN_Server dari `VITE_TURN_URL`, username dari `VITE_TURN_USERNAME`, dan credential dari `VITE_TURN_CREDENTIAL`; IF salah satu dari ketiga variabel TURN ini terdefinisi tetapi tidak semua terdefinisi, THEN THE App SHALL memperlakukannya sebagai konfigurasi TURN yang tidak valid dan menampilkan pesan error konfigurasi.
4. THE Google_Drive_Provider SHALL membaca Google OAuth Client ID dari `VITE_GOOGLE_CLIENT_ID` dan API Key dari `VITE_GOOGLE_API_KEY`; nilai-nilai ini tidak boleh di-hardcode di dalam kode sumber.
5. IF salah satu dari environment variable wajib (`VITE_WEBRTC_SIGNALING_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY`) tidak terdefinisi saat aplikasi dimuat, THEN THE App SHALL menampilkan halaman error fullscreen yang memblokir seluruh navigasi dan menampilkan daftar environment variable yang tidak terdefinisi, sehingga pengguna tidak dapat menggunakan aplikasi sebelum konfigurasi dilengkapi.
6. THE App SHALL menyertakan file `.env.example` di root proyek yang mendokumentasikan semua environment variable yang diperlukan beserta deskripsi dan nilai placeholder non-fungsional untuk setiap variabel.
7. IF `VITE_STUN_URL` tidak terdefinisi, THEN THE WebRTC_Provider SHALL melanjutkan inisialisasi tanpa konfigurasi STUN; IF semua variabel TURN tidak terdefinisi, THEN THE WebRTC_Provider SHALL melanjutkan inisialisasi tanpa konfigurasi TURN.

---

### Requirement 6: Sinkronisasi Real-time via WebRTC dan Yjs

**User Story:** Sebagai pengguna dengan beberapa perangkat aktif bersamaan, saya ingin perubahan data di satu perangkat langsung tersinkronkan ke perangkat lain, sehingga semua perangkat selalu menampilkan data keuangan yang sama.

#### Acceptance Criteria

1. WHILE Sync_Status adalah `connected`, THE Sync_Manager SHALL menyinkronkan setiap perubahan data (tambah, edit, hapus transaksi, wallet, atau kategori) ke semua perangkat lain dalam Sync_Room dalam waktu kurang dari 2 detik sejak perubahan terjadi.
2. WHEN perangkat lain dalam Sync_Room mengirimkan perubahan data, THE Sync_Manager SHALL menerapkan perubahan tersebut ke Yjs_Doc lokal menggunakan mekanisme CRDT sehingga konflik diselesaikan secara otomatis tanpa kehilangan data dari perangkat manapun.
3. WHEN Yjs_Doc menerima perubahan dari perangkat lain, THE Sync_Manager SHALL memperbarui IndexedDB lokal agar mencerminkan state terbaru dari Yjs_Doc.
4. WHEN IndexedDB lokal diperbarui oleh Sync_Manager, THE App SHALL memperbarui tampilan UI dalam waktu kurang dari 500 milidetik tanpa perlu reload halaman.
5. WHEN Sync_Manager akan mengirim data Yjs melalui WebRTC_Provider, THE Sync_Manager SHALL mengenkripsi data tersebut menggunakan Encryption_Key dari Sync_Key yang tersimpan sebelum pengiriman; IF proses enkripsi gagal, THEN THE Sync_Manager SHALL membatalkan pengiriman dan menampilkan pesan error di Settings_Page tanpa mengirim data dalam bentuk tidak terenkripsi.
6. WHEN Sync_Manager menerima data Yjs dari WebRTC_Provider, THE Sync_Manager SHALL mendekripsi data tersebut menggunakan Encryption_Key dari Sync_Key yang tersimpan sebelum menerapkannya ke Yjs_Doc lokal.
7. IF koneksi WebRTC terputus sementara dan kemudian terhubung kembali, THEN THE Sync_Manager SHALL melakukan sinkronisasi penuh (full sync) untuk menggabungkan semua perubahan yang terjadi selama offline menggunakan mekanisme CRDT.
8. THE Sync_Manager SHALL menghasilkan state akhir yang identik di semua perangkat dalam Sync_Room dalam waktu kurang dari 5 detik setelah semua perangkat menerima perubahan terakhir (confluence property), terlepas dari urutan perubahan yang dilakukan secara bersamaan.

---

### Requirement 7: Google Drive Backup dan Restore

**User Story:** Sebagai pengguna yang menggunakan perangkat baru atau perangkat yang sedang offline, saya ingin data keuangan saya tersimpan di Google Drive sebagai fallback, sehingga saya tidak kehilangan data meskipun tidak ada perangkat lain yang aktif.

#### Acceptance Criteria

1. WHEN pengguna belum terautentikasi dengan Google, THE Settings_Page SHALL menampilkan tombol "Login dengan Google" untuk mengaktifkan fitur Google Drive backup.
2. WHEN pengguna menekan tombol "Login dengan Google", THE Google_Drive_Provider SHALL memulai alur Google OAuth menggunakan scope `drive.appdata` untuk mendapatkan akses ke App_Data_Folder.
3. WHEN autentikasi Google berhasil, THE Settings_Page SHALL menampilkan nama dan email akun Google yang terhubung, serta mengganti tombol "Login dengan Google" dengan tombol "Logout Google".
4. WHEN pengguna menekan tombol "Logout Google", THE Google_Drive_Provider SHALL mencabut token akses Google jika memungkinkan, dan selalu menghapus informasi autentikasi dari Storage lokal terlepas dari keberhasilan pencabutan token.
5. WHEN terjadi perubahan data lokal dan pengguna sudah terautentikasi dengan Google, THE Google_Drive_Provider SHALL melakukan Incremental_Backup ke App_Data_Folder dalam waktu kurang dari 30 detik setelah perubahan terjadi.
6. WHEN pengguna membuka Flowang di perangkat yang memiliki nol record di seluruh IndexedDB store (wallets, transactions, categories) dan sudah terautentikasi dengan Google, THE Google_Drive_Provider SHALL memeriksa ketersediaan backup di App_Data_Folder dan menampilkan dialog tawaran restore kepada pengguna.
7. WHEN pengguna memilih untuk melakukan restore dari Google Drive, THE Google_Drive_Provider SHALL mengunduh data backup terbaru dari App_Data_Folder dan mendekripsinya menggunakan Encryption_Key dari Sync_Key yang tersimpan.
8. IF dekripsi data backup berhasil, THEN THE Google_Drive_Provider SHALL mengimpor data tersebut ke IndexedDB lokal dan memperbarui tampilan UI.
9. IF dekripsi data backup gagal (Encryption_Key tidak cocok), THEN THE Google_Drive_Provider SHALL menampilkan pesan error di Settings_Page bahwa restore gagal karena Sync Key tidak cocok dengan backup yang tersimpan.
10. THE Google_Drive_Provider SHALL mengenkripsi semua data menggunakan Encryption_Key dari Sync_Key sebelum diupload ke App_Data_Folder.
11. IF proses enkripsi gagal sebelum upload, THEN THE Google_Drive_Provider SHALL menampilkan pesan error di Settings_Page dan menghentikan semua percobaan backup hingga masalah diselesaikan.
12. IF upload backup ke Google Drive gagal, THEN THE Google_Drive_Provider SHALL mencoba ulang sebanyak maksimal 3 kali dengan interval 5 detik, dan menampilkan pesan peringatan di Settings_Page jika semua percobaan gagal.
13. WHEN upload backup ke Google Drive berhasil, THE Google_Drive_Provider SHALL menampilkan notifikasi "Backup berhasil" yang terlihat selama 3 detik dan memperbarui timestamp backup terakhir di Settings_Page.
14. IF download restore dari Google Drive gagal, THEN THE Google_Drive_Provider SHALL menampilkan pesan error di Settings_Page bahwa restore gagal dan menyarankan pengguna untuk mencoba lagi.
15. WHEN pengguna sudah terautentikasi dengan Google, THE Settings_Page SHALL menampilkan timestamp backup terakhir yang berhasil.

---

### Requirement 8: Keamanan dan Privasi Data

**User Story:** Sebagai pengguna, saya ingin data keuangan saya terlindungi secara kriptografis, sehingga tidak ada pihak ketiga — termasuk operator server — yang dapat membaca data saya.

#### Acceptance Criteria

1. WHEN Sync_Manager men-generate Encryption_Key, THE Sync_Manager SHALL menggunakan Web Crypto API dengan algoritma AES-256-GCM dan memverifikasi keberadaan Encryption_Key di Storage sebelum memulai operasi enkripsi apapun.
2. THE Sync_Manager SHALL memastikan Encryption_Key hanya tersimpan di Storage lokal perangkat dan tidak pernah dikirimkan ke Signaling_Server, STUN_Server, TURN_Server, maupun server lainnya.
3. WHEN Sync_Manager akan mengirim data Yjs melalui WebRTC_Provider, THE Sync_Manager SHALL mengenkripsi payload tersebut menggunakan Encryption_Key sehingga Signaling_Server dan TURN_Server tidak dapat membaca konten data pengguna.
4. THE Google_Drive_Provider SHALL mengenkripsi seluruh data menggunakan Encryption_Key sebelum diupload ke App_Data_Folder sehingga data yang tersimpan di Google Drive tidak dapat dibaca tanpa Encryption_Key.
5. IF Encryption_Key tidak tersedia di Storage lokal saat Sync_Manager mencoba mendekripsi data yang diterima, THEN THE Sync_Manager SHALL menolak data tersebut, mempertahankan Yjs_Doc lokal tanpa modifikasi, dan menampilkan pesan error di Settings_Page bahwa dekripsi gagal karena Sync Key tidak cocok.
6. WHEN Sync_Manager mendekripsi data yang diterima, THE Sync_Manager SHALL memverifikasi authentication tag AES-GCM dari data tersebut; IF verifikasi gagal, THEN THE Sync_Manager SHALL membuang data tersebut tanpa menerapkannya ke Yjs_Doc lokal.
7. WHEN pengguna melakukan reset Sync_Key, THE Sync_Manager SHALL men-generate Room_Name dan Encryption_Key baru, memutus koneksi dari Sync_Room lama, dan menampilkan pesan bahwa perangkat lain perlu di-pair ulang menggunakan Sync_Key baru.
8. WHEN pengguna melakukan reset Sync_Key dan terdapat backup di Google Drive yang dienkripsi dengan Encryption_Key lama, THE Settings_Page SHALL menampilkan peringatan bahwa backup lama tidak dapat didekripsi dengan Sync_Key baru dan menyarankan pengguna untuk melakukan backup ulang segera.

---

### Requirement 9: Penanganan Kondisi Jaringan dan Error

**User Story:** Sebagai pengguna dengan koneksi internet yang tidak stabil, saya ingin aplikasi tetap berfungsi normal saat offline dan menyinkronkan data secara otomatis saat koneksi pulih, sehingga saya tidak kehilangan data yang dicatat saat offline.

#### Acceptance Criteria

1. WHILE perangkat tidak memiliki koneksi internet, THE App SHALL memastikan operasi baca dan tulis data ke IndexedDB tetap berhasil dan tidak menampilkan modal atau dialog blocking yang mencegah pengguna menggunakan fitur utama aplikasi.
2. WHEN browser mendeteksi event `online` setelah periode offline, THE WebRTC_Provider SHALL secara otomatis mencoba menghubungkan kembali ke Signaling_Server dan Sync_Room tanpa memerlukan interaksi pengguna.
3. WHEN koneksi WebRTC berhasil dipulihkan setelah offline, THE Sync_Manager SHALL melakukan sinkronisasi semua perubahan yang terjadi selama offline menggunakan mekanisme CRDT Yjs.
4. IF koneksi ke Signaling_Server gagal, THEN THE WebRTC_Provider SHALL mencoba reconnect dengan interval backoff eksponensial (mulai dari 1 detik, maksimal 30 detik), mempertahankan Sync_Status sebagai `connecting`; IF reconnect gagal sebanyak 10 kali berturut-turut, THEN THE WebRTC_Provider SHALL mengubah Sync_Status menjadi `disconnected`.
5. IF koneksi P2P langsung tidak dapat dibuat dalam 10 detik, THEN THE WebRTC_Provider SHALL menggunakan TURN_Server sebagai relay; IF TURN_Server juga tidak dapat dihubungi, THEN THE WebRTC_Provider SHALL mengubah Sync_Status menjadi `disconnected` dan menampilkan pesan error di Settings_Page.
6. WHILE Sync_Key tersimpan di Storage dan Sync_Status adalah `disconnected`, THE Settings_Page SHALL menampilkan non-blocking banner yang menginformasikan bahwa data tersimpan lokal dan akan disinkronkan otomatis saat koneksi pulih.
