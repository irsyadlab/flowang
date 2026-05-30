# Requirements Document

## Introduction

Fitur **Loan Repayment & Transaction Integration** adalah pengembangan lanjutan dari modul Loan Tracker pada aplikasi Flowang. Fitur ini menambahkan empat kapabilitas utama:

1. **Mekanisme pengembalian hutang/piutang** — Pengguna dapat mencatat pembayaran parsial maupun pelunasan penuh atas hutang atau piutang yang aktif, sehingga riwayat pengembalian terdokumentasi dengan jelas.
2. **Integrasi hutang/piutang ke transaksi** — Setiap pembuatan Loan_Entry dan setiap Repayment secara opsional dapat dicatat sebagai transaksi keuangan di wallet yang dipilih, sehingga aliran kas tercermin secara akurat.
3. **Laporan keuangan yang memperhitungkan hutang/piutang** — Halaman laporan (Reports) menyertakan ringkasan posisi hutang dan piutang aktif, serta dampak transaksi yang berasal dari hutang/piutang terhadap total arus kas.
4. **Kategori pada hutang/piutang** — Loan_Entry dan Repayment dapat diklasifikasikan menggunakan kategori yang sama dengan transaksi biasa, memungkinkan analisis pengeluaran/pemasukan yang lebih granular.

Fitur ini tetap mempertahankan prinsip offline-first: semua data disimpan di IndexedDB tanpa memerlukan koneksi internet.

---

## Glossary

- **Loan_Tracker**: Modul fitur pencatatan hutang-piutang dalam aplikasi Flowang
- **Loan_Entry**: Satu entri hutang atau piutang yang terkait dengan satu Contact
- **Repayment**: Satu catatan pembayaran/pengembalian atas sebuah Loan_Entry, baik parsial maupun penuh
- **Repayment_Form**: Form untuk mencatat Repayment pada sebuah Loan_Entry
- **Contact**: Orang yang terlibat dalam hubungan hutang-piutang dengan pengguna
- **Loan_Detail**: Halaman yang menampilkan daftar Loan_Entry dan Repayment untuk satu Contact tertentu
- **Direction**: Arah hutang — `lend` (pengguna meminjamkan uang ke Contact) atau `borrow` (pengguna meminjam uang dari Contact)
- **Status**: Status penyelesaian hutang — `active` (belum lunas) atau `settled` (sudah lunas)
- **Transaction**: Catatan aliran kas pada wallet (income/expense/transfer) yang sudah ada di sistem Flowang
- **Transaction_Integrator**: Komponen logika yang bertanggung jawab membuat Transaction dari Loan_Entry atau Repayment
- **Wallet**: Rekening/dompet pengguna yang sudah ada di sistem Flowang
- **Category**: Klasifikasi transaksi yang sudah ada di sistem Flowang (tipe: `income`, `expense`, atau `both`)
- **Report**: Halaman laporan keuangan Flowang yang menampilkan rekap arus kas
- **Loan_Report_Section**: Bagian dalam halaman Report yang menampilkan ringkasan posisi hutang-piutang aktif
- **Remaining_Amount**: Sisa jumlah hutang/piutang yang belum dilunasi, dihitung dari `amount` Loan_Entry dikurangi total Repayment yang sudah dicatat
- **Linked_Transaction**: Transaction yang dibuat secara otomatis oleh Transaction_Integrator sebagai hasil dari pembuatan Loan_Entry atau Repayment

---

## Requirements

### Requirement 1: Pencatatan Repayment (Pengembalian Hutang/Piutang)

**User Story:** Sebagai pengguna, saya ingin mencatat pembayaran atau pengembalian atas hutang/piutang yang aktif, agar saya bisa melacak berapa yang sudah dibayar dan berapa yang masih tersisa.

#### Acceptance Criteria

