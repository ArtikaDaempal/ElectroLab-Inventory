# Ringkasan Proyek: ElectroLab Inventory (Sistem Informasi Inventaris Laboratorium)

**ElectroLab Inventory** adalah sistem informasi manajemen inventaris laboratorium berbasis web modern yang dirancang untuk mengelola data alat, proses peminjaman peralatan, pelaporan kerusakan, audit sistem, dan administrasi pengguna dalam ruang lingkup laboratorium Teknik Elektro.

Sistem ini didesain menggunakan arsitektur modern berkinerja tinggi, visual premium (*dark mode glassmorphism*), serta alur kerja interaktif yang dinamis untuk memberikan pengalaman pengguna tingkat tinggi.

---

## 🚀 Teknologi Utama yang Digunakan

1. **Frontend**:
   - **React.js & Next.js (App Router)**: Framework modern berbasis SSR/ISR untuk rendering halaman super cepat dan routing yang efisien.
   - **TypeScript**: Memastikan keandalan kode dengan *type checking* yang ketat sehingga memperkecil risiko bug runtime.
   - **Tailwind CSS & Shadcn UI**: Menyajikan komponen antarmuka berkualitas premium, responsif, dan konsisten secara estetika.
   - **Framer Motion**: Menghadirkan animasi transisi halaman dan interaksi mikro yang lembut dan hidup.
   - **Zustand (with Persistence)**: Manajemen status aplikasi sisi klien (*client-side state management*) untuk autentikasi yang persisten (`lab-auth`).

2. **Backend & Database**:
   - **Next.js Route Handlers (API)**: Endpoint backend serverless yang aman dan cepat.
   - **Supabase Database**: Menggunakan database PostgreSQL berkinerja tinggi.
   - **Supabase Storage**: Digunakan untuk menyimpan aset media secara aman (misalnya: foto alat, foto laporan kerusakan, dan foto profil pengguna) menggunakan bucket `lab-images`.
   - **Jose**: Manajemen pembuatan & verifikasi JWT aman untuk enkripsi session cookie (`lab_session`).
   - **Bcrypt.js**: Enkripsi password satu arah yang aman sebelum disimpan ke database.

---

## 👥 Manajemen Hak Akses (Multi-Role)

Sistem ini membagi akses menjadi 4 peran (*roles*) dengan tanggung jawab spesifik:

1. **KAJUR (Ketua Jurusan)**:
   - Manajemen seluruh pengguna (Menonaktifkan/mengaktifkan akun, persetujuan pendaftaran).
   - Pembuatan dan pengelolaan **Kode Undangan (Invite Codes)** khusus sekali pakai (berlaku 1 jam) untuk registrasi Kepala Lab.
   - Hak melihat seluruh catatan log sistem (*Audit Trail*) global demi transparansi aktivitas jurusan.
2. **KEPALA_LAB (Kepala Laboratorium)**:
   - Manajemen penuh inventaris peralatan laboratorium di bawah naungannya.
   - Melakukan eksekusi peminjaman (*Approve / Reject* peminjaman alat).
   - Menindaklanjuti laporan kerusakan dari pengguna.
   - Melakukan pemindaian kode alat via kamera (**QR Code Scanner** terintegrasi).
   - Melakukan proses stok opname (*stock opname*) berkala.
3. **DOSEN**:
   - Mengajukan peminjaman alat laboratorium untuk kebutuhan riset atau pengajaran.
   - Melaporkan kerusakan peralatan jika ditemukan masalah saat penggunaan.
   - Melihat riwayat transaksi peminjaman pribadi secara lengkap.
4. **MAHASISWA**:
   - Menjelajahi katalog alat laboratorium yang tersedia di jurusan.
   - Mengajukan permintaan pinjam alat dengan menyertakan detail tanggal dan jumlah.
   - Melaporkan kerusakan peralatan secara instan dengan bukti foto kerusakan.

---

## ✨ Fitur-Fitur Utama Sistem

* **Dashboard Interaktif & Charts**:
  Menyajikan ringkasan statistik secara visual kepada staf admin (KAJUR/KEPALA_LAB) menggunakan visualisasi grafik canggih (*Doughnut Chart* status laporan, *Bar Chart* stok per kategori, *Pie Chart* kondisi alat, dan *Line Chart* tren aktivitas 6 bulan terakhir).

* **QR Code Scanner**:
  Memungkinkan Kepala Lab mengidentifikasi dan mengelola item inventaris secara instan lewat kamera perangkat dengan memindai kode QR unik berformat `ITEM:[KODE_ALAT]`.

* **Peminjaman Alat Terintegrasi**:
  Alur pengajuan peminjaman interaktif dari Dosen/Mahasiswa yang akan langsung memicu notifikasi waktu nyata ke dasbor Kepala Lab untuk disetujui atau ditolak berdasarkan ketersediaan stok fisik di database.

* **Pelaporan Kerusakan**:
  Mempermudah pengguna melaporkan kerusakan dengan mengunggah foto bukti fisik langsung dari kamera/galeri, yang akan mengubah status alat menjadi butuh perbaikan agar segera ditindaklanjuti oleh Kepala Lab.

* **Keamanan Sistem & Audit Trail (Catatan Audit)**:
  Setiap aktivitas manipulasi data kritis (tambah alat, hapus user, edit data, persetujuan transaksi) dicatat secara otomatis dalam log audit (`createAuditLog`) demi transparansi penuh dan keamanan kepatuhan.

* **Pengaturan Profil Mandiri**:
  Fitur bagi semua pengguna untuk melengkapi informasi pribadi, mengganti password secara berkala, dan mengunggah **Foto Profil** asli mereka sendiri secara instan dengan *drag-and-drop* atau klik kamera yang tersinkronisasi ke server.

---

## 📂 Struktur Folder Proyek

```text
inventaris-lab/
├── app/                  # Direktori Next.js App Router
│   ├── (auth)/           # Rute modul Autentikasi (Login, Signup, dll.)
│   ├── (dashboard)/      # Rute modul Dashboard & Manajemen (Katalog, Peminjaman, dll.)
│   └── api/              # Endpoint Next.js API (Backend server-side)
├── components/           # Komponen UI Reusable (UI, Layouts, Charts, Scanner)
├── lib/                  # Utilitas backend, klien Supabase, & sistem enkripsi token
├── public/               # Aset statis aplikasi
├── store/                # Status aplikasi sisi klien menggunakan Zustand
└── package.json          # Konfigurasi dependensi aplikasi
```
