# Dokumentasi Alur Use Case & Activity Diagram
**ElectroLab-Inventory (Sistem Inventaris Laboratorium Teknik Elektro)**

Dokumen ini menjelaskan alur **Use Case Diagram** serta visualisasi **Activity Diagram** untuk proses bisnis utama yang berjalan pada sistem **ElectroLab-Inventory**. Penjelasan difokuskan pada alur yang paling penting, krusial, dan mewakili fitur unggulan aplikasi ini (seperti integrasi QR Code).

---

## 1. Pemetaan Use Case Diagram

Sistem ini melibatkan 3 aktor utama dengan wewenang yang terstruktur secara hierarkis:
1. **Mahasiswa / Dosen (Peminjam)**
2. **Kepala Laboratorium (Admin Lab)**
3. **Ketua Jurusan (Kajur - Super Admin)**

### Visualisasi Use Case Diagram
```mermaid
graph TD
  %% Aktor
  subgraph Aktor
    M["Mahasiswa / Dosen (Peminjam)"]
    K["Kepala Laboratorium (Admin Lab)"]
    J["Ketua Jurusan (Super Admin)"]
  end

  %% Use Cases
  subgraph Use Cases Utama
    UC1["Registrasi & Login Akun"]
    UC2["Melihat Katalog & Stok Alat"]
    UC3["Mengajukan Peminjaman Alat"]
    UC4["Mengunduh & Cetak Surat Peminjaman (PDF)"]
    UC5["Verifikasi & Proses Ambil/Kembali via QR"]
    UC6["Melaporkan Kerusakan Alat (+ Upload Foto)"]
    UC7["Mengelola Inventaris Alat (CRUD & Excel Import)"]
    UC8["Menyetujui Registrasi Akun & Manajemen User"]
  end

  %% Relasi Aktor ke Use Cases
  M --> UC1
  M --> UC2
  M --> UC3
  M --> UC4
  M --> UC6

  K --> UC1
  K --> UC2
  K --> UC5
  K --> UC6
  K --> UC7
  K --> UC8

  J --> UC1
  J --> UC2
  J --> UC7
  J --> UC8
```

---

## 2. Activity Diagram Utama & Paling Penting

Berikut adalah rincian alur aktivitas (*Activity Diagram*) untuk dua fitur paling vital dalam aplikasi ini:

---

### A. Alur Peminjaman Alat & Verifikasi QR Code (Core Workflow)
Ini adalah alur terpenting di mana **Mahasiswa/Dosen**, **Surat Peminjaman Fisik (dengan Digital Signature QR)**, dan **Kepala Laboratorium** saling berinteraksi secara aman melalui pemindaian QR Code.

```mermaid
flowchart TD
    Start([Mulai]) --> AJ[Mahasiswa mengajukan peminjaman beberapa alat di Katalog]
    AJ --> WT[Status Peminjaman: PENDING. Menunggu Persetujuan Kepala Lab]
    
    WT --> AP{Kepala Lab mengevaluasi pengajuan?}
    
    AP -- Ditolak --> RJ[Status: DITOLAK. Peminjaman selesai/dibatalkan]
    AP -- Disetujui --> AC[Status: DISETUJUI. Sistem otomatis membuat kode verifikasi unik]
    
    AC --> PR[Mahasiswa mengunduh & mencetak Surat Peminjaman PDF dari sistem]
    PR --> AM[Mahasiswa membawa Surat Peminjaman fisik ke Laboratorium]
    
    AM --> SC[Kepala Lab memindai QR Code Surat di Dashboard Utama atau Halaman Peminjaman]
    SC --> OV[Sistem mendeteksi kode verifikasi, otomatis beralih & membuka detail peminjaman]
    
    OV --> CF[Kepala Lab mencocokkan fisik alat dan klik 'Barang DIAMBIL']
    CF --> AB[Status: DIAMBIL. Mahasiswa menggunakan alat untuk praktikum/penelitian]
    
    AB --> KB[Setelah selesai, Mahasiswa mengembalikan alat fisik dan membawa surat kembali]
    KB --> SC2[Kepala Lab memindai ulang QR Code Surat Peminjaman]
    SC2 --> CF2[Kepala Lab memeriksa kondisi alat & klik 'Sudah DIKEMBALIKAN']
    
    CF2 --> FI[Status: DIKEMBALIKAN. Stok alat terupdate kembali secara otomatis]
    FI --> End([Selesai])

    %% Styling
    classDef actor fill:#1e293b,stroke:#334155,stroke-width:2px,color:#fff;
    classDef process fill:#0f172a,stroke:#3b82f6,stroke-width:1px,color:#94a3b8;
    classDef decision fill:#1e1b4b,stroke:#6366f1,stroke-width:1.5px,color:#e2e8f0;
    classDef finish fill:#064e3b,stroke:#059669,stroke-width:2px,color:#a7f3d0;
    
    class AJ,WT,PR,AM,SC,OV,CF,AB,KB,SC2,CF2,FI process;
    class AP decision;
    class Start,End,RJ finish;
```

