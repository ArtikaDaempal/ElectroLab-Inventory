import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Base queries
  let pQ = supabase.from('Peralatan').select('stokTotal,stokBaik,stokRusak,stokButuhPerbaikan,kategori,labId')
  let lQ = supabase.from('LaporanKerusakan').select('status,createdAt,labId,pelaporId')
  let pmQ = supabase.from('Peminjaman').select('status,createdAt,labId,peminjamId')
  let uQ = supabase.from('User').select('id,role,aktif,pendingApproval,labId').in('role', ['MAHASISWA', 'DOSEN', 'KEPALA_LAB'])

  // ROLE-BASED FILTERING
  if (user.role === 'KAJUR') {
    // KAJUR: No filter
  } else if (user.role === 'KEPALA_LAB') {
    if (user.labId) {
      pQ = pQ.eq('labId', user.labId)
      lQ = lQ.eq('labId', user.labId)
      pmQ = pmQ.eq('labId', user.labId)
      uQ = uQ.eq('labId', user.labId)
    }
  } else if (user.role === 'MAHASISWA' || user.role === 'DOSEN') {
    lQ = lQ.eq('pelaporId', user.id)
    pmQ = pmQ.eq('peminjamId', user.id)
    uQ = uQ.eq('id', user.id)
    
    // Mahasiswa dan Dosen bisa melihat total alat dari seluruh lab
  }

  const [peralatan, laporan, peminjaman, users] = await Promise.all([pQ, lQ, pmQ, uQ])

  const p = peralatan.data || []
  const l = laporan.data || []
  const pm = peminjaman.data || []
  const u = users.data || []

  // Metrics
  const totalAlat = p.reduce((s, r) => s + (r.stokTotal || 0), 0)
  const stokBaik = p.reduce((s, r) => s + (r.stokBaik || 0), 0)
  const stokRusak = p.reduce((s, r) => s + (r.stokRusak || 0), 0)
  const stokPerbaikan = p.reduce((s, r) => s + (r.stokButuhPerbaikan || 0), 0)

  const myActiveLoans = pm.filter(r => r.status === 'DISETUJUI' || r.status === 'DIAMBIL').length
  const myPendingLoans = pm.filter(r => r.status === 'PENDING').length
  const myReports = l.length

  const kategoriGroups: Record<string, number> = {}
  p.forEach((r) => {
    if (!kategoriGroups[r.kategori]) kategoriGroups[r.kategori] = 0
    kategoriGroups[r.kategori] += r.stokTotal || 0
  })

  const laporanStatus = {
    DILAPOR: l.filter((r) => r.status === 'DILAPOR').length,
    DIPROSES: l.filter((r) => r.status === 'DIPROSES').length,
    SELESAI: l.filter((r) => r.status === 'SELESAI').length,
    DITOLAK: l.filter((r) => r.status === 'DITOLAK').length,
  }

  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const laporanTrend = months.map((m) => l.filter((r) => r.createdAt?.startsWith(m)).length)
  const peminjamanTrend = months.map((m) => pm.filter((r) => r.createdAt?.startsWith(m)).length)

  // Group pending peminjaman to show as one notification if submitted together
  const pendingPmGroups = new Set()
  pm.filter(r => r.status === 'PENDING').forEach(r => {
    const minute = r.createdAt?.substring(0, 16)
    pendingPmGroups.add(`${r.peminjamId}-${minute}-${r.tujuan}`)
  })

  return Response.json({
    totalAlat, stokBaik, stokRusak, stokPerbaikan,
    totalUsers: u.filter((r) => r.aktif).length,
    pendingUsers: u.filter((r) => r.pendingApproval).length,
    pendingLaporan: l.filter((r) => r.status === 'DILAPOR').length,
    pendingPeminjaman: pendingPmGroups.size,
    myActiveLoans,
    myPendingLoans,
    myReports,
    kategoriGroups,
    laporanStatus,
    trend: { months, laporan: laporanTrend, peminjaman: peminjamanTrend },
  })
}
