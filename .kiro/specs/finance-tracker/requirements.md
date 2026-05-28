# Requirements Document

## Introduction

Flowang adalah aplikasi pencatatan keuangan personal berbasis web dengan pendekatan mobile-first dan offline-first. Aplikasi ini memungkinkan pengguna mencatat pendapatan, pengeluaran, dan transfer antar wallet secara lokal di perangkat tanpa memerlukan server backend atau koneksi internet. Semua data disimpan menggunakan IndexedDB di browser. Aplikasi dibangun dengan React, React Router, Tailwind CSS, shadcn/ui, Zustand, dan dijalankan dengan runtime Bun.

---

## Glossary

- **Flowang**: Nama aplikasi pencatatan keuangan personal ini.
- **App**: Aplikasi Flowang secara keseluruhan.
- **Transaction_Manager**: Modul yang menangani operasi CRUD transaksi dan pembaruan saldo wallet.
- **Wallet_Manager**: Modul yang menangani operasi CRUD wallet dan kalkulasi saldo.
- **Category_Manager**: Modul yang menangani operasi CRUD kategori transaksi.
- **Report_Engine**: Modul yang menghasilkan laporan dan rekap keuangan berdasarkan rentang tanggal.
- **Storage**: Lapisan persistensi data berbasis IndexedDB di browser.
- **Wallet**: Rekening atau dompet virtual yang dimiliki pengguna (contoh: Dompet Tunai, BCA, GoPay).
- **Transaction**: Catatan aktivitas keuangan bertipe Income, Expense, atau Transfer.
- **Category**: Label klasifikasi untuk transaksi Income atau Expense.
- **Income**: Tipe transaksi yang menambah saldo wallet.
- **Expense**: Tipe transaksi yang mengurangi saldo wallet.
- **Transfer**: Tipe transaksi yang memindahkan saldo dari satu wallet ke wallet lain.
- **Dashboard**: Halaman utama yang menampilkan ringkasan keuangan.
- **Transaction_Form**: Formulir untuk membuat atau mengedit transaksi.
- **Wallet_Form**: Formulir untuk membuat atau mengedit wallet.
- **Category_Form**: Formulir untuk membuat atau mengedit kategori.
- **Report_Page**: Halaman laporan dengan tiga tab: Realtime, Bulanan, dan Custom.
- **Bottom_Navigation**: Navigasi utama aplikasi yang terletak di bagian bawah layar.
- **Wallet_Detail_Page**: Halaman yang menampilkan informasi detail wallet beserta daftar transaksi yang terkait dengan wallet tersebut.
- **Balance_Correction**: Transaksi koreksi saldo yang dibuat otomatis oleh sistem ketika pengguna mengubah `initialBalance` wallet. Transaksi ini bersifat read-only dan tidak dapat diedit atau dihapus secara manual.

---

## Requirements

### Requirement 1: Inisialisasi Aplikasi dan Penyimpanan Lokal

**User Story:** Sebagai pengguna, saya ingin aplikasi siap digunakan segera setelah dibuka, sehingga saya dapat langsung mencatat transaksi tanpa konfigurasi tambahan.

#### Acceptance Criteria

1. WHEN pengguna membuka App, THE Storage SHALL menginisialisasi skema IndexedDB dengan store untuk Wallet, Transaction, dan Category dalam waktu kurang dari 5 detik sebelum operasi data apapun dijalankan.
2. WHEN pengguna membuka App dan Storage tidak mengandung data Category, THE App SHALL menyimpan tepat 9 kategori default: Makanan & Minuman, Transportasi, Belanja, Kesehatan, dan Hiburan (bertipe Expense); serta Gaji, Freelance, Investasi, dan Hadiah (bertipe Income).
3. THE App SHALL mendukung operasi buat, baca, perbarui, dan hapus (CRUD) pada store Wallet, Transaction, dan Category tanpa koneksi internet karena seluruh data disimpan di Storage lokal perangkat pengguna.
4. IF Storage gagal diinisialisasi dalam waktu 5 detik, THEN THE App SHALL menampilkan pesan error yang menjelaskan bahwa penyimpanan lokal tidak tersedia, menonaktifkan seluruh operasi data, dan menyembunyikan konten aplikasi.

---

### Requirement 2: Manajemen Wallet