> [!IMPORTANT]
> **Integrasi QR Code `VERIFY_GRP:`**
> Pemindaian QR Code dari surat cetak berfungsi sebagai tanda tangan digital (*Digital Signature*). Pemindaian ini dapat dilakukan langsung pada **Dashboard Utama** melalui tombol *Scan QR Alat*, yang akan secara otomatis mengenali dokumen dan mengalihkan Kepala Lab secara instan ke portal persetujuan peminjaman yang tepat.

---

### B. Alur Pelaporan Kerusakan Alat (Maintenance Workflow)
Alur ini memfasilitasi pelaporan kerusakan secara cepat dari pengguna langsung di lapangan sehingga kondisi inventaris tetap akurat dan terpantau secara real-time.

```mermaid
flowchart TD
    Start([Mulai]) --> FK[Mahasiswa/Dosen membuka Formulir Buat Laporan]
    FK --> FL[Memilih Laboratorium dan mencari Alat yang rusak secara spesifik]
    FL --> UF[Mengambil/mengunggah Foto bukti kerusakan & menulis Deskripsi kronologi]
    UF --> SL[Klik 'Kirim Laporan Kerusakan']
    SL --> ST[Status Laporan: DILAPOR. Kepala Lab mendapatkan notifikasi di sistem]
    
    ST --> EV{Kepala Lab mengevaluasi laporan & fisik alat?}
    
    EV -- Laporan Tidak Valid / Palsu --> DT[Status: DITOLAK. Laporan diarsipkan]
    EV -- Laporan Valid --> PR[Status: DIPROSES. Alat ditandai 'Butuh Perbaikan' & dibawa ke teknisi]
    
    PR --> RE[Teknisi/Kepala Lab melakukan perbaikan fisik pada alat]
    RE --> CF[Perbaikan Selesai. Kepala Lab klik 'Simpan Status SELESAI']
    
    CF --> ST2[Stok Baik bertambah kembali & Laporan ditandai selesai]
    ST2 --> End([Selesai])

    %% Styling
    classDef process fill:#0f172a,stroke:#3b82f6,stroke-width:1px,color:#94a3b8;
    classDef decision fill:#1e1b4b,stroke:#6366f1,stroke-width:1.5px,color:#e2e8f0;
    classDef finish fill:#064e3b,stroke:#059669,stroke-width:2px,color:#a7f3d0;
    
    class FK,FL,UF,SL,ST,PR,RE,CF,ST2 process;
    class EV decision;
    class Start,End,DT finish;
```

> [!TIP]
> **Otomatisasi Stok pada Laporan Kerusakan:**
> * Saat status laporan diperbarui ke **DIPROSES**, sistem secara otomatis memindahkan kuantitas alat dari *Stok Baik* ke *Stok Butuh Perbaikan*.
> * Saat status diselesaikan ke **SELESAI**, kuantitas alat akan dialihkan kembali dari *Stok Butuh Perbaikan* ke *Stok Baik*, menjaga sinkronisasi data inventaris secara instan tanpa input manual ganda.

---

## 3. Rangkuman Kontribusi Aktor Terhadap Data Inventaris

| Aktor | Peran Utama Terhadap Sistem | Dampak Alur Kerja (*Business Impact*) |
| :--- | :--- | :--- |
| **Mahasiswa / Dosen** | Pengguna akhir (*End-User*) yang melakukan transaksi peminjaman dan membuat laporan kerusakan alat. | Menjadi sumber data aktivitas utama (permintaan stok keluar dan laporan kerusakan lapangan). |
| **Kepala Laboratorium** | Pengelola operasional laboratorium (*Operator/Admin*), verifikator keabsahan dokumen, dan pengelola aset fisik. | Mengendalikan arus fisik barang, menyetujui sirkulasi alat, dan menjaga akurasi data stok melalui CRUD/Import Excel. |
| **Ketua Jurusan** | Pengawas departemen (*Supervisor/Super-admin*) yang melihat statistik performa seluruh lab untuk pengambilan keputusan. | Menerima data agregat sirkulasi alat untuk analisis kebutuhan anggaran pengadaan alat baru di masa depan. |
