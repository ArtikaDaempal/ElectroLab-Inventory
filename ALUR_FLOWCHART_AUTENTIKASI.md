# Dokumentasi Alur Flowchart Autentikasi & Keamanan
**ElectroLab-Inventory (Sistem Inventaris Laboratorium Teknik Elektro)**

Dokumen ini menyajikan panduan teknis mendalam mengenai **Flowchart Autentikasi** serta gerbang keamanan (*security gatekeeper*) pada sistem **ElectroLab-Inventory**. Penjelasan ini mencakup alur pendaftaran (*Sign Up*), verifikasi status akun (*Pending Block*), proses masuk (*Sign In*), pembuatan sesi (*JWT jose*), hingga pelindung rute (*Next.js Middleware*).

---

## 1. Visualisasi Flowchart Autentikasi Lengkap

Sistem ini menggunakan alur autentikasi tersaring yang mencegah pengguna tidak terverifikasi mengakses data laboratorium secara ilegal.

```mermaid
flowchart TD
    %% Nodes
    Start([Mulai]) --> A1[User: Membuka halaman utama aplikasi]
    
    A1 --> DEC1{User: Apakah sudah punya akun?}
    
    %% Alur Sign Up (Pendaftaran)
    DEC1 -- Belum / Sign Up --> B1[User: Mengisi Form Pendaftaran]
    B1 --> B2[Form: Nama, Email, Password, NIM/NIP, Role, & Lab Asosiasi]
    B2 --> B3[Sistem: Validasi format data & keunikan Email/NIM/NIP]
    
    B3 --> DEC2{Sistem: Apakah data valid & unik?}
    DEC2 -- Tidak --> B4[Sistem: Tampilkan error & minta koreksi form] --> B1
    DEC2 -- Ya --> B5[Sistem: Enkripsi password dengan bcryptjs]
    B5 --> B6[Sistem: Simpan akun ke database dengan status PENDING]
    B6 --> B7[Sistem: Redirect ke halaman Menunggu Persetujuan] --> End([Selesai])
    
    %% Alur Sign In (Login)
    DEC1 -- Sudah / Sign In --> C1[User: Mengisi Email & Password pada halaman Login]
    C1 --> C2[Sistem: Cari akun berdasarkan Email di database]
    
    C2 --> DEC3{Sistem: Apakah akun ditemukan?}
    DEC3 -- Tidak --> C3_1[Sistem: Tampilkan pesan 'Email atau Password salah'] --> C1
    DEC3 -- Ya --> C3_2[Sistem: Komparasi hash password menggunakan bcryptjs]
    
    C3_2 --> DEC4{Sistem: Apakah password cocok?}
    DEC4 -- Tidak --> C3_1
    DEC4 -- Ya --> C4[Sistem: Memeriksa Status Persetujuan Akun]
    
    C4 --> DEC5{Sistem: Apa status akun saat ini?}
    DEC5 -- PENDING --> C5_1[Sistem: Blok akses login, tampilkan pesan 'Menunggu Persetujuan Admin'] --> End
    DEC5 -- DITOLAK --> C5_2[Sistem: Blok akses login, tampilkan pesan 'Pendaftaran Akun Ditolak'] --> End
    
    DEC5 -- DISETUJUI --> C6[Sistem: Generate JWT Token menggunakan library jose]
    C6 --> C7[Sistem: Simpan JWT ke Cookie browser dengan flag HTTP-Only & Secure]
    C7 --> C8[Sistem: Alihkan navigasi ke halaman Dashboard utama]
    
    %% Alur Middleware & Role Guard
    C8 --> M1[Next.js Middleware: Membaca Cookie Sesi pada setiap request /dashboard/*]
    
    M1 --> DEC6{Middleware: Apakah Cookie valid?}
    DEC6 -- Tidak --> M2_1[Middleware: Hapus cookie tidak sah & redirect paksa ke /login] --> C1
    DEC6 -- Ya --> M2_2[Middleware: Periksa otorisasi Role terhadap halaman yang diakses]
    
    M2_2 --> DEC7{Middleware: Apakah Role memiliki hak akses?}
    DEC7 -- Tidak --> M3_1[Middleware: Tampilkan halaman 'Unauthorized / Akses Ditolak'] --> End
    DEC7 -- Ya --> M3_2[Sistem: Muat halaman dashboard dan tampilkan data sesuai hak akses] --> End

    %% Styling
    classDef process fill:#0f172a,stroke:#3b82f6,stroke-width:1px,color:#94a3b8;
    classDef decision fill:#1e1b4b,stroke:#6366f1,stroke-width:1.5px,color:#e2e8f0;
    classDef finish fill:#064e3b,stroke:#059669,stroke-width:2px,color:#a7f3d0;
    classDef error fill:#450a0a,stroke:#ef4444,stroke-width:1px,color:#fca5a5;
    
    class A1,B1,B2,B3,B5,B6,B7,C1,C2,C3_2,C4,C6,C7,C8,M1,M2_2,M3_2 process;
    class DEC1,DEC2,DEC3,DEC4,DEC5,DEC6,DEC7 decision;
    class Start,End finish;
    class B4,C3_1,C5_1,C5_2,M2_1,M3_1 error;
```

---

## 2. Rincian Fase Autentikasi Penting & Utama

Flowchart di atas terbagi menjadi 3 fase krusial berikut ini:

---

### Fase A: Registrasi Tertunda (*Pending Sign-Up*)
Proses pembuatan akun baru di sistem yang tidak langsung aktif secara instan guna mencegah spammer dan mahasiswa dari luar jurusan.

