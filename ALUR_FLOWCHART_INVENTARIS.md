# Dokumentasi Alur Flowchart Pengelolaan Inventaris
**ElectroLab-Inventory (Sistem Inventaris Laboratorium Teknik Elektro)**

Dokumen ini menyajikan panduan operasional dan teknis mengenai **Flowchart Pengelolaan Inventaris** pada sistem **ElectroLab-Inventory**. Penjelasan ini mencakup alur penambahan/pembaruan peralatan (CRUD), pembuatan label QR Code peralatan otomatis, hingga alur impor data massal (*batch import*) via file Excel.

---

## 1. Visualisasi Flowchart Pengelolaan Inventaris Lengkap

Alur di bawah memodelkan bagaimana Kepala Laboratorium atau Ketua Jurusan mengelola aset peralatan secara presisi, baik secara satuan maupun massal.

```mermaid
flowchart TD
    %% Nodes
    Start([Mulai]) --> A1[Admin: Membuka Halaman Inventaris Peralatan]
    
    A1 --> DEC1{Admin: Memilih Aksi Pengelolaan?}
    
    %% Alur CRUD (Tambah/Edit)
    DEC1 -- Tambah / Edit Alat --> B1[Admin: Mengisi Formulir Peralatan]
    B1 --> B2[Form: Nama Alat, Kode Alat, Kategori, Merek, & Distribusi Stok]
    B2 --> B3[Admin: Menginput Kuantitas Stok Baik, Rusak, & Perbaikan]
    
    B3 --> DEC2{Sistem: Apakah Total Stok = Baik + Rusak + Perbaikan?}
    DEC2 -- Tidak --> B4_1[Sistem: Tampilkan error 'Kalkulasi stok unit tidak cocok'] --> B1
    DEC2 -- Ya --> DEC3{Sistem: Apakah Kode Alat unik / tidak duplikat?}
    
    DEC3 -- Tidak --> B4_2[Sistem: Tampilkan error 'Kode Alat sudah terdaftar'] --> B1
    DEC3 -- Ya --> B5[Sistem: Simpan / Perbarui data peralatan ke database]
    B5 --> B6[Sistem: Tampilkan toast sukses & muat ulang daftar alat] --> End([Selesai])
    
    %% Alur Cetak Label QR Code
    DEC1 -- Cetak Label QR --> C1[Admin: Klik aksi QR Code pada peralatan pilihan]
    C1 --> C2[Sistem: Generate string enkripsi 'ITEM:kodeAlat']
    C2 --> C3[Sistem: Render gambar QR Code beresolusi tinggi via QRCodeSVG]
    C3 --> C4[Admin: Klik Cetak Label]
    C4 --> C5[Sistem: Buka dialog cetak sistem browser & cetak fisik label] --> End
    
    %% Alur Import Excel (Batch)
    DEC1 -- Import via Excel --> D1[Admin: Klik tombol Import Excel & Unduh Template]
    D1 --> D2[Admin: Mengisi data alat di template Excel & unggah file]
    D2 --> D3[Sistem: Parsing file .xlsx/.xls di sisi klien via library xlsx]
    D3 --> D4[Sistem: Validasi pemetaan judul kolom & tipe data baris]
    
    D4 --> DEC4{Sistem: Apakah file kosong atau struktur kolom tidak valid?}
    DEC4 -- Ya --> D5_1[Sistem: Tampilkan error 'Format berkas Excel tidak sesuai'] --> D1
    DEC4 -- Tidak --> D5_2[Sistem: Kirim data JSON massal ke API /api/peralatan/import]
    
    D5_2 --> D6[Sistem API: Enforce ID Lab aktif & simpan/update massal ke database]
    D6 --> D7[Sistem: Tampilkan toast sukses berisi statistik baris yang diimpor] --> End

    %% Styling
    classDef process fill:#0f172a,stroke:#3b82f6,stroke-width:1px,color:#94a3b8;
    classDef decision fill:#1e1b4b,stroke:#6366f1,stroke-width:1.5px,color:#e2e8f0;
    classDef finish fill:#064e3b,stroke:#059669,stroke-width:2px,color:#a7f3d0;
    classDef error fill:#450a0a,stroke:#ef4444,stroke-width:1px,color:#fca5a5;
    
    class A1,B1,B2,B3,B5,B6,C1,C2,C3,C4,C5,D1,D2,D3,D4,D5_2,D6,D7 process;
    class DEC1,DEC2,DEC3,DEC4 decision;
    class Start,End finish;
    class B4_1,B4_2,D5_1 error;
```