**User Story:** Sebagai pengguna, saya ingin mengelola beberapa wallet/rekening, sehingga saya dapat memisahkan dan melacak saldo dari berbagai sumber keuangan.

#### Acceptance Criteria

1. THE Wallet_Manager SHALL memungkinkan pengguna membuat wallet baru dengan nama (maksimal 50 karakter) dan saldo awal yang bernilai nol atau positif.
2. WHEN pengguna membuat wallet baru, THE Wallet_Manager SHALL menyimpan wallet dengan field: id (UUID), name, initialBalance, balance, createdAt, dan updatedAt.
3. THE Wallet_Manager SHALL memungkinkan pengguna mengedit nama dan saldo awal wallet yang sudah ada.
4. WHEN pengguna mengedit saldo awal wallet, THE Wallet_Manager SHALL menghitung ulang saldo wallet berdasarkan saldo awal baru ditambah total seluruh transaksi yang terkait.
5. IF pengguna mencoba menghapus wallet yang masih memiliki transaksi terkait, THEN THE Wallet_Manager SHALL menolak penghapusan dan menampilkan pesan bahwa wallet tidak dapat dihapus karena masih memiliki transaksi.
6. WHEN pengguna memilih untuk menghapus wallet yang tidak memiliki transaksi, THE Wallet_Manager SHALL menampilkan dialog konfirmasi sebelum menghapus wallet dari Storage secara permanen.
7. THE Wallet_Manager SHALL menampilkan daftar semua wallet beserta saldo terkini masing-masing.
8. IF pengguna mengosongkan field nama wallet, THEN THE Wallet_Form SHALL menampilkan pesan validasi bahwa nama wallet wajib diisi.
9. IF pengguna mengisi nama wallet dengan nama yang sudah dimiliki wallet lain (perbandingan case-insensitive), THEN THE Wallet_Form SHALL menampilkan pesan validasi bahwa nama wallet sudah digunakan.
10. IF pengguna mengisi nama wallet dengan lebih dari 50 karakter, THEN THE Wallet_Form SHALL menampilkan pesan validasi bahwa nama wallet maksimal 50 karakter.
11. IF pengguna mengisi saldo awal wallet dengan nilai negatif, THEN THE Wallet_Form SHALL menampilkan pesan validasi bahwa saldo awal tidak boleh negatif.

---

### Requirement 3: Manajemen Kategori Transaksi

**User Story:** Sebagai pengguna, saya ingin membuat dan mengelola kategori transaksi, sehingga saya dapat mengklasifikasikan pengeluaran dan pendapatan sesuai kebutuhan saya.

#### Acceptance Criteria

1. WHEN pengguna mengisi form kategori baru, THE Category_Manager SHALL memungkinkan pengguna membuat kategori dengan nama (maksimal 50 karakter) dan tipe (income, expense, atau both).
2. WHEN pengguna mengisi form edit kategori, THE Category_Manager SHALL memungkinkan pengguna mengedit nama dan tipe kategori yang sudah ada.
3. IF pengguna mencoba menghapus kategori yang masih digunakan oleh transaksi, THEN THE Category_Manager SHALL menolak penghapusan dan menampilkan pesan bahwa kategori tidak dapat dihapus karena masih digunakan.
4. IF pengguna mencoba menghapus kategori default, THEN THE Category_Manager SHALL menolak penghapusan dan menampilkan pesan bahwa kategori default tidak dapat dihapus.
5. WHEN pengguna menghapus kategori yang tidak digunakan oleh transaksi apapun dan bukan kategori default, THE Category_Manager SHALL menghapus kategori dari Storage secara permanen.
6. THE Category_Manager SHALL menampilkan daftar semua kategori beserta tipe masing-masing.
7. IF pengguna mengosongkan field nama kategori, THEN THE Category_Form SHALL menampilkan pesan validasi bahwa nama kategori wajib diisi.
8. IF pengguna mengisi nama kategori dengan nama yang sudah dimiliki kategori lain dengan tipe yang sama (perbandingan case-insensitive), THEN THE Category_Form SHALL menampilkan pesan validasi bahwa nama kategori sudah digunakan untuk tipe tersebut.
9. IF pengguna mengisi nama kategori dengan lebih dari 50 karakter, THEN THE Category_Form SHALL menampilkan pesan validasi bahwa nama kategori maksimal 50 karakter.

