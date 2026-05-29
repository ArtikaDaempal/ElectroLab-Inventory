import { v4 as uuid } from 'uuid'
import { supabase } from './supabase'
import nodemailer from 'nodemailer'

interface AuditLogParams {
  userId: string
  userName: string
  aksi: string
  tabel: string
  recordId?: string
  labId?: string | null
  dataLama?: Record<string, any> | null
  dataBaru?: Record<string, any> | null
}

// Fungsi bantu untuk mengirim email notifikasi secara asynchronous (tidak memblokir request API utama)
async function triggerEmailNotification(params: AuditLogParams) {
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  // Jika kredensial SMTP belum diset, abaikan pengiriman email secara aman
  if (!smtpUser || !smtpPass) return

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  })

  try {
    const action = params.aksi

    // =========================================================
    // A. USER REGISTRATION -> Kirim Welcome Email ke Pendaftar
    // =========================================================
    if (action === 'REGISTER') {
      const emailUser = params.dataBaru?.email || '';
      const roleUser = params.dataBaru?.role || 'MAHASISWA';
      const nameUser = params.userName || 'Pengguna';

      if (emailUser) {
        let roleLabel = roleUser;
        if (roleUser === 'MAHASISWA') roleLabel = 'Mahasiswa';
        else if (roleUser === 'DOSEN') roleLabel = 'Dosen';
        else if (roleUser === 'KEPALA_LAB') roleLabel = 'Kepala Laboratorium';
        else if (roleUser === 'KAJUR') roleLabel = 'Ketua Jurusan';

        await transporter.sendMail({
          from: `"Sistem Inventaris Lab" <${smtpUser}>`,
          to: emailUser,
          subject: '🎉 Selamat Datang! Registrasi Akun Berhasil',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 40px;">🎉</span>
                <h2 style="color: #0f172a; margin-top: 10px; font-weight: 800;">Registrasi Akun Berhasil</h2>
                <p style="color: #64748b; font-size: 14px; margin-top: 2px;">ElectroLab-Inventory</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
              <p>Halo <strong>${nameUser}</strong>,</p>
              <p>Selamat! Akun Anda telah berhasil terdaftar dan <strong>langsung aktif</strong> di sistem kami.</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Nama Lengkap:</strong> ${nameUser}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${emailUser}</p>
                <p style="margin: 5px 0;"><strong>Peran Akun:</strong> ${roleLabel}</p>
                <p style="margin: 5px 0;"><strong>Status Akun:</strong> <span style="color: #16a34a; font-weight: bold;">AKTIF (Instan)</span></p>
              </div>
              <p>Silakan masuk ke akun Anda menggunakan tautan di bawah ini:</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Masuk ke Dashboard</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
            </div>
          `
        });
      }
    }

    // ========================================================
    // B. PEMINJAMAN ALAT BARU -> Kirim ke Peminjam & Approver
    // ========================================================
    else if (action === 'CREATE_PEMINJAMAN' && params.recordId) {
      // Query detail peminjaman secara lengkap
      const { data: peminjaman } = await supabase
        .from('Peminjaman')
        .select('*, alat:alatId(namaAlat), peminjam:peminjamId(nama, email, role)')
        .eq('id', params.recordId)
        .single()

      if (peminjaman && peminjaman.peminjam) {
        const borrower = peminjaman.peminjam
        const toolName = peminjaman.alat?.namaAlat || 'Alat Laboratorium'
        const amount = peminjaman.jumlah || 1
        const purpose = peminjaman.tujuan || '-'
        const datePinjam = peminjaman.tanggalPinjam ? new Date(peminjaman.tanggalPinjam).toLocaleDateString('id-ID') : '-'
        const dateKembali = peminjaman.tanggalKembali ? new Date(peminjaman.tanggalKembali).toLocaleDateString('id-ID') : '-'
        const labId = peminjaman.labId

        // Cari nama laboratorium
        let labName = 'Laboratorium'
        if (labId) {
          const { data: lab } = await supabase.from('Laboratorium').select('nama').eq('id', labId).single()
          if (lab) labName = lab.nama
        }

        // Cari Kepala Lab & Kajur
        const { data: kepalaLabs } = await supabase
          .from('User')
          .select('email, nama')
          .eq('labId', labId || '')
          .eq('role', 'KEPALA_LAB')

        const { data: kajurs } = await supabase
          .from('User')
          .select('email, nama')
          .eq('role', 'KAJUR')

        const adminEmails = [
          ...(kepalaLabs || []).map(k => ({ email: k.email, nama: k.nama, role: 'KEPALA_LAB' })),
          ...(kajurs || []).map(k => ({ email: k.email, nama: k.nama, role: 'KAJUR' }))
        ]

        // 1. Jika peminjaman DOSEN (Auto-Approved)
        if (peminjaman.status === 'DISETUJUI') {
          // A. Kirim ke Dosen (Peminjam)
          await transporter.sendMail({
            from: `"Sistem Inventaris Lab" <${smtpUser}>`,
            to: borrower.email,
            subject: '✅ Peminjaman Alat Otomatis Disetujui (Dosen)',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <span style="font-size: 40px;">✅</span>
                  <h2 style="color: #16a34a; margin-top: 10px; font-weight: 800;">Peminjaman Otomatis Disetujui</h2>
                  <p style="color: #64748b; font-size: 14px; margin-top: 2px;">${labName}</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
                <p>Halo Dosen <strong>${borrower.nama}</strong>,</p>
                <p>Permohonan peminjaman peralatan laboratorium Anda telah **otomatis disetujui** berdasarkan wewenang Dosen.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <p style="margin: 5px 0;"><strong>Nama Alat:</strong> ${toolName}</p>
                  <p style="margin: 5px 0;"><strong>Jumlah Unit:</strong> ${amount} unit</p>
                  <p style="margin: 5px 0;"><strong>Tujuan:</strong> ${purpose}</p>
                  <p style="margin: 5px 0;"><strong>Waktu Pinjam:</strong> ${datePinjam} s.d. ${dateKembali}</p>
                  <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">DISETUJUI</span></p>
                </div>
                <p>Silakan unduh surat peminjaman ber-QR Code di dashboard Anda, cetak, dan tunjukkan ke Kepala Lab saat mengambil barang.</p>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
              </div>
            `
          });

          // B. Kirim info ke Kepala Lab & Kajur
          for (const admin of adminEmails) {
            if (admin.email) {
              await transporter.sendMail({
                from: `"Sistem Inventaris Lab" <${smtpUser}>`,
                to: admin.email,
                subject: '🔔 Pemberitahuan: Peminjaman Alat Otomatis Disetujui (Dosen)',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                      <span style="font-size: 40px;">🔔</span>
                      <h2 style="color: #0f172a; margin-top: 10px; font-weight: 800;">Peminjaman Dosen Disetujui</h2>
                      <p style="color: #64748b; font-size: 14px; margin-top: 2px;">${labName}</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
                    <p>Halo <strong>${admin.nama}</strong>,</p>
                    <p>Pemberitahuan bahwa Dosen telah melakukan peminjaman alat di ${labName} yang disetujui secara otomatis oleh sistem.</p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                      <p style="margin: 5px 0;"><strong>Nama Pengaju:</strong> Dosen ${borrower.nama}</p>
                      <p style="margin: 5px 0;"><strong>Nama Alat:</strong> ${toolName}</p>
                      <p style="margin: 5px 0;"><strong>Jumlah:</strong> ${amount} unit</p>
                      <p style="margin: 5px 0;"><strong>Waktu Pinjam:</strong> ${datePinjam} s.d. ${dateKembali}</p>
                    </div>
                    <p>Peminjam akan membawa surat fisik ber-QR Code untuk pengambilan barang fisik di laboratorium.</p>
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                    <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
                  </div>
                `
              });
            }
          }
        } 
        
        // 2. Jika peminjaman MAHASISWA (Pending Approval)
        else {
          // A. Kirim ke Mahasiswa (Peminjam)
          await transporter.sendMail({
            from: `"Sistem Inventaris Lab" <${smtpUser}>`,
            to: borrower.email,
            subject: '📝 Permohonan Peminjaman Alat Berhasil Diajukan',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <span style="font-size: 40px;">📝</span>
                  <h2 style="color: #0f172a; margin-top: 10px; font-weight: 800;">Permohonan Berhasil Dikirim</h2>
                  <p style="color: #64748b; font-size: 14px; margin-top: 2px;">${labName}</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
                <p>Halo <strong>${borrower.nama}</strong>,</p>
                <p>Permohonan peminjaman peralatan Anda telah berhasil diajukan dan saat ini sedang menunggu persetujuan Kepala Laboratorium.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                  <p style="margin: 5px 0;"><strong>Nama Alat:</strong> ${toolName}</p>
                  <p style="margin: 5px 0;"><strong>Jumlah Unit:</strong> ${amount} unit</p>
                  <p style="margin: 5px 0;"><strong>Tujuan Pinjam:</strong> ${purpose}</p>
                  <p style="margin: 5px 0;"><strong>Waktu Pinjam:</strong> ${datePinjam} s.d. ${dateKembali}</p>
                  <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #eab308; font-weight: bold;">MENUNGGU PERSETUJUAN</span></p>
                </div>
                <p>Sistem akan mengirimkan Gmail baru segera setelah Kepala Lab memberikan persetujuan atau menolak permohonan Anda.</p>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
              </div>
            `
          });

          // B. Kirim permintaan persetujuan ke Kepala Lab & Kajur
          for (const admin of adminEmails) {
            if (admin.email) {
              await transporter.sendMail({
                from: `"Sistem Inventaris Lab" <${smtpUser}>`,
                to: admin.email,
                subject: '🔔 Permohonan Peminjaman Alat Baru Memerlukan Persetujuan',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                      <span style="font-size: 40px;">📝</span>
                      <h2 style="color: #0f172a; margin-top: 10px; font-weight: 800;">Persetujuan Peminjaman Baru</h2>
                      <p style="color: #64748b; font-size: 14px; margin-top: 2px;">${labName}</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
                    <p>Halo <strong>${admin.nama}</strong>,</p>
                    <p>Ada permohonan peminjaman alat baru yang diajukan oleh pengguna sistem dan memerlukan persetujuan Anda.</p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                      <p style="margin: 5px 0;"><strong>Nama Pengaju:</strong> ${borrower.nama}</p>
                      <p style="margin: 5px 0;"><strong>Nama Alat:</strong> ${toolName}</p>
                      <p style="margin: 5px 0;"><strong>Jumlah:</strong> ${amount} unit</p>
                      <p style="margin: 5px 0;"><strong>Tujuan Pinjam:</strong> ${purpose}</p>
                      <p style="margin: 5px 0;"><strong>Waktu Pinjam:</strong> ${datePinjam} s.d. ${dateKembali}</p>
                    </div>
                    <p>Silakan masuk ke dashboard website ElectroLab-Inventory pada bagian Pusat Persetujuan untuk menyetujui atau menolak permohonan tersebut secara langsung.</p>
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                    <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
                  </div>
                `
              });
            }
          }
        }
      }
    }

    // =========================================================
    // C. STATUS PEMINJAMAN GANTI -> Kirim ke Peminjam (User)
    // =========================================================
    else if (action.startsWith('UPDATE_PEMINJAMAN_') && params.recordId) {
      const status = action.replace('UPDATE_PEMINJAMAN_', '') // DISETUJUI, DITOLAK, DIAMBIL, DIKEMBALIKAN
      
      const { data: peminjaman } = await supabase
        .from('Peminjaman')
        .select('*, alat:alatId(namaAlat), peminjam:peminjamId(nama, email)')
        .eq('id', params.recordId)
        .single()

      if (peminjaman && peminjaman.peminjam) {
        const borrower = peminjaman.peminjam
        const toolName = peminjaman.alat?.namaAlat || 'Alat'
        const amount = peminjaman.jumlah || 1
        const purpose = peminjaman.tujuan || '-'
        const datePinjam = peminjaman.tanggalPinjam ? new Date(peminjaman.tanggalPinjam).toLocaleDateString('id-ID') : '-'
        const dateKembali = peminjaman.tanggalKembali ? new Date(peminjaman.tanggalKembali).toLocaleDateString('id-ID') : '-'

        let statusLabel = status
        let icon = '🔔'
        let color = '#2563eb'
        let description = 'Status permohonan peminjaman peralatan Anda telah diperbarui.'

        if (status === 'DISETUJUI') {
          statusLabel = 'DISETUJUI'
          icon = '✅'
          color = '#16a34a'
          description = 'Permohonan peminjaman Anda telah disetujui! Silakan masuk ke dashboard untuk mengunduh dan mencetak Surat Peminjaman fisik dengan QR Code.'
        } else if (status === 'DITOLAK') {
          statusLabel = 'DITOLAK'
          icon = '❌'
          color = '#dc2626'
          description = 'Permohonan peminjaman Anda telah ditolak oleh Admin Laboratorium. Silakan hubungi admin terkait untuk detailnya.'
        } else if (status === 'DIAMBIL') {
          statusLabel = 'TELAH DIAMBIL (DIPINJAM)'
          icon = '📦'
          color = '#4f46e5'
          description = 'Peralatan fisik telah berhasil Anda ambil dari laboratorium. Pastikan untuk menjaga kondisi alat selama masa pemakaian.'
        } else if (status === 'DIKEMBALIKAN') {
          statusLabel = 'TELAH DIKEMBALIKAN'
          icon = '🎉'
          color = '#0d9488'
          description = 'Terima kasih! Peralatan telah berhasil dikembalikan ke laboratorium dalam kondisi baik. Transaksi peminjaman Anda selesai.'
        }

        await transporter.sendMail({
          from: `"Sistem Inventaris Lab" <${smtpUser}>`,
          to: borrower.email,
          subject: `${icon} Pembaruan Status Peminjaman: ${statusLabel}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 40px;">${icon}</span>
                <h2 style="color: #0f172a; margin-top: 10px; font-weight: 800;">Status Peminjaman Diperbarui</h2>
              </div>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
              <p>Halo <strong>${borrower.nama}</strong>,</p>
              <p>${description}</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Nama Alat:</strong> ${toolName}</p>
                <p style="margin: 5px 0;"><strong>Jumlah:</strong> ${amount} unit</p>
                <p style="margin: 5px 0;"><strong>Waktu Pinjam:</strong> ${datePinjam} s.d. ${dateKembali}</p>
                <p style="margin: 5px 0; text-align: center; margin-top: 10px; padding: 10px; background-color: #ffffff; border-radius: 6px; border: 1px dashed ${color};">
                  <span style="font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 2px;">STATUS TRANSAKSI:</span>
                  <span style="font-size: 16px; color: ${color}; font-weight: bold;">${statusLabel}</span>
                </p>
              </div>
              <p style="text-align: center; margin-top: 20px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background-color: ${color}; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">Masuk ke Dashboard</a>
              </p>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
            </div>
          `
        })
      }
    }

    // ========================================================
    // D. LAPORAN KERUSAKAN BARU -> Kirim ke Pelapor & Approver
    // ========================================================
    else if (action === 'CREATE_LAPORAN' && params.recordId) {
      const { data: laporan } = await supabase
        .from('LaporanKerusakan')
        .select('*, alat:alatId(namaAlat), pelapor:userId(nama, email)')
        .eq('id', params.recordId)
        .single()

      if (laporan && laporan.pelapor) {
        const reporter = laporan.pelapor
        const toolName = laporan.alat?.namaAlat || 'Alat'
        const description = laporan.deskripsi || '-'
        const labId = laporan.labId

        let labName = 'Laboratorium'
        if (labId) {
          const { data: lab } = await supabase.from('Laboratorium').select('nama').eq('id', labId).single()
          if (lab) labName = lab.nama
        }

        // Cari Kepala Lab & Kajur
        const { data: kepalaLabs } = await supabase
          .from('User')
          .select('email, nama')
          .eq('labId', labId || '')
          .eq('role', 'KEPALA_LAB')

        const { data: kajurs } = await supabase
          .from('User')
          .select('email, nama')
          .eq('role', 'KAJUR')

        const adminEmails = [
          ...(kepalaLabs || []).map(k => ({ email: k.email, nama: k.nama })),
          ...(kajurs || []).map(k => ({ email: k.email, nama: k.nama }))
        ]

        // 1. Kirim email konfirmasi ke Pelapor
        await transporter.sendMail({
          from: `"Sistem Inventaris Lab" <${smtpUser}>`,
          to: reporter.email,
          subject: '⚠️ Laporan Kerusakan Alat Berhasil Dikirim',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 40px;">⚠️</span>
                <h2 style="color: #d97706; margin-top: 10px; font-weight: 800;">Laporan Kerusakan Diterima</h2>
                <p style="color: #64748b; font-size: 14px; margin-top: 2px;">${labName}</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
              <p>Halo <strong>${reporter.nama}</strong>,</p>
              <p>Terima kasih atas laporan Anda. Laporan kerusakan peralatan laboratorium berikut telah sukses dikirim ke sistem:</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Nama Alat:</strong> ${toolName}</p>
                <p style="margin: 5px 0;"><strong>Laboratorium:</strong> ${labName}</p>
                <p style="margin: 5px 0;"><strong>Deskripsi Kerusakan:</strong></p>
                <p style="margin: 5px 0; font-style: italic; background-color: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">"${description}"</p>
              </div>
              <p>Tim Administrator Laboratorium akan segera melakukan pemeriksaan lapangan dan meng-update status penanganan kerusakan.</p>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
            </div>
          `
        });

        // 2. Kirim email notifikasi ke Kepala Lab & Kajur
        for (const admin of adminEmails) {
          if (admin.email) {
            await transporter.sendMail({
              from: `"Sistem Inventaris Lab" <${smtpUser}>`,
              to: admin.email,
              subject: '⚠️ Laporan Kerusakan Alat Baru Masuk',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 40px;">⚠️</span>
                    <h2 style="color: #d97706; margin-top: 10px; font-weight: 800;">Laporan Kerusakan Baru</h2>
                    <p style="color: #64748b; font-size: 14px; margin-top: 2px;">${labName}</p>
                  </div>
                  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
                  <p>Halo <strong>${admin.nama}</strong>,</p>
                  <p>Telah diterima laporan kerusakan peralatan laboratorium baru yang diajukan oleh pengguna sistem:</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                    <p style="margin: 5px 0;"><strong>Nama Pengaju:</strong> ${reporter.nama}</p>
                    <p style="margin: 5px 0;"><strong>Nama Alat:</strong> ${toolName}</p>
                    <p style="margin: 5px 0;"><strong>Deskripsi Kerusakan:</strong></p>
                    <p style="margin: 5px 0; font-style: italic; background-color: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">"${description}"</p>
                  </div>
                  <p>Silakan segera periksa dashboard ElectroLab-Inventory untuk melakukan pemrosesan, verifikasi fisik, atau penjadwalan reparasi alat.</p>
                  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                  <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
                </div>
              `
            });
          }
        }
      }
    }

    // ========================================================
    // E. LAPORAN KERUSAKAN SELESAI -> Kirim ke Pelapor (User)
    // ========================================================
    else if (action.startsWith('UPDATE_LAPORAN_') && params.recordId) {
      const status = action.replace('UPDATE_LAPORAN_', '') // SELESAI, DIPROSES, DITOLAK
      
      const { data: laporan } = await supabase
        .from('LaporanKerusakan')
        .select('*, alat:alatId(namaAlat), pelapor:userId(nama, email)')
        .eq('id', params.recordId)
        .single()

      if (laporan && laporan.pelapor) {
        const reporter = laporan.pelapor
        const toolName = laporan.alat?.namaAlat || 'Alat'
        const description = laporan.deskripsi || '-'

        let statusLabel = status
        let icon = '🔧'
        let color = '#2563eb'
        let expl = 'Status laporan kerusakan alat Anda telah diperbarui.'

        if (status === 'SELESAI') {
          statusLabel = 'SELESAI DIPERBAIKI'
          icon = '✅'
          color = '#16a34a'
          expl = 'Kabar baik! Laporan kerusakan alat Anda telah selesai ditangani dan diperbaiki secara fisik. Peralatan kini sudah kembali dalam kondisi prima dan siap untuk dipinjam/digunakan kembali.'
        } else if (status === 'DIPROSES') {
          statusLabel = 'SEDANG DIPROSES / REPARASI'
          icon = '🛠️'
          color = '#4f46e5'
          expl = 'Laporan kerusakan alat Anda sedang dalam penanganan oleh admin. Unit dipindahkan sementara ke area perbaikan/reparasi.'
        } else if (status === 'DITOLAK') {
          statusLabel = 'DITOLAK / TIDAK DAPAT DIPERBAIKI'
          icon = '❌'
          color = '#dc2626'
          expl = 'Laporan kerusakan Anda telah ditutup dengan status ditolak. Hal ini biasanya terjadi jika kerusakan bersifat permanen, tidak dapat diperbaiki kembali, atau laporan tidak valid.'
        }

        await transporter.sendMail({
          from: `"Sistem Inventaris Lab" <${smtpUser}>`,
          to: reporter.email,
          subject: `${icon} Pembaruan Status Laporan Kerusakan: ${statusLabel}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 40px;">${icon}</span>
                <h2 style="color: #0f172a; margin-top: 10px; font-weight: 800;">Laporan Diperbarui</h2>
              </div>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
              <p>Halo <strong>${reporter.nama}</strong>,</p>
              <p>${expl}</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Nama Alat:</strong> ${toolName}</p>
                <p style="margin: 5px 0;"><strong>Deskripsi Kerusakan:</strong> ${description}</p>
                <p style="margin: 5px 0; text-align: center; margin-top: 10px; padding: 10px; background-color: #ffffff; border-radius: 6px; border: 1px dashed ${color};">
                  <span style="font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 2px;">STATUS PENANGANAN:</span>
                  <span style="font-size: 16px; color: ${color}; font-weight: bold;">${statusLabel}</span>
                </p>
              </div>
              <p>Terima kasih banyak atas kontribusi aktif Anda dalam mengawasi dan melaporkan kondisi fasilitas di laboratorium kami.</p>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
            </div>
          `
        })
      }
    }
  } catch (err) {
    console.error('Email notification background error:', err)
  }
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await supabase.from('AuditLog').insert({
      id: uuid(),
      userId: params.userId,
      userName: params.userName,
      aksi: params.aksi,
      tabel: params.tabel,
      recordId: params.recordId || null,
      labId: params.labId || null,
      dataLama: params.dataLama || null,
      dataBaru: params.dataBaru || null,
      createdAt: new Date().toISOString(),
    })

    // Picu pengiriman email notifikasi di background (tidak memblokir request)
    triggerEmailNotification(params)
  } catch (err) {
    console.error('Audit log error:', err)
  }
}
