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

    // ==========================================
    // 1. PEMINJAMAN BARU -> Kirim ke Kepala Lab
    // ==========================================
    if (action === 'CREATE_PEMINJAMAN' && params.labId) {
      // Cari nama lab
      const { data: lab } = await supabase.from('Laboratorium').select('nama').eq('id', params.labId).single()
      const labName = lab?.nama || 'Laboratorium'

      // Cari email Kepala Lab
      const { data: kepalaLab } = await supabase
        .from('User')
        .select('email, nama')
        .eq('labId', params.labId)
        .eq('role', 'KEPALA_LAB')
        .single()

      if (kepalaLab?.email) {
        await transporter.sendMail({
          from: `"Sistem Inventaris Lab" <${smtpUser}>`,
          to: kepalaLab.email,
          subject: '🔔 Permohonan Peminjaman Alat Baru',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 36px;">📝</span>
                <h2 style="color: #0f172a; margin-top: 10px; font-weight: 800;">Peminjaman Baru Memerlukan Persetujuan</h2>
                <p style="color: #64748b; font-size: 14px; margin-top: 2px;">${labName}</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
              <p>Halo <strong>${kepalaLab.nama}</strong>,</p>
              <p>Ada permohonan peminjaman alat baru yang diajukan oleh pengguna sistem di laboratorium yang Anda kelola.</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Nama Pengaju:</strong> ${params.userName}</p>
                <p style="margin: 5px 0;"><strong>Laboratorium:</strong> ${labName}</p>
                <p style="margin: 5px 0;"><strong>Waktu Pengajuan:</strong> ${new Date().toLocaleString('id-ID')}</p>
              </div>
              <p>Silakan masuk ke dashboard website untuk memeriksa dan menyetujui atau menolak permohonan tersebut secara langsung.</p>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
              <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
            </div>
          `
        })
      }
    }

    // =========================================================
    // 2. STATUS PEMINJAMAN GANTI -> Kirim ke Peminjam (User)
    // =========================================================
    else if (action.startsWith('UPDATE_PEMINJAMAN_') && params.dataLama) {
      const status = action.replace('UPDATE_PEMINJAMAN_', '') // DISETUJUI, DITOLAK, DIAMBIL, DIKEMBALIKAN
      const targetUserId = params.dataLama.userId

      if (targetUserId) {
        // Cari email peminjam
        const { data: targetUser } = await supabase
          .from('User')
          .select('email, nama')
          .eq('id', targetUserId)
          .single()

        if (targetUser?.email) {
          let statusLabel = status
          let icon = '🔔'
          let color = '#2563eb'

          if (status === 'DISETUJUI') {
            statusLabel = 'DISETUJUI'
            icon = '✅'
            color = '#16a34a'
          } else if (status === 'DITOLAK') {
            statusLabel = 'DITOLAK'
            icon = '❌'
            color = '#dc2626'
          } else if (status === 'DIAMBIL') {
            statusLabel = 'TELAH DIAMBIL (DIPINJAM)'
            icon = '📦'
            color = '#4f46e5'
          } else if (status === 'DIKEMBALIKAN') {
            statusLabel = 'TELAH DIKEMBALIKAN'
            icon = '🎉'
            color = '#0d9488'
          }

          await transporter.sendMail({
            from: `"Sistem Inventaris Lab" <${smtpUser}>`,
            to: targetUser.email,
            subject: `${icon} Pembaruan Status Peminjaman Alat`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <span style="font-size: 36px;">${icon}</span>
                  <h2 style="color: #0f172a; margin-top: 10px; font-weight: 800;">Pembaruan Status Peminjaman</h2>
                </div>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
                <p>Halo <strong>${targetUser.nama}</strong>,</p>
                <p>Status permohonan peminjaman peralatan laboratorium Anda telah diperbarui oleh Admin.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 5px 0; font-size: 13px; color: #64748b; font-weight: bold; uppercase;">STATUS SEKARANG:</p>
                  <p style="margin: 5px 0; font-size: 18px; color: ${color}; font-weight: 800; letter-spacing: 0.05em;">${statusLabel}</p>
                </div>
                <p>Silakan masuk ke akun Anda di website untuk melihat detail alat yang disetujui / ditolak.</p>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
              </div>
            `
          })
        }
      }
    }

    // ============================================
    // 3. LAPORAN KERUSAKAN BARU -> Kirim ke Kepala Lab
    // ============================================
    else if (action === 'CREATE_LAPORAN' && params.labId) {
      const { data: lab } = await supabase.from('Laboratorium').select('nama').eq('id', params.labId).single()
      const labName = lab?.nama || 'Laboratorium'

      const { data: kepalaLab } = await supabase
        .from('User')
        .select('email, nama')
        .eq('labId', params.labId)
        .eq('role', 'KEPALA_LAB')
        .single()

      if (kepalaLab?.email) {
        await transporter.sendMail({
          from: `"Sistem Inventaris Lab" <${smtpUser}>`,
          to: kepalaLab.email,
          subject: '⚠️ Laporan Kerusakan Alat Baru',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 36px;">⚠️</span>
                <h2 style="color: #d97706; margin-top: 10px; font-weight: 800;">Laporan Kerusakan Baru Masuk</h2>
                <p style="color: #64748b; font-size: 14px; margin-top: 2px;">${labName}</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
              <p>Halo <strong>${kepalaLab.nama}</strong>,</p>
              <p>Telah diterima laporan kerusakan peralatan laboratorium baru yang diajukan oleh pengguna.</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; font-style: italic;">
                <p style="margin: 0; color: #334155; line-height: 1.5;">"${params.dataBaru?.deskripsi || 'Ada kerusakan pada alat laboratorium'}"</p>
              </div>
              <p>Silakan segera periksa website untuk menjadwalkan perbaikan atau memproses laporan kerusakan tersebut.</p>
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
            </div>
          `
        })
      }
    }

    // ========================================================
    // 4. LAPORAN KERUSAKAN SELESAI -> Kirim ke Pelapor (User)
    // ========================================================
    else if (action.startsWith('UPDATE_LAPORAN_') && params.dataLama) {
      const status = action.replace('UPDATE_LAPORAN_', '') // SELESAI, DIPROSES, DITOLAK
      const targetUserId = params.dataLama.userId

      if (targetUserId) {
        const { data: targetUser } = await supabase
          .from('User')
          .select('email, nama')
          .eq('id', targetUserId)
          .single()

        if (targetUser?.email) {
          let statusLabel = status
          let icon = '🔧'
          let color = '#2563eb'

          if (status === 'SELESAI') {
            statusLabel = 'SELESAI DIPERBAIKI'
            icon = '✅'
            color = '#16a34a'
          } else if (status === 'DIPROSES') {
            statusLabel = 'SEDANG DIPROSES / DIPERBAIKI'
            icon = '🛠️'
            color = '#4f46e5'
          } else if (status === 'DITOLAK') {
            statusLabel = 'DITOLAK / TIDAK DAPAT DIPERBAIKI'
            icon = '❌'
            color = '#dc2626'
          }

          await transporter.sendMail({
            from: `"Sistem Inventaris Lab" <${smtpUser}>`,
            to: targetUser.email,
            subject: `${icon} Pembaruan Status Laporan Kerusakan`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <span style="font-size: 36px;">${icon}</span>
                  <h2 style="color: #0f172a; margin-top: 10px; font-weight: 800;">Update Laporan Kerusakan</h2>
                </div>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
                <p>Halo <strong>${targetUser.nama}</strong>,</p>
                <p>Status laporan kerusakan alat yang Anda kirimkan sebelumnya telah diperbarui oleh Admin Laboratorium.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 5px 0; font-size: 13px; color: #64748b; font-weight: bold; uppercase;">STATUS PERBAIKAN:</p>
                  <p style="margin: 5px 0; font-size: 18px; color: ${color}; font-weight: 800; letter-spacing: 0.05em;">${statusLabel}</p>
                </div>
                <p>Terima kasih atas laporan Anda yang membantu kami menjaga kondisi peralatan laboratorium tetap prima.</p>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 10px; text-align: center; margin: 0;">Sistem Inventaris Laboratorium Teknik Elektro</p>
              </div>
            `
          })
        }
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