---

### Requirement 4: Pencatatan Transaksi

**User Story:** Sebagai pengguna, saya ingin mencatat transaksi keuangan (pendapatan, pengeluaran, dan transfer), sehingga saya dapat melacak arus keuangan saya secara akurat.

#### Acceptance Criteria

1. THE Transaction_Manager SHALL mendukung tiga tipe transaksi: Income, Expense, dan Transfer.
2. WHEN pengguna menyimpan transaksi bertipe Income, THE Transaction_Manager SHALL menambah saldo wallet yang dipilih sebesar jumlah transaksi.
3. WHEN pengguna menyimpan transaksi bertipe Expense, THE Transaction_Manager SHALL mengurangi saldo wallet yang dipilih sebesar jumlah transaksi.
4. WHEN pengguna menyimpan transaksi bertipe Transfer, THE Transaction_Manager SHALL mengurangi saldo wallet sumber dan menambah saldo wallet tujuan sebesar jumlah transaksi secara atomik dalam satu operasi.
5. IF penyimpanan transaksi ke Storage gagal, THEN THE Transaction_Manager SHALL membatalkan seluruh perubahan saldo wallet sehingga tidak ada perubahan parsial yang tersimpan.
6. THE Transaction_Form SHALL memiliki field: tipe transaksi, jumlah, wallet (sumber), kategori, tanggal, dan catatan opsional.
7. WHEN pengguna memilih tipe Transfer pada Transaction_Form, THE Transaction_Form SHALL menampilkan field tambahan untuk wallet tujuan dan menyembunyikan field kategori.
8. IF pengguna mengisi jumlah transaksi dengan nilai nol atau negatif, THEN THE Transaction_Form SHALL menampilkan pesan validasi bahwa jumlah harus lebih dari nol.
9. IF pengguna mengisi jumlah transaksi dengan nilai lebih dari 999.999.999.999, THEN THE Transaction_Form SHALL menampilkan pesan validasi bahwa jumlah transaksi melebihi batas maksimum.
10. IF pengguna memilih wallet sumber dan wallet tujuan yang sama pada transaksi Transfer, THEN THE Transaction_Form SHALL menampilkan pesan validasi bahwa wallet sumber dan tujuan tidak boleh sama.
11. IF pengguna tidak memilih wallet pada Transaction_Form, THEN THE Transaction_Form SHALL menampilkan pesan validasi bahwa wallet wajib dipilih.
12. IF pengguna tidak memilih kategori pada transaksi Income atau Expense, THEN THE Transaction_Form SHALL menampilkan pesan validasi bahwa kategori wajib dipilih.
13. WHEN pengguna tidak mengisi tanggal transaksi, THE Transaction_Form SHALL menggunakan tanggal hari ini sebagai nilai default.
14. WHEN pengguna mengedit transaksi yang sudah ada, THE Transaction_Manager SHALL membalikkan efek saldo wallet dari transaksi lama terlebih dahulu, kemudian menerapkan efek saldo wallet dari transaksi baru secara atomik sehingga saldo wallet mencerminkan nilai yang benar.
15. WHEN pengguna mengedit transaksi bertipe Transfer, THE Transaction_Manager SHALL memperbarui saldo wallet sumber lama, wallet tujuan lama, wallet sumber baru, dan wallet tujuan baru secara akurat dalam satu operasi atomik.
16. WHEN pengguna memilih untuk menghapus transaksi, THE Transaction_Manager SHALL menampilkan dialog konfirmasi sebelum membalikkan efek saldo wallet dari transaksi tersebut dan menghapusnya dari Storage secara permanen.

---

### Requirement 5: Dashboard Ringkasan Keuangan

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan keuangan saya di halaman utama, sehingga saya dapat memantau kondisi keuangan secara sekilas.

#### Acceptance Criteria