| No | Tahap Aktivitas | Logika Bisnis & Keamanan | Perubahan Data di Database |
| :--- | :--- | :--- | :--- |
| **1** | Input Formulir | Calon pengguna mengisikan biodata, memilih role yang diinginkan (Mahasiswa, Dosen, Kepala Lab) serta asosiasi laboratorium utama mereka. | Belum ada perubahan. |
| **2** | Enkripsi Password | Sistem mengenkripsi kata sandi menggunakan pustaka `bcryptjs` dengan *salt rounds* standar industri sebelum disimpan untuk menjaga kerahasiaan kredensial. | Sandi diubah menjadi hash acak satu arah. |
| **3** | Pembuatan Akun Pasif | Akun disimpan di tabel database namun hak login ditangguhkan. Akun dikunci dalam kondisi *inactive/pending*. | Akun tersimpan dengan `status: "PENDING"`. |
| **4** | Gerbang Verifikasi | Sistem menampilkan layar pemberitahuan *"Registrasi Sukses, Menunggu Persetujuan Admin"* dan menolak proses login sebelum status diperbarui oleh Kepala Lab atau Kajur. | Tetap `PENDING`. |

---

### Fase B: Penyaringan Login (*Sign-In Filter & JWT Generation*)
Saringan utama saat pengguna mencoba masuk ke aplikasi menggunakan kredensial email dan password mereka.

```
[Input Kredensial] ──> [Verifikasi Hash Bcrypt] ──> [Cek Status Akun] ──> [Generate HTTP-Only JWT Cookie]
```

> [!CAUTION]
> **Pencegahan Login Status PENDING & DITOLAK:**
> Meskipun kombinasi Email dan Password yang diinputkan 100% cocok secara hash, sistem akan **menolak login** apabila kolom `status` di database masih berupa `PENDING` atau `DITOLAK`. Hal ini mencegah penyalahgunaan akun sebelum diverifikasi oleh administrator secara fisik.

* **Sesi JWT Jose yang Aman**:
  Setelah login dinyatakan lolos (Password benar & Status `DISETUJUI`), sistem akan menyandikan informasi dasar pengguna (ID, Nama, Email, Role, LabID) ke dalam token **JWT** menggunakan library `jose` (yang dioptimalkan untuk kinerja tinggi pada Next.js Edge Runtime).
  Token JWT disimpan di dalam **Cookie HTTP-Only & Secure**. Pilihan cookie HTTP-only memastikan token tidak dapat dibaca oleh script pihak ketiga di browser (mencegah serangan pencurian token melalui *Cross-Site Scripting* / XSS).

---

### Fase C: Pelindung Rute (*Middleware Route Guards & Role-based Access*)
Pelindung akses (*guard*) yang bertugas menyaring setiap pemanggilan rute halaman di bawah direktori `/dashboard/*`.

```
Setiap Request (/dashboard/*) 
       │
       ├──> [Baca Cookie Sesi] ───> Gagal/Kedaluwarsa ───> [Redirect ke /login]
       │
       └──> [Valid / Terbaca]
                 │
                 └──> [Cek Otorisasi Role Halaman]
                           │
                           ├──> Tidak Berhak ───> [Tampilkan Layar Unauthorized]
                           │
                           └──> Berhak ─────────> [Muat Halaman Dashboard & Data]
```

> [!IMPORTANT]
> **Cara Kerja Otorisasi Berbasis Peran (*Role-based Authorization*):**
> * **Ketua Jurusan (KAJUR)**: Memiliki otorisasi penuh lintas laboratorium (dapat melihat statistik semua lab, mengelola seluruh daftar pengguna, serta menyetujui akun Kepala Lab).
> * **Kepala Laboratorium (KEPALA_LAB)**: Hanya diotorisasi untuk mengelola data alat, laporan kerusakan, peminjaman, dan mahasiswa/dosen yang terdaftar di **laboratorium spesifik** milik mereka (`labId` yang cocok).
> * **Mahasiswa / Dosen (Peminjam)**: Hanya memiliki akses ke area peminjam (melihat katalog, memesan alat, melihat surat peminjaman pribadi, dan melaporkan kerusakan). Upaya mengakses menu administratif secara paksa melalui URL (misal: `/dashboard/users`) akan langsung dicegat oleh Middleware dan diblokir secara mutlak.

---

## 3. Matriks Keamanan & Token Sesi

| Lapisan Keamanan | Teknologi yang Digunakan | Target Pencegahan Ancaman |
| :--- | :--- | :--- |
| **Enkripsi Kredensial** | `bcryptjs` | Kebocoran kata sandi jika database terkompromi (penyerang tidak dapat membaca teks sandi asli). |
| **Penyimpanan Sesi** | JWT + Cookie `HTTP-Only` + `Secure` + `SameSite=Lax` | Mencegah serangan pencurian token (*XSS token theft*) dan eksploitasi sirkulasi (*CSRF protection*). |
| **Proteksi Halaman Backend** | Next.js `middleware.ts` (Edge Runtime) | Mencegah akses ke halaman administratif (bypass URL) oleh pengguna yang belum terautentikasi atau tidak berhak. |
| **Saringan Status Persetujuan** | Validasi Database (`status === "DISETUJUI"`) | Menjamin hak akses sistem hanya dimiliki oleh pengguna yang sudah disaring secara fisik oleh pengelola Lab/Jurusan. |
