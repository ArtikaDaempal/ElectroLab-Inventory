import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Notifications are derived from Audit Logs for relevant activities
  let query = supabase.from('AuditLog')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(10)

  // Filter out non-essential notifications (User updates, registrations, logins)
  // Only keep inventory and damage report related actions
  const importantActions = [
    'CREATE_PEMINJAMAN', 
    'APPROVE_PEMINJAMAN', 
    'UPDATE_PEMINJAMAN_DIAMBIL',
    'RETURN_PEMINJAMAN', 
    'CREATE_LAPORAN', 
    'UPDATE_LAPORAN_SELESAI'
  ]
  query = query.in('aksi', importantActions)

  // Role-based filtering for notifications
  if (user.role === 'KEPALA_LAB') {
    // Kepala Lab only see activities related to their lab
    query = query.eq('labId', user.labId)
  } else if (user.role === 'MAHASISWA' || user.role === 'DOSEN') {
    // Users only see their own activities or status changes
    query = query.eq('userId', user.id)
  }

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Format logs into human-readable notifications
  const notifications = data.map((log: any) => {
    let title = 'Aktivitas Baru'
    let message = log.aksi.replace('_', ' ')
    
    if (log.aksi === 'CREATE_PEMINJAMAN') {
      title = 'Peminjaman Baru'
      message = `${log.userName} mengajukan peminjaman alat.`
    } else if (log.aksi === 'APPROVE_PEMINJAMAN') {
      title = 'Peminjaman Disetujui'
      message = `Permintaan peminjaman alat telah disetujui oleh admin.`
    } else if (log.aksi === 'UPDATE_PEMINJAMAN_DIAMBIL') {
      title = 'Alat Telah Diambil'
      message = `${log.userName} telah mengambil alat dari lab.`
    } else if (log.aksi === 'RETURN_PEMINJAMAN') {
      title = 'Alat Dikembalikan'
      message = `Alat telah berhasil dikembalikan ke lab.`
    } else if (log.aksi === 'CREATE_LAPORAN') {
      title = 'Laporan Kerusakan'
      message = `${log.userName} melaporkan masalah pada alat.`
    } else if (log.aksi === 'UPDATE_LAPORAN_SELESAI') {
      title = 'Laporan Selesai'
      message = `Laporan kerusakan alat telah diperbaiki dan selesai.`
    }

    return {
      id: log.id,
      title,
      message,
      createdAt: log.createdAt,
      read: false // In-memory/mock for now since we don't have a ReadStatus table
    }
  })

  return Response.json(notifications)
}