1. THE Dashboard SHALL menampilkan total saldo keseluruhan yang merupakan penjumlahan saldo semua wallet yang dimiliki pengguna.
2. THE Dashboard SHALL menampilkan daftar semua wallet beserta saldo terkini masing-masing.
3. THE Dashboard SHALL menampilkan total Income dan total Expense pada bulan berjalan, dihitung dari tanggal 1 bulan kalender berjalan hingga hari ini, dengan mengecualikan transaksi bertipe Transfer dari perhitungan total Income maupun total Expense.
4. THE Dashboard SHALL menampilkan 5 transaksi terbaru berdasarkan tanggal transaksi secara descending.
5. WHEN pengguna menambah, mengedit, atau menghapus transaksi, THE Dashboard SHALL memperbarui semua nilai ringkasan secara otomatis tanpa perlu reload halaman.
6. WHEN tidak ada wallet yang tersimpan di Storage, THE Dashboard SHALL menampilkan pesan empty state yang menginformasikan pengguna untuk membuat wallet terlebih dahulu.
7. WHILE Storage sedang memuat data, THE Dashboard SHALL menampilkan indikator loading hingga data selesai dimuat.

---

### Requirement 6: Riwayat dan Filter Transaksi

**User Story:** Sebagai pengguna, saya ingin melihat dan memfilter riwayat transaksi, sehingga saya dapat menemukan transaksi tertentu dengan mudah.

#### Acceptance Criteria

1. THE Transaction_Manager SHALL menampilkan daftar seluruh transaksi yang diurutkan berdasarkan tanggal transaksi secara descending, dengan dukungan pagination atau virtual scroll untuk dataset yang melebihi 100 transaksi.
2. THE Transaction_Manager SHALL menyediakan filter berdasarkan wallet, kategori, tipe transaksi (Income/Expense/Transfer), dan rentang tanggal.
3. WHEN pengguna menerapkan satu atau lebih filter, THE Transaction_Manager SHALL menampilkan hanya transaksi yang memenuhi semua kriteria filter yang dipilih secara bersamaan (logika AND).
4. WHEN pengguna menghapus semua filter, THE Transaction_Manager SHALL menampilkan kembali seluruh daftar transaksi.
5. WHEN tidak ada transaksi yang memenuhi kriteria filter yang dipilih, THE Transaction_Manager SHALL menampilkan pesan empty state yang menginformasikan bahwa tidak ada transaksi yang sesuai dengan filter tersebut.
6. THE Transaction_Manager SHALL menampilkan jumlah total transaksi yang sedang ditampilkan setelah filter diterapkan.

---

### Requirement 7: Laporan Keuangan (Rekap)

**User Story:** Sebagai pengguna, saya ingin melihat laporan keuangan dalam berbagai rentang waktu, sehingga saya dapat menganalisis pola pengeluaran dan pendapatan saya.

#### Acceptance Criteria

1. THE Report_Page SHALL menyediakan tiga tab laporan: Realtime, Bulanan, dan Custom.
2. WHEN pengguna membuka tab Realtime, THE Report_Engine SHALL menampilkan rekap transaksi dari tanggal 1 bulan berjalan hingga hari ini, mencakup total Income, total Expense, dan saldo bersih (Income dikurangi Expense), dengan mengecualikan transaksi bertipe Transfer dari perhitungan total Income maupun total Expense.
3. WHEN pengguna membuka tab Bulanan, THE Report_Engine SHALL menampilkan daftar bulan-bulan yang memiliki transaksi tercatat diurutkan dari terbaru ke terlama, beserta total Income dan total Expense per bulan, dengan mengecualikan transaksi bertipe Transfer dari perhitungan total Income maupun total Expense.
4. WHEN pengguna membuka tab Custom, THE Report_Engine SHALL menampilkan form pemilihan rentang tanggal (tanggal mulai dan tanggal akhir).
5. WHEN pengguna memilih rentang tanggal pada tab Custom dan menekan tombol tampilkan, THE Report_Engine SHALL menampilkan rekap transaksi dalam rentang tersebut, mencakup total Income, total Expense, dan saldo bersih, dengan mengecualikan transaksi bertipe Transfer dari perhitungan total Income maupun total Expense.
6. IF pengguna mengisi tanggal mulai lebih besar dari tanggal akhir pada tab Custom, THEN THE Report_Engine SHALL menampilkan pesan validasi bahwa tanggal mulai tidak boleh lebih besar dari tanggal akhir.
7. WHEN tidak ada transaksi dalam rentang tanggal yang dipilih, THE Report_Engine SHALL menampilkan pesan bahwa tidak ada data transaksi untuk periode tersebut.
8. WHERE tanggal mulai sama dengan tanggal akhir pada tab Custom, THE Report_Engine SHALL menampilkan rekap transaksi untuk hari tersebut sebagai rentang yang valid.
9. IF Storage gagal membaca data transaksi, THEN THE Report_Engine SHALL menampilkan pesan error bahwa laporan tidak dapat dimuat dan menyarankan pengguna untuk memuat ulang halaman.