1. THE Loan_Detail SHALL menyediakan tombol "Catat Pembayaran" pada setiap Loan_Entry dengan status `active`
2. THE Repayment_Form SHALL menyediakan field: jumlah/amount (wajib, > 0), tanggal (wajib, default hari ini), note (opsional)
3. IF jumlah Repayment yang diisi kurang dari atau sama dengan nol, THEN THE Repayment_Form SHALL menampilkan pesan error "Jumlah harus lebih dari 0" dan mencegah penyimpanan
4. IF jumlah Repayment yang diisi melebihi Remaining_Amount dari Loan_Entry terkait, THEN THE Repayment_Form SHALL menampilkan pesan error "Jumlah melebihi sisa hutang/piutang" dan mencegah penyimpanan
5. WHEN pengguna menyimpan Repayment yang valid, THE Loan_Tracker SHALL menyimpan Repayment dan menampilkannya di Loan_Detail di bawah Loan_Entry yang bersangkutan
6. WHEN total jumlah semua Repayment pada sebuah Loan_Entry sama dengan amount Loan_Entry tersebut, THE Loan_Tracker SHALL secara otomatis mengubah status Loan_Entry menjadi `settled`
7. THE Loan_Detail SHALL menampilkan Remaining_Amount untuk setiap Loan_Entry `active` yang sudah memiliki setidaknya satu Repayment
8. WHEN pengguna memilih opsi hapus pada satu Repayment dan mengkonfirmasi, THE Loan_Tracker SHALL menghapus Repayment tersebut secara permanen; IF Loan_Entry terkait berstatus `settled` akibat Repayment yang dihapus, THEN THE Loan_Tracker SHALL mengubah status Loan_Entry kembali menjadi `active`

### Requirement 2: Integrasi Loan_Entry ke Transaksi

**User Story:** Sebagai pengguna, saya ingin pembuatan hutang/piutang baru secara opsional tercatat sebagai transaksi di wallet saya, agar aliran kas saya terdokumentasi secara lengkap.

#### Acceptance Criteria

1. THE Loan_Form SHALL menyediakan toggle opsional "Catat sebagai transaksi" yang secara default dalam keadaan nonaktif
2. WHERE toggle "Catat sebagai transaksi" diaktifkan, THE Loan_Form SHALL menampilkan field tambahan: Wallet (wajib, dipilih dari daftar Wallet yang ada) dan Kategori (wajib, dipilih dari daftar Category yang ada); WHILE toggle "Catat sebagai transaksi" nonaktif, THE Loan_Form SHALL menyembunyikan field Wallet dan Kategori tersebut
3. WHEN pengguna menyimpan Loan_Entry baru dengan toggle aktif dan Wallet dipilih, THE Transaction_Integrator SHALL membuat satu Linked_Transaction dengan ketentuan: tipe `income` jika direction `borrow` (uang masuk ke wallet), tipe `expense` jika direction `lend` (uang keluar dari wallet), amount sama dengan amount Loan_Entry, walletId sesuai Wallet yang dipilih, date sama dengan date Loan_Entry
4. WHEN Linked_Transaction berhasil dibuat, THE Transaction_Integrator SHALL memperbarui saldo Wallet yang terkait sesuai tipe transaksi yang dibuat
5. IF pembuatan Linked_Transaction gagal karena error IndexedDB, THEN THE Transaction_Integrator SHALL membatalkan (rollback) penyimpanan Loan_Entry dan menampilkan pesan error kepada pengguna; THE Loan_Tracker SHALL tidak menyimpan Loan_Entry maupun Linked_Transaction
6. THE Loan_Entry SHALL menyimpan referensi `linkedTransactionId` yang menunjuk ke Linked_Transaction terkait; IF tidak ada Linked_Transaction, THEN `linkedTransactionId` SHALL bernilai null
7. WHEN pengguna menghapus Loan_Entry yang memiliki Linked_Transaction, THE Loan_Tracker SHALL menghapus Linked_Transaction terkait secara atomik dan membalikkan efek saldo Wallet

### Requirement 3: Integrasi Repayment ke Transaksi

**User Story:** Sebagai pengguna, saya ingin pembayaran hutang/piutang secara opsional tercatat sebagai transaksi di wallet saya, agar arus kas dari pengembalian hutang juga terdokumentasi.

#### Acceptance Criteria