---

## 2. Rincian Alur Pengelolaan Inventaris Penting & Utama

### A. Validasi Distribusi Stok (Matematika Inventaris)
Saat menambah atau mengubah (*edit*) data peralatan, sistem menerapkan aturan matematis ketat untuk menghindari ketidaksesuaian laporan fisik:

$$\text{Total Stok} = \text{Stok Baik} + \text{Stok Rusak} + \text{Stok Butuh Perbaikan}$$

> [!IMPORTANT]
> **Pencegahan Error Kalkulasi:**
> Jika administrator memasukkan angka kuantitas di mana penjumlahan ketiga kondisi unit tidak sama dengan kolom **Total**, sistem akan menolak penyimpanan dan menampilkan *toast* error. Hal ini memastikan integritas audit inventaris tahunan tetap terjaga dengan akurasi 100%.

---

### B. Alur Impor Batch Excel (Client-Side Parsing & API Import)
Fitur ini memfasilitasi migrasi data besar dari pembukuan manual (Excel) ke dalam database digital secara instan.

| Langkah Kerja | Pemrosesan Teknis (*Technical Process*) | Manfaat & Keamanan |
| :--- | :--- | :--- |
| **1. Unduh Template** | Menyediakan berkas `.xlsx` kosong yang sudah memiliki format kolom standar yang dikenali sistem. | Mencegah kesalahan ketik nama kolom oleh administrator. |
| **2. Parsing Klien** | File Excel dibaca langsung di browser menggunakan pustaka `xlsx`. Tidak ada pemrosesan file mentah di server (*Zero Server Upload Load*). | Menghindari beban memori berlebih pada server karena file diurai menjadi JSON di sisi klien terlebih dahulu. |
| **3. Validasi Kolom** | Sistem mencocokkan header kolom secara case-insensitive (misal: "JUMLAH TOTAL", "BAIK", "RUSAK", "BUTUH PERBAIKAN"). | Toleran terhadap variasi minor penulisan kolom Excel buatan admin. |
| **4. Injeksi API Lab** | Klien mengirimkan array JSON objek alat ke `/api/peralatan/import`. API secara otomatis mengunci `labId` berdasarkan user yang login. | Mencegah admin mengimpor data alat ke laboratorium milik admin lain secara sengaja maupun tidak sengaja. |

> [!TIP]
> **Skema Penguncian Kode Alat:**
> Selama pemrosesan API Impor massal, sistem akan mendeteksi jika `kodeAlat` sudah terdaftar di sistem. Jika sudah terdaftar, sistem akan melakukan **update** (sinkronisasi stok terbaru), dan jika belum, sistem akan melakukan **insert** baru (Upsert).

---

### C. Alur Pembuatan Label QR Code Peralatan
Setiap alat di dalam laboratorium diidentifikasi secara unik menggunakan label fisik QR Code berperekat.

```
[Klik Menu QR] ──> [Generate String "ITEM:KODE_ALAT"] ──> [Render SVG] ──> [Print Label Fisik]
```

* **Keunikan String**: QR Code dikodekan dengan format prefix `ITEM:<kodeAlat>` (contoh: `ITEM:EL-CT-001`). Format ini dibaca secara instan oleh pemindai kamera aktif di Dashboard untuk mengidentifikasi alat dengan cepat.
* **Cetak Vektor SVG**: Menggunakan `QRCodeSVG` dari React untuk menghasilkan gambar QR Code berbasis vektor. Keunggulannya adalah gambar label tidak akan pecah/blur saat dicetak dalam ukuran sekecil apa pun pada printer barcode/label termal.

---

## 3. Matriks Hak Akses Pengelolaan Inventaris

| Tindakan Pengelolaan | Kepala Laboratorium (Admin Lab) | Ketua Jurusan (Kajur) | Keterangan Otoritas |
| :--- | :---: | :---: | :--- |
| **Tambah / Edit Alat** | **Ya** (Khusus Lab-nya) | **Ya** (Semua Lab) | Mengisi data teknis dan kondisi persediaan. |
| **Hapus Alat** | **Ya** (Khusus Lab-nya) | **Ya** (Semua Lab) | Penghapusan permanen dari sistem. |
| **Impor via Excel** | **Ya** (Khusus Lab-nya) | Tidak | Hanya dikelola oleh Kepala Lab masing-masing untuk akurasi audit fisik. |
| **Cetak Label QR Code** | **Ya** (Khusus Lab-nya) | **Ya** (Semua Lab) | Digunakan untuk melabeli fisik alat laboratorium. |