---

### Requirement 8: Navigasi dan Antarmuka Mobile-First

**User Story:** Sebagai pengguna yang mengakses dari smartphone, saya ingin antarmuka yang nyaman digunakan di layar kecil, sehingga saya dapat mencatat transaksi dengan cepat dan mudah.

#### Acceptance Criteria

1. THE App SHALL menggunakan Bottom_Navigation sebagai navigasi utama dengan menu: Dashboard, Transaksi, Laporan, Wallet, dan Kategori, dengan indikator visual yang membedakan menu yang sedang aktif dari menu lainnya.
2. THE App SHALL mengoptimalkan layout untuk lebar layar mulai dari 375px ke atas.
3. THE App SHALL memastikan semua elemen interaktif (tombol, input, link) memiliki area sentuh minimal 44×44 piksel sesuai standar aksesibilitas WCAG 2.5.5.
4. THE App SHALL tetap dapat digunakan pada layar desktop dengan layout yang responsif dan lebar konten maksimal 480px yang ditengahkan secara horizontal.
5. WHEN pengguna menekan tombol aksi utama (tambah transaksi), THE App SHALL mengarahkan pengguna ke Transaction_Form dalam waktu kurang dari 300 milidetik.
6. THE App SHALL mendukung navigasi menggunakan keyboard (Tab, Enter, Escape) untuk seluruh elemen interaktif pada tampilan desktop.
7. WHEN pengguna berpindah antar halaman melalui Bottom_Navigation, THE App SHALL menampilkan animasi transisi yang halus antar halaman.

---

### Requirement 9: Integritas dan Konsistensi Data

**User Story:** Sebagai pengguna, saya ingin data keuangan saya selalu akurat dan konsisten, sehingga saya dapat mempercayai informasi yang ditampilkan aplikasi.

#### Acceptance Criteria

1. WHEN pengguna melakukan operasi tulis (simpan, edit, atau hapus transaksi) dan operasi berhasil, THE Storage SHALL memastikan seluruh perubahan tersimpan secara atomik sehingga tidak ada perubahan parsial yang tersimpan.
2. IF salah satu bagian dari operasi tulis ke Storage gagal, THEN THE Storage SHALL membatalkan seluruh operasi dan mengembalikan data ke kondisi sebelum operasi dimulai.
3. WHEN pengguna menutup browser dan membuka kembali App, THE Storage SHALL memuat kembali seluruh data wallet, transaksi, dan kategori yang sebelumnya tersimpan sehingga jumlah record, seluruh field, dan nilai setiap field identik dengan data sebelum browser ditutup.
4. IF Storage tidak tersedia saat App dimuat ulang (misalnya IndexedDB diblokir atau dihapus oleh browser), THEN THE App SHALL menampilkan pesan error bahwa data tidak dapat dimuat dan menyarankan pengguna untuk memeriksa pengaturan browser.
5. THE Wallet_Manager SHALL memastikan saldo wallet selalu merupakan hasil kalkulasi dari saldo awal ditambah total seluruh transaksi Income, dikurangi total seluruh transaksi Expense, dikurangi total seluruh Transfer keluar, dan ditambah total seluruh Transfer masuk yang terkait dengan wallet tersebut.
6. FOR ALL transaksi yang disimpan ke Storage kemudian dibaca kembali, THE Storage SHALL menghasilkan data yang identik dengan data yang disimpan, mencakup seluruh field: id, type, amount, walletId, categoryId, date, note, createdAt, dan updatedAt (round-trip property).

---

### Requirement 10: Detail Wallet dan Riwayat Transaksi per Wallet

**User Story:** Sebagai pengguna, saya ingin melihat semua transaksi yang terkait dengan sebuah wallet ketika saya mengklik wallet tersebut, sehingga saya dapat memantau aktivitas keuangan per rekening secara terpisah.

#### Acceptance Criteria

