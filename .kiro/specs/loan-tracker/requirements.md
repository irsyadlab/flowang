# Requirements Document

## Introduction

Fitur **Loan Tracker** (Pencatatan Hutang) adalah modul tambahan pada aplikasi Flowang yang memungkinkan pengguna mencatat hutang-piutang dengan orang lain. Berbeda dengan transaksi biasa, hutang memiliki dua arah: pengguna bisa *memberi hutang* (piutang — uang yang dipinjamkan ke orang lain) atau *menerima hutang* (hutang — uang yang dipinjam dari orang lain). Setiap hutang dikelompokkan berdasarkan nama orang yang terlibat, dan dapat ditandai lunas ketika sudah diselesaikan.

Fitur ini bersifat independen dari sistem transaksi utama — hutang tidak secara otomatis mempengaruhi saldo wallet, karena pencatatan hutang adalah aktivitas tersendiri yang tidak selalu berkorelasi langsung dengan aliran kas di wallet.

### Rekomendasi Arsitektur Data: Tabel Terpisah vs Tabel Bersama

Berdasarkan analisis terhadap struktur data yang ada, **direkomendasikan menggunakan object store (tabel) terpisah** untuk data hutang, dengan alasan berikut:

**Argumen untuk tabel terpisah (DIREKOMENDASIKAN):**
- Hutang memiliki field unik yang tidak relevan untuk transaksi biasa: `contactName`, `direction` (lend/borrow), `status` (active/settled), `settledAt`
- Hutang tidak mempengaruhi saldo wallet secara langsung — menyatukannya dengan transaksi akan memerlukan logika pengecualian yang kompleks di semua query saldo
- Query dan filter hutang (by contact, by status) berbeda dari query transaksi — tabel terpisah membuat query lebih bersih dan efisien
- Menghindari polusi pada object store `transactions` dengan data yang semantiknya berbeda
- Lebih mudah di-migrate atau dihapus di masa depan tanpa risiko merusak data transaksi

**Argumen untuk tabel bersama (TIDAK DIREKOMENDASIKAN):**
- Mengurangi jumlah object store di IndexedDB
- Bisa menampilkan hutang dan transaksi dalam satu timeline (tapi ini bisa dicapai dengan join di layer aplikasi)

**Kesimpulan:** Gunakan dua object store baru: `loan_contacts` (daftar orang) dan `loan_entries` (entri hutang per orang).

---

## Glossary

- **Loan_Tracker**: Modul fitur pencatatan hutang-piutang dalam aplikasi Flowang
- **Contact**: Orang yang terlibat dalam hubungan hutang-piutang dengan pengguna
- **Loan_Entry**: Satu entri hutang atau piutang yang terkait dengan satu Contact
- **Direction**: Arah hutang — `lend` (pengguna meminjamkan uang ke Contact) atau `borrow` (pengguna meminjam uang dari Contact)
- **Status**: Status penyelesaian hutang — `active` (belum lunas) atau `settled` (sudah lunas)
- **Contact_List**: Halaman yang menampilkan daftar semua Contact
- **Loan_Detail**: Halaman yang menampilkan daftar Loan_Entry untuk satu Contact tertentu
- **Loan_Form**: Form untuk membuat atau mengedit Loan_Entry
- **Mark_Settled**: Aksi untuk menandai satu atau semua Loan_Entry milik satu Contact sebagai lunas

---

## Requirements

### Requirement 1: Manajemen Contact

**User Story:** Sebagai pengguna, saya ingin mencatat nama orang yang terlibat dalam hutang-piutang, agar saya bisa mengelompokkan semua hutang berdasarkan orang tersebut.

#### Acceptance Criteria

