# Panduan Penggunaan Sistem (User Manual)
**ElectroLab-Inventory (Sistem Inventaris Laboratorium Teknik Elektro)**

Selamat datang di Panduan Penggunaan Resmi **ElectroLab-Inventory**. Dokumen ini dirancang untuk memandu seluruh tingkatan pengguna—mulai dari **Mahasiswa/Dosen (Peminjam)**, **Kepala Laboratorium (Admin Lab)**, hingga **Ketua Jurusan (Super Admin)**—dalam mengoperasikan sistem inventaris laboratorium berbasis cloud ini.

---

## 📋 DAFTAR ISI
1. [Akses Sistem & Registrasi Akun](#1-akses-sistem--registrasi-akun)
2. [Panduan Pengguna: Mahasiswa & Dosen (Peminjam)](#2-panduan-pengguna-mahasiswa--dosen-peminjam)
3. [Panduan Pengguna: Kepala Laboratorium (Admin Lab)](#3-panduan-pengguna-kepala-laboratorium-admin-lab)
4. [Panduan Pengguna: Ketua Jurusan (Super Admin)](#4-panduan-pengguna-ketua-jurusan-super-admin)
5. [Tanya Jawab & Troubleshooting](#5-tanya-jawab--troubleshooting)

---

## 1. AKSES SISTEM & REGISTRASI AKUN

Sebelum dapat bertransaksi, pengguna wajib memiliki akun yang terdaftar dan disetujui secara fisik oleh pihak laboratorium.

### A. Cara Melakukan Registrasi (Pendaftaran Akun)
1. Buka browser Anda dan akses alamat portal sistem (default local: `http://localhost:3000`).
2. Pada halaman masuk, klik tautan **"Daftar Akun Baru"**.
3. Isi data formulir registrasi secara lengkap:
   * **Nama Lengkap**: Masukkan nama asli tanpa gelar (untuk kebutuhan cetak surat).
   * **Email**: Gunakan alamat email aktif.
   * **Password**: Buat kata sandi aman (minimal 6 karakter).
   * **NIM / NIP**: Mahasiswa wajib mengisi NIM; Dosen wajib mengisi NIP/NIDN.
   * **Role (Peran)**: Pilih peran sesuai status Anda (`Mahasiswa`, `Dosen`, atau `Kepala Lab`).
   * **Laboratorium Utama**: Pilih laboratorium yang paling sering Anda gunakan untuk praktikum atau tempat Anda bertugas.
4. Klik **Daftar Sekarang**.

> [!WARNING]
> **Status Akun Tertunda (Pending Approval):**
> Setelah registrasi berhasil, akun Anda **tidak langsung aktif**. Layar akan menampilkan halaman tunggu persetujuan. Akun Anda harus disetujui terlebih dahulu oleh Kepala Lab (untuk Mahasiswa/Dosen) atau oleh Ketua Jurusan (untuk Kepala Lab) sebelum Anda dapat login ke Dashboard.

### B. Cara Masuk ke Aplikasi (Login)
1. Buka halaman utama login.
2. Masukkan **Email** dan **Password** yang telah Anda daftarkan.
3. Klik **Masuk**.
4. Jika akun telah disetujui, Anda akan langsung diarahkan ke Dashboard utama sesuai peran Anda.

---

## 2. PANDUAN PENGGUNA: MAHASISWA & DOSEN (PEMINJAM)

Sebagai peminjam, Anda memiliki otorisasi untuk memesan peralatan praktikum, memantau pengajuan, mengunduh surat izin peminjaman, serta melaporkan alat yang mengalami kerusakan fisik.

---

### A. Alur Mengajukan Peminjaman Alat
1. Masuk ke halaman Dashboard peminjam, lalu klik tombol **"Pinjam Alat"** (atau masuk ke menu **Katalog** di bilah navigasi).
2. Anda akan disajikan daftar alat laboratorium yang tersedia lengkap dengan sisa stok baik yang siap pakai.
3. Klik **"Pilih Alat"** pada item yang ingin Anda pinjam.
4. Pada formulir pengajuan peminjaman:
   * **Jumlah Unit**: Tentukan kuantitas alat (tidak boleh melebihi batas stok baik).
   * **Tujuan**: Tuliskan keperluan pemakaian secara rinci (contoh: *Praktikum Pemrograman Mikrokontroler Kelas 3 TI*).
   * **Tanggal Pinjam & Kembali**: Masukkan tanggal pengambilan dan tanggal estimasi pengembalian.
5. Klik **Kirim Permintaan Peminjaman**.
6. Sistem akan mencatat transaksi dengan status `PENDING` (Menunggu persetujuan Kepala Lab).

---

### B. Mengunduh & Mencetak Surat Peminjaman
Setelah Kepala Lab menyetujui pengajuan Anda, status peminjaman di dashboard Anda akan berubah menjadi `DISETUJUI`.

1. Masuk ke menu **Manajemen Peminjaman** pada dashboard peminjam Anda.
2. Cari baris peminjaman Anda yang telah disetujui, klik ikon **Titik Tiga (More Options)** pada ujung kanan baris tersebut, lalu pilih **"Download Surat"**.
3. Pop-up pratinjau surat peminjaman berformat Kop Surat Resmi Politeknik Negeri Manado akan muncul di layar.
4. Gulir ke bawah surat, klik tombol berwarna biru **"Download Surat (PDF)"**.
5. Browser Anda akan memunculkan dialog cetak/simpan. Pilih printer fisik untuk mencetak langsung, atau pilih **"Save as PDF"** untuk mengunduhnya ke perangkat Anda.

> [!IMPORTANT]
> **Digital Signature QR Code:**
> Di sudut bawah surat tercetak QR Code unik. Jangan coret atau merusak area QR Code ini. Kode QR tersebut berisi tanda tangan digital yang wajib ditunjukkan dan dipindai oleh Kepala Lab saat Anda mengambil barang fisik di laboratorium.

---

### C. Alur Melaporkan Kerusakan Alat
Jika Anda mendapati alat yang Anda pinjam atau alat yang berada di ruang lab mengalami kerusakan fisik/kegagalan fungsi:

1. Klik tombol **"Lapor Kerusakan"** pada Dashboard (atau masuk ke menu **Laporan Kerusakan** $\rightarrow$ klik **Buat Laporan**).
2. Isi formulir pengaduan kerusakan:
   * **Laboratorium**: Pilih laboratorium tempat alat tersebut berada.
   * **Pilih Alat**: Cari nama alat terkait pada menu dropdown pencarian yang telah disinkronisasikan.
   * **Foto Kerusakan**: Klik ikon tambah (+), lalu pilih kamera ponsel Anda untuk mengambil foto bukti secara langsung, atau unggah file gambar yang sudah ada dari galeri Anda.
   * **Deskripsi Kerusakan**: Tuliskan deskripsi kronologi kerusakan secara rinci (contoh: *Kabel probe osiloskop putus bagian dalam, tidak memunculkan gelombang sinus*).
3. Klik **Kirim Laporan Kerusakan**.
4. Laporan Anda tersimpan dengan status `DILAPOR` dan Kepala Lab akan segera mengevaluasinya.

---

## 3. PANDUAN PENGGUNA: KEPALA LABORATORIUM (ADMIN LAB)

Sebagai Kepala Lab, Anda adalah operator utama yang memegang kendali atas inventaris fisik, pengelolaan data alat, persetujuan peminjaman, serta pemrosesan laporan kerusakan di lab Anda.

---

### A. Memproses Peminjaman / Pengembalian Menggunakan QR Code
Fitur pemindai QR Code ini memudahkan Anda melayani antrean mahasiswa tanpa harus mencari data mereka secara manual.

1. **Proses Pengambilan Alat (Check-Out)**:
   * Mahasiswa datang membawa Surat Peminjaman fisik yang telah dicetak.
   * Pada Dashboard utama Anda, klik tombol ungu **"Scan QR Alat"** (atau masuk ke menu peminjaman $\rightarrow$ klik *Scan QR Proses*).
   * Izinkan browser mengakses kamera perangkat Anda.
   * Sorot kamera ke arah QR Code surat peminjaman yang dibawa mahasiswa.
   * Sistem otomatis memvalidasi, berbunyi notifikasi sukses, dan memunculkan jendela dialog persetujuan berisi nama mahasiswa dan daftar alat.
   * Serahkan barang fisik kepada mahasiswa, lalu klik tombol biru **"Konfirmasi Ambil"**. Status berubah menjadi `DIAMBIL`.

2. **Proses Pengembalian Alat (Check-In)**:
   * Mahasiswa mengembalikan barang fisik dan menunjukkan kembali surat cetak tersebut.
   * Klik **"Scan QR Alat"** lagi dari Dashboard Anda, sorot kamera ke QR Code surat.
   * Periksa kelengkapan fisik alat di hadapan Anda.
   * Jika semua unit lengkap dan dalam kondisi baik, klik tombol hijau **"Selesaikan Kembali"**.
   * Status transaksi berubah menjadi `DIKEMBALIKAN` dan sistem otomatis menambahkan kembali jumlah barang ke **Stok Baik** di database.

> [!TIP]
> **Fitur Fallback - Unggah Gambar QR:**
> Jika kamera perangkat Anda mengalami gangguan teknis (misalnya konflik *driver* media), Anda dapat beralih ke tab **"Upload Gambar"** di pemindai. Mintalah mahasiswa mengirimkan foto QR Code surat mereka, lalu unggah gambar tersebut ke sistem untuk diproses secara instan.

---

### B. Mengelola Inventaris Peralatan (CRUD & Excel Import)
1. **Menambah Alat Secara Manual**:
   * Masuk ke menu **Inventaris Peralatan**, lalu klik **"Tambah Alat"**.
   * Isi formulir alat (Nama, Kode Alat unik, Kategori, Merek, Prodi).
   * Pada alokasi stok: Masukkan kuantitas stok sesuai kondisi riil fisiknya (**Baik**, **Rusak**, dan **Perbaikan**).
   * Pastikan total stok terisi secara presisi penjumlahan dari stok kondisi fisik. Klik **Simpan**.

2. **Impor Massal Menggunakan Excel**:
   * Jika Anda ingin memasukkan puluhan data alat baru secara instan: Masuk ke menu *Inventaris Peralatan* $\rightarrow$ klik **Import Excel**.
   * Klik tautan biru **"Unduh Template Excel"** untuk mendapatkan format dokumen kolom yang tepat.
   * Isi data inventaris Anda di dalam file Excel tersebut sesuai instruksi petunjuk.
   * Unggah berkas Excel yang telah Anda isi ke zona drop-box pemindai di aplikasi.
   * Sistem otomatis mengurai (*parsing*), memvalidasi kecocokan data, dan menyimpan seluruh item baru tersebut secara massal.

3. **Mencetak Barcode / Label QR Code Alat**:
   * Pada daftar baris peralatan Anda, klik tombol menu aksi (ikon titik tiga) $\rightarrow$ pilih **"QR Code"**.
   * Jendela pratinjau stiker label beresolusi tinggi akan muncul.
   * Klik tombol **Cetak Label** untuk langsung memanggil fungsi cetak browser menuju printer label barcode Anda.

---

### C. Menindaklanjuti Laporan Kerusakan Alat
1. Masuk ke menu **Pelaporan Kerusakan**.
2. Cari laporan masuk terbaru berstatus `DILAPOR`. Klik baris laporan tersebut untuk meninjau foto bukti kerusakan fisik yang dikirim pelapor.
3. **Penyelidikan Fisik**: Periksa alat yang rusak di ruang penyimpanan.
4. **Tindakan Perbaikan**:
   * Jika benar-benar rusak dan butuh direparasi: Klik **Update Status** $\rightarrow$ pilih status **DIPROSES** $\rightarrow$ klik *Simpan Status*. 
   * *Reaksi Database*: Sistem secara otomatis memindahkan jumlah unit alat tersebut dari kategori *Stok Baik* ke kategori *Stok Perbaikan* secara instan.
5. **Penyelesaian Perbaikan**:
   * Setelah alat berhasil diperbaiki secara fisik dan siap dipakai kembali: Buka kembali detail laporan tersebut $\rightarrow$ ubah status ke **SELESAI** $\rightarrow$ klik *Simpan Status*.
   * *Reaksi Database*: Sistem memindahkan kembali kuantitas unit alat dari kategori *Stok Perbaikan* kembali ke kategori *Stok Baik* (siap dipinjam).

---

## 4. PANDUAN PENGGUNA: KETUA JURUSAN (SUPER ADMIN)

Sebagai Ketua Jurusan, Anda memiliki kekuasaan administratif tertinggi untuk mengawasi seluruh aktivitas laboratorium, memantau laporan tren, serta mengelola akun Kepala Lab.

---

### A. Memantau Statistik Agregat Lintas Laboratorium
1. Masuk ke Dashboard Kajur. Anda akan disajikan grafik metrik visual interaktif:
   * **Stok Per Kategori**: Diagram batang sebaran persediaan alat di jurusan.
   * **Kondisi Alat Saat Ini**: Diagram lingkaran persentase perbandingan alat Baik vs Rusak vs Perbaikan di seluruh laboratorium.
   * **Tren Aktivitas Lab (6 Bulan)**: Diagram garis fluktuasi aktivitas peminjaman dan pelaporan kerusakan bulanan untuk kebutuhan analisis anggaran pengadaan barang baru.
2. Klik tombol **"Refresh"** di sudut kanan atas halaman untuk memperbarui data tangkapan dashboard secara real-time.

---

### B. Menyetujui Akun Kepala Laboratorium & Manajemen User
1. Jika terdapat pendaftaran Kepala Lab baru di sistem, Dashboard Anda akan memunculkan spanduk alert berwarna kuning **"[Jumlah] User Menunggu Persetujuan"**.
2. Klik **Lihat Semua** (atau buka menu **Manajemen User**).
3. Anda akan melihat profil pendaftar. Verifikasi NIP dan keabsahan identitas ybs.
4. Klik tombol **"Setujui Registrasi"** untuk mengaktifkan akun Kepala Lab tersebut secara resmi di database.

---

## 5. TANYA JAWAB & TROUBLESHOOTING

#### ❓ Tanya: Mengapa muncul error `"Kamera tidak dapat diakses..."` saat memindai QR Code?
* **Jawab**: Kendala ini terjadi karena webcam/kamera perangkat Anda sedang dikunci atau digunakan oleh program lain (seperti aplikasi Zoom, MS Teams, OBS Virtual Camera yang tidak aktif, atau tab browser lain).
* **Solusi**: Tutup semua aplikasi lain yang mengakses kamera Anda, pastikan driver kamera terpasang dengan benar, lalu klik tombol **"Coba Lagi"** pada layar pemindai. Alternatifnya, gunakan tab **"Upload Gambar"** untuk mengunggah gambar tangkapan layar QR Code.

#### ❓ Tanya: Saya salah mengisi jumlah stok alat saat mengimpor Excel, bagaimana cara memperbaikinya?
* **Jawab**: Anda tidak perlu menghapusnya. Sistem impor Excel kami dilengkapi mekanisme **Upsert** berbasis `kodeAlat`.
* **Solusi**: Cukup perbaiki angka stok pada file Excel Anda di komputer, simpan, lalu unggah kembali file tersebut ke sistem. Aplikasi akan mendeteksi kode alat yang sama dan menimpa kuantitas stok lama dengan data terbaru Anda secara otomatis.

#### ❓ Tanya: Kenapa pendaftaran akun mahasiswa saya ditolak?
* **Jawab**: Kepala Lab menolak pendaftaran akun jika NIM yang Anda masukkan salah, format email tidak valid, atau Anda salah memilih asosiasi laboratorium utama saat mendaftar. Silakan hubungi Kepala Lab Anda untuk klarifikasi fisik.
