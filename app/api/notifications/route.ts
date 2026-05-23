import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Ambil 50 audit logs penting terbaru untuk diproses filternya secara presisi di JS
  const importantActions = [
    'CREATE_PEMINJAMAN', 
    'APPROVE_PEMINJAMAN',
    'UPDATE_PEMINJAMAN_DISETUJUI',
    'UPDATE_PEMINJAMAN_DITOLAK',
    'UPDATE_PEMINJAMAN_DIAMBIL',
    'RETURN_PEMINJAMAN', 
    'CREATE_LAPORAN', 
    'UPDATE_LAPORAN_SELESAI',
    'UPDATE_LAPORAN_DIPROSES',
    'UPDATE_LAPORAN_DITOLAK'
  ]

  const { data, error } = await supabase
    .from('AuditLog')
    .select('*')
    .in('aksi', importantActions)
    .order('createdAt', { ascending: false })
    .limit(50)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // =============================================================
  // LOGIKA FILTERING NOTIFIKASI BERDASARKAN HAK AKSES DAN SASARAN
  // =============================================================
  const filteredData = (data || []).filter((log: any) => {
    // 1. KAJUR berhak melihat semua notifikasi
    if (user.role === 'KAJUR') return true

    // 2. KEPALA_LAB hanya melihat aktivitas yang berada di laboratoriumnya
    if (user.role === 'KEPALA_LAB') {
      return log.labId === user.labId
    }

    // 3. MAHASISWA & DOSEN (Peminjam biasa)
    if (user.role === 'MAHASISWA' || user.role === 'DOSEN') {
      // Peminjam biasa TIDAK BOLEH melihat notifikasi pengajuan baru (CREATE_PEMINJAMAN / CREATE_LAPORAN)
      if (log.aksi === 'CREATE_PEMINJAMAN' || log.aksi === 'CREATE_LAPORAN') {
        return false
      }

      // Mereka hanya boleh melihat pembaruan status (APPROVE, DIAMBIL, RETURN, SELESAI, dll.) 
      // yang ditujukan khusus untuk mereka sendiri (peminjam/pelapor)
      const targetUserId = log.dataLama?.userId || log.dataBaru?.userId || log.userId
      return targetUserId === user.id
    }

    return false
  })

  // Format log audit menjadi objek notifikasi yang ramah pengguna
  const notifications = filteredData.slice(0, 10).map((log: any) => {
    let title = 'Aktivitas Baru'
    let message = log.aksi.replace('_', ' ')
    
    if (log.aksi === 'CREATE_PEMINJAMAN') {
      title = 'Peminjaman Baru'
      message = `${log.userName} mengajukan peminjaman alat.`
    } else if (log.aksi === 'APPROVE_PEMINJAMAN' || log.aksi === 'UPDATE_PEMINJAMAN_DISETUJUI') {
      title = 'Peminjaman Disetujui'
      message = `Permintaan peminjaman alat telah disetujui oleh admin.`
    } else if (log.aksi === 'UPDATE_PEMINJAMAN_DITOLAK') {
      title = 'Peminjaman Ditolak'
      message = `Permintaan peminjaman alat Anda telah ditolak oleh admin.`
    } else if (log.aksi === 'UPDATE_PEMINJAMAN_DIAMBIL') {
      title = 'Alat Telah Diambil'
      message = `${log.userName} telah mengambil alat dari laboratorium.`
    } else if (log.aksi === 'RETURN_PEMINJAMAN') {
      title = 'Alat Dikembalikan'
      message = `Alat telah berhasil dikembalikan ke laboratorium.`
    } else if (log.aksi === 'CREATE_LAPORAN') {
      title = 'Laporan Kerusakan'
      message = `${log.userName} melaporkan masalah pada alat.`
    } else if (log.aksi === 'UPDATE_LAPORAN_SELESAI') {
      title = 'Laporan Selesai'
      message = `Laporan kerusakan alat telah diperbaiki dan dinyatakan selesai.`
    } else if (log.aksi === 'UPDATE_LAPORAN_DIPROSES') {
      title = 'Laporan Diproses'
      message = `Laporan kerusakan alat Anda sedang dalam penanganan/perbaikan.`
    } else if (log.aksi === 'UPDATE_LAPORAN_DITOLAK') {
      title = 'Laporan Ditolak'
      message = `Laporan kerusakan alat Anda telah ditolak/ditutup oleh admin.`
    }

    return {
      id: log.id,
      title,
      message,
      createdAt: log.createdAt,
      read: false
    }
  })

  return Response.json(notifications)
}