1. THE Loan_Tracker SHALL menyimpan data Contact dengan field: `id` (UUID), `name` (string, wajib, maks 100 karakter), `note` (string, opsional), `createdAt` (ISO 8601), `updatedAt` (ISO 8601)
2. WHEN pengguna mengisi nama Contact dan menekan tombol simpan, THE Loan_Tracker SHALL membuat Contact baru dan menampilkannya di Contact_List
3. IF nama Contact yang diisi kosong atau hanya berisi spasi, THEN THE Loan_Form SHALL menampilkan pesan error "Nama tidak boleh kosong" dan mencegah penyimpanan
4. IF nama Contact yang diisi melebihi 100 karakter, THEN THE Loan_Form SHALL menampilkan pesan error "Nama maksimal 100 karakter" dan mencegah penyimpanan
5. THE Contact_List SHALL menampilkan setiap Contact beserta ringkasan: total hutang aktif (borrow), total piutang aktif (lend), dan status keseluruhan (ada hutang aktif atau semua lunas)
6. WHEN pengguna menekan nama Contact di Contact_List, THE Loan_Tracker SHALL menampilkan halaman Loan_Detail untuk Contact tersebut
7. WHILE Loan_Form menampilkan error validasi, THE Loan_Tracker SHALL mencegah navigasi ke halaman Loan_Detail

### Requirement 2: Pencatatan Loan Entry

**User Story:** Sebagai pengguna, saya ingin mencatat detail hutang atau piutang dengan seseorang, agar saya tahu berapa yang harus dibayar atau ditagih.

#### Acceptance Criteria

1. THE Loan_Form SHALL menyediakan field: Contact (wajib), jumlah/amount (wajib, > 0), direction (wajib: `lend` atau `borrow`), tanggal (wajib, default hari ini), note (opsional)
2. WHEN pengguna menyimpan Loan_Entry yang valid, THE Loan_Tracker SHALL menyimpan entri dengan status `active` dan menampilkannya di Loan_Detail Contact yang bersangkutan
3. IF jumlah yang diisi kurang dari atau sama dengan nol, THEN THE Loan_Form SHALL menampilkan pesan error "Jumlah harus lebih dari 0" dan mencegah penyimpanan
4. IF jumlah yang diisi melebihi 999.999.999.999, THEN THE Loan_Form SHALL menampilkan pesan error "Jumlah melebihi batas maksimum" dan mencegah penyimpanan
5. WHEN pengguna membuka Loan_Form untuk Contact yang sudah ada, THE Loan_Form SHALL menampilkan nama Contact tersebut sebagai nilai default pada field Contact
6. THE Loan_Detail SHALL menampilkan daftar Loan_Entry milik Contact tersebut, diurutkan berdasarkan tanggal terbaru di atas, dengan informasi: jumlah, direction (lend/borrow), tanggal, note, dan status (active/settled)

### Requirement 3: Mark Lunas (Settled)

**User Story:** Sebagai pengguna, saya ingin menandai hutang sebagai lunas, agar saya tahu hutang mana yang sudah selesai dan mana yang masih berjalan.

#### Acceptance Criteria

1. WHEN pengguna menekan tombol "Mark Lunas" pada satu Loan_Entry, THE Loan_Tracker SHALL mengubah status Loan_Entry tersebut menjadi `settled` dan mencatat `settledAt` dengan timestamp saat ini
2. WHEN semua Loan_Entry milik satu Contact berstatus `settled`, THE Contact_List SHALL menampilkan Contact tersebut dengan indikator visual "Lunas"
3. THE Loan_Detail SHALL menyediakan tombol "Tandai Semua Lunas" yang mengubah status semua Loan_Entry `active` milik Contact tersebut menjadi `settled` dalam satu operasi atomik
4. WHEN tidak ada Loan_Entry dengan status `active` milik Contact tersebut (baik karena semua sudah `settled` maupun belum ada entri sama sekali), THE Loan_Detail SHALL menonaktifkan (disable) tombol "Tandai Semua Lunas"
5. WHEN pengguna menekan tombol "Tandai Semua Lunas", THE Loan_Detail SHALL menonaktifkan tombol tersebut secara langsung sebelum operasi selesai, lalu mengaktifkan kembali berdasarkan state akhir setelah operasi selesai
5. WHEN pengguna menekan "Mark Lunas" pada Loan_Entry yang sudah berstatus `settled`, THE Loan_Tracker SHALL mengubah status kembali menjadi `active` (toggle/undo settled)
### Requirement 4: Ringkasan Hutang per Contact

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan total hutang dan piutang untuk setiap orang, agar saya bisa dengan cepat mengetahui posisi keuangan saya dengan orang tersebut.