1. WHEN pengguna mengklik wallet dari halaman Wallets atau Dashboard, THE App SHALL mengarahkan pengguna ke Wallet_Detail_Page untuk wallet tersebut.
2. THE Wallet_Detail_Page SHALL menampilkan nama wallet, saldo terkini, dan saldo awal wallet yang dipilih.
3. THE Wallet_Detail_Page SHALL menampilkan daftar semua transaksi yang terkait dengan wallet tersebut — mencakup transaksi di mana wallet menjadi sumber (walletId) maupun tujuan (toWalletId untuk Transfer) — diurutkan berdasarkan tanggal transaksi secara descending.
4. WHEN tidak ada transaksi yang terkait dengan wallet, THE Wallet_Detail_Page SHALL menampilkan pesan empty state.
5. THE Wallet_Detail_Page SHALL menampilkan total Income, total Expense, dan saldo bersih dari transaksi yang terkait dengan wallet tersebut, dengan mengecualikan transaksi bertipe Transfer dari perhitungan total Income maupun total Expense.
6. WHEN pengguna mengklik transaksi di Wallet_Detail_Page, THE App SHALL mengarahkan pengguna ke halaman edit transaksi tersebut.
7. THE Wallet_Detail_Page SHALL menyediakan tombol untuk menambah transaksi baru yang sudah pre-filled dengan wallet tersebut sebagai wallet sumber.
8. WHILE data transaksi sedang dimuat, THE Wallet_Detail_Page SHALL menampilkan indikator loading.

---

### Requirement 11: Koreksi Saldo Wallet

**User Story:** Sebagai pengguna, saya ingin perubahan saldo awal wallet tercatat sebagai transaksi koreksi secara otomatis, sehingga saya dapat melacak riwayat penyesuaian saldo dan audit trail tetap terjaga.

#### Acceptance Criteria

1. WHEN pengguna menyimpan perubahan `initialBalance` wallet dan nilai baru berbeda dari nilai lama, THE Wallet_Manager SHALL secara otomatis membuat satu transaksi Balance_Correction pada wallet tersebut dengan jumlah sebesar selisih absolut antara `initialBalance` baru dan `initialBalance` lama, tanpa memerlukan input tambahan dari pengguna.
2. WHEN selisih `initialBalance` baru dikurangi `initialBalance` lama bernilai positif, THE Wallet_Manager SHALL membuat Balance_Correction bertipe `adjustment_increase` yang menambah saldo wallet sebesar selisih tersebut.
3. WHEN selisih `initialBalance` baru dikurangi `initialBalance` lama bernilai negatif, THE Wallet_Manager SHALL membuat Balance_Correction bertipe `adjustment_decrease` yang mengurangi saldo wallet sebesar nilai absolut selisih tersebut.
4. THE Balance_Correction SHALL disimpan dengan field: id (UUID), type (`adjustment_increase` atau `adjustment_decrease`), amount (selisih absolut), walletId, date (tanggal hari ini), note otomatis berisi "Koreksi saldo: [nama wallet]", isCorrection: true, createdAt, updatedAt.
5. THE Balance_Correction SHALL ditampilkan dalam daftar transaksi (riwayat, wallet detail) dengan label "Koreksi Saldo" dan indikator visual yang membedakannya dari transaksi biasa.
6. THE Balance_Correction SHALL bersifat read-only — pengguna tidak dapat mengedit atau menghapus transaksi koreksi secara manual.
7. IF pengguna mencoba mengedit atau menghapus Balance_Correction, THEN THE Transaction_Manager SHALL menolak operasi tersebut dan menampilkan pesan bahwa transaksi koreksi tidak dapat diubah.
8. THE Balance_Correction SHALL dikecualikan dari perhitungan total Income dan total Expense di Dashboard, laporan Realtime, Bulanan, dan Custom.
9. WHEN pembuatan Balance_Correction gagal disimpan ke Storage, THEN THE Wallet_Manager SHALL membatalkan seluruh operasi edit wallet (termasuk perubahan `initialBalance`) sehingga tidak ada perubahan parsial yang tersimpan.
10. WHEN `initialBalance` wallet diubah ke nilai yang sama dengan nilai sebelumnya, THE Wallet_Manager SHALL tidak membuat Balance_Correction.