1. THE Repayment_Form SHALL menyediakan toggle opsional "Catat sebagai transaksi" yang secara default dalam keadaan nonaktif
2. WHERE toggle "Catat sebagai transaksi" diaktifkan, THE Repayment_Form SHALL menampilkan field tambahan: Wallet (wajib, dipilih dari daftar Wallet yang ada) dan Kategori (wajib, dipilih dari daftar Category yang ada); WHILE toggle "Catat sebagai transaksi" nonaktif, THE Repayment_Form SHALL menyembunyikan field Wallet dan Kategori tersebut
3. WHEN pengguna menyimpan Repayment dengan toggle aktif dan Wallet dipilih, THE Transaction_Integrator SHALL membuat satu Linked_Transaction dengan ketentuan: tipe `income` jika direction Loan_Entry adalah `lend` (uang kembali masuk ke wallet), tipe `expense` jika direction Loan_Entry adalah `borrow` (uang keluar dari wallet untuk membayar hutang), amount sama dengan amount Repayment, walletId sesuai Wallet yang dipilih, date sama dengan date Repayment
4. IF pembuatan Linked_Transaction untuk Repayment gagal karena error IndexedDB, THEN THE Transaction_Integrator SHALL membatalkan (rollback) penyimpanan Repayment dan menampilkan pesan error kepada pengguna
5. THE Repayment SHALL menyimpan referensi `linkedTransactionId` yang menunjuk ke Linked_Transaction terkait; IF tidak ada Linked_Transaction, THEN `linkedTransactionId` SHALL bernilai null
6. WHEN pengguna menghapus Repayment yang memiliki Linked_Transaction, THE Loan_Tracker SHALL menghapus Linked_Transaction terkait secara atomik dan membalikkan efek saldo Wallet; IF pembalikan saldo Wallet gagal karena error teknis, THEN THE Loan_Tracker SHALL membatalkan seluruh operasi penghapusan dan menampilkan pesan error kepada pengguna, sehingga Repayment dan Linked_Transaction tetap utuh

### Requirement 4: Kategori pada Loan_Entry dan Repayment

**User Story:** Sebagai pengguna, saya ingin mengklasifikasikan hutang/piutang dan pembayarannya menggunakan kategori, agar saya bisa menganalisis pola hutang-piutang saya berdasarkan kategori.

#### Acceptance Criteria

1. THE Loan_Form SHALL menyediakan field Kategori (opsional) yang menampilkan daftar Category dengan tipe `expense`, `income`, atau `both` dari sistem Flowang
2. THE Repayment_Form SHALL menyediakan field Kategori (opsional) yang menampilkan daftar Category dengan tipe `expense`, `income`, atau `both` dari sistem Flowang
3. THE Loan_Entry SHALL menyimpan field `categoryId` (opsional, FK → Category.id); IF `categoryId` diisi, THEN THE Loan_Tracker SHALL memvalidasi bahwa Category dengan id tersebut ada di penyimpanan
4. THE Repayment SHALL menyimpan field `categoryId` (opsional, FK → Category.id); IF `categoryId` diisi, THEN THE Loan_Tracker SHALL memvalidasi bahwa Category dengan id tersebut ada di penyimpanan
5. WHERE toggle "Catat sebagai transaksi" diaktifkan pada Loan_Form atau Repayment_Form, THE Transaction_Integrator SHALL menggunakan `categoryId` yang dipilih sebagai `categoryId` pada Linked_Transaction yang dibuat; IF toggle aktif namun Kategori belum dipilih, THEN THE Loan_Form atau Repayment_Form SHALL menampilkan pesan error "Kategori wajib diisi saat mencatat sebagai transaksi" dan mencegah penyimpanan
6. THE Loan_Detail SHALL menampilkan nama kategori pada setiap Loan_Entry dan Repayment yang memiliki kategori; WHEN Loan_Entry atau Repayment tidak memiliki kategori, THE Loan_Detail SHALL menampilkan teks placeholder "Tanpa kategori" pada kolom kategori

### Requirement 5: Laporan Keuangan Memperhitungkan Hutang/Piutang

**User Story:** Sebagai pengguna, saya ingin laporan keuangan saya mencerminkan posisi hutang-piutang aktif dan transaksi yang berasal dari hutang/piutang, agar saya mendapatkan gambaran keuangan yang lengkap.

#### Acceptance Criteria