#### Acceptance Criteria

1. THE Loan_Detail SHALL menampilkan ringkasan di bagian atas halaman: total jumlah Loan_Entry `active` dengan direction `lend` (piutang aktif) dan total jumlah Loan_Entry `active` dengan direction `borrow` (hutang aktif)
2. THE Loan_Detail SHALL menampilkan net balance: selisih antara total piutang aktif dan total hutang aktif, dengan label yang jelas ("Kamu menagih" jika positif, "Kamu berhutang" jika negatif, "Lunas semua" jika nol)
3. WHEN tidak ada Loan_Entry untuk Contact tersebut, THE Loan_Detail SHALL menampilkan pesan "Belum ada catatan hutang" dan tombol untuk menambah Loan_Entry baru
4. WHEN jumlah Contact yang memiliki hutang aktif lebih dari nol, THE Contact_List SHALL menampilkan badge atau counter di header halaman yang menunjukkan jumlah tersebut; WHEN jumlah tersebut nol, THE Contact_List SHALL menyembunyikan badge tersebut

### Requirement 5: Penghapusan Data

**User Story:** Sebagai pengguna, saya ingin menghapus entri hutang atau contact yang tidak relevan, agar daftar hutang saya tetap bersih.

#### Acceptance Criteria

1. WHEN pengguna memilih opsi hapus pada satu Loan_Entry dan mengkonfirmasi, THE Loan_Tracker SHALL menghapus Loan_Entry tersebut secara permanen dari penyimpanan
2. WHEN pengguna memilih opsi hapus pada satu Contact dan mengkonfirmasi, THE Loan_Tracker SHALL menghapus Contact beserta semua Loan_Entry yang terkait secara atomik; IF penghapusan sebagian Loan_Entry gagal karena error teknis, THEN THE Loan_Tracker SHALL membatalkan (rollback) seluruh operasi termasuk penghapusan Contact
3. IF Contact yang akan dihapus masih memiliki Loan_Entry (dengan status apapun), THEN THE Loan_Tracker SHALL menampilkan dialog konfirmasi yang menyebutkan jumlah total entri yang akan ikut terhapus
4. THE Loan_Tracker SHALL menampilkan dialog konfirmasi sebelum setiap operasi penghapusan, dengan informasi yang cukup untuk pengguna membuat keputusan

### Requirement 6: Persistensi Data (Offline-First)

**User Story:** Sebagai pengguna, saya ingin data hutang tersimpan secara lokal di perangkat saya, agar data tetap ada meskipun browser ditutup atau tidak ada koneksi internet.

#### Acceptance Criteria

1. THE Loan_Tracker SHALL menyimpan semua data Contact dan Loan_Entry di IndexedDB menggunakan object store `loan_contacts` dan `loan_entries`
2. THE Loan_Tracker SHALL membuat index pada `loan_entries` untuk field `contactId`; IF pembuatan index gagal saat inisialisasi database, THEN THE Loan_Tracker SHALL menolak untuk beroperasi dan menampilkan pesan error kepada pengguna
3. WHEN operasi simpan atau hapus Loan_Entry gagal karena error IndexedDB, THE Loan_Tracker SHALL menampilkan pesan error kepada pengguna dan tidak mengubah state UI
4. FOR ALL operasi yang melibatkan perubahan pada beberapa record sekaligus (seperti "Tandai Semua Lunas"), THE Loan_Tracker SHALL mengeksekusi operasi tersebut dalam satu IndexedDB transaction agar bersifat atomik