1. THE Report SHALL menampilkan Loan_Report_Section yang berisi: total piutang aktif (sum Remaining_Amount semua Loan_Entry `active` dengan direction `lend`), total hutang aktif (sum Remaining_Amount semua Loan_Entry `active` dengan direction `borrow`), dan net posisi hutang-piutang (total piutang aktif − total hutang aktif)
2. THE Loan_Report_Section SHALL ditampilkan pada semua tab laporan (Realtime, Bulanan, Custom) sebagai bagian terpisah dari ringkasan arus kas; WHEN tidak ada Loan_Entry `active` sama sekali, THE Report SHALL menyembunyikan Loan_Report_Section sepenuhnya
3. THE Report SHALL menampilkan total Income, total Expense, dan saldo bersih yang sudah mencakup Linked_Transaction dari Loan_Entry dan Repayment (karena Linked_Transaction adalah Transaction biasa, maka sudah otomatis terhitung)
4. THE Loan_Report_Section pada tab Bulanan SHALL menampilkan data hutang-piutang aktif pada saat laporan dibuka (bukan snapshot historis per bulan), dengan keterangan bahwa data ini adalah posisi terkini
5. WHEN pengguna menekan item di Loan_Report_Section, THE Report SHALL mengarahkan pengguna ke halaman Loan_Detail Contact yang bersangkutan; IF navigasi gagal karena error teknis, THEN THE Report SHALL menampilkan pesan error dan mempersilakan pengguna mencoba kembali secara manual

### Requirement 6: Konsistensi Data dan Integritas Referensial

**User Story:** Sebagai pengguna, saya ingin data hutang, pembayaran, dan transaksi terkait selalu konsisten, agar tidak ada data yang "menggantung" atau tidak sinkron.

#### Acceptance Criteria

1. FOR ALL operasi yang melibatkan pembuatan atau penghapusan Loan_Entry beserta Linked_Transaction-nya, THE Transaction_Integrator SHALL mengeksekusi operasi tersebut dalam satu IndexedDB transaction agar bersifat atomik
2. FOR ALL operasi yang melibatkan pembuatan atau penghapusan Repayment beserta Linked_Transaction-nya, THE Transaction_Integrator SHALL mengeksekusi operasi tersebut dalam satu IndexedDB transaction agar bersifat atomik
3. WHEN Loan_Entry dihapus, THE Loan_Tracker SHALL menghapus semua Repayment yang terkait beserta semua Linked_Transaction dari Repayment tersebut secara atomik
4. IF Category yang digunakan oleh Loan_Entry atau Repayment dihapus dari sistem, THEN THE Loan_Tracker SHALL menetapkan `categoryId` pada Loan_Entry dan Repayment terkait menjadi null (cascade set null)
5. IF Wallet yang digunakan oleh Linked_Transaction dihapus dari sistem, THEN THE Loan_Tracker SHALL mencegah penghapusan Wallet tersebut dan menampilkan pesan error yang menyebutkan jumlah Linked_Transaction yang masih terkait

### Requirement 7: Persistensi Data Repayment (Offline-First)

**User Story:** Sebagai pengguna, saya ingin data pembayaran hutang tersimpan secara lokal di perangkat saya, agar data tetap ada meskipun browser ditutup atau tidak ada koneksi internet.

#### Acceptance Criteria

1. THE Loan_Tracker SHALL menyimpan semua data Repayment di IndexedDB menggunakan object store `loan_repayments` dengan field: `id` (UUID), `loanEntryId` (FK → LoanEntry.id), `amount` (number, > 0), `categoryId` (string, opsional), `linkedTransactionId` (string, opsional), `date` (YYYY-MM-DD), `note` (string, opsional), `createdAt` (ISO 8601), `updatedAt` (ISO 8601)
2. THE Loan_Tracker SHALL membuat index pada `loan_repayments` untuk field `loanEntryId`; IF inisialisasi database gagal karena alasan apapun (termasuk kegagalan pembuatan index, kegagalan upgrade schema, atau error IndexedDB lainnya), THEN THE Loan_Tracker SHALL menolak untuk beroperasi dan menampilkan pesan error kepada pengguna
3. THE Loan_Entry SHALL diperluas dengan field tambahan: `categoryId` (string, opsional), `linkedTransactionId` (string, opsional), `remainingAmount` (number, dihitung dari amount dikurangi total Repayment)
4. WHEN operasi simpan atau hapus Repayment gagal karena error IndexedDB, THE Loan_Tracker SHALL menampilkan pesan error kepada pengguna dan tidak mengubah state UI
