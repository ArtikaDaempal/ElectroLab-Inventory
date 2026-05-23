import { NextRequest } from 'next/server'
import { v4 as uuid } from 'uuid'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase.from('Peminjaman').select(`
    *,
    alat:alatId(namaAlat, kodeAlat, fotoUrl),
    peminjam:peminjamId(nama, email, nim, role)
  `).order('createdAt', { ascending: false })

  const status = req.nextUrl.searchParams.get('status')
  if (status && status !== 'all') query = query.eq('status', status)

  const isMy = req.nextUrl.searchParams.get('my') === 'true'

  if (user.role === 'MAHASISWA' || user.role === 'DOSEN' || isMy) {
    query = query.eq('peminjamId', user.id)
  } else if (user.role !== 'KAJUR') {
    // KEPALA_LAB only sees their lab's loans
    query = query.eq('labId', user.labId)
  }

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const isBatch = Array.isArray(body.items)
  
  // If not batch, wrap in batch-like structure
  const items = isBatch ? body.items : [{ alatId: body.alatId, jumlah: body.jumlah }]
  const { tujuan, tanggalPinjam, tanggalKembali } = isBatch ? body : body

  if (items.length === 0 || !tujuan || !tanggalPinjam) return Response.json({ error: 'Data tidak lengkap' }, { status: 400 })

  // 1. Check Overdue Penalty
  const today = new Date().toISOString().split('T')[0]
  const { data: overdue } = await supabase.from('Peminjaman')
    .select('id')
    .eq('peminjamId', user.id)
    .eq('status', 'DIAMBIL')
    .not('tanggalKembali', 'is', null)
    .lt('tanggalKembali', today)
  
  if (overdue && overdue.length > 0) {
    return Response.json({ error: 'Penalti: Anda memiliki alat yang belum dikembalikan melewati batas waktu.' }, { status: 403 })
  }

  // 2. Check Student Limit
  if (user.role === 'MAHASISWA') {
    const { count } = await supabase.from('Peminjaman')
      .select('*', { count: 'exact', head: true })
      .eq('peminjamId', user.id)
      .in('status', ['PENDING', 'DISETUJUI', 'DIAMBIL'])
    
    if (count !== null && count >= 3) {
      return Response.json({ error: 'Limit Tercapai: Mahasiswa maksimal memiliki 3 peminjaman aktif.' }, { status: 403 })
    }
  }

  const initialStatus = user.role === 'DOSEN' ? 'DISETUJUI' : 'PENDING'
  const now = new Date().toISOString()
  const groupId = uuid()

  // Prepare inserts
  const inserts = []
  for (const item of items) {
    const { data: alat } = await supabase.from('Peralatan').select('stokBaik, labId').eq('id', item.alatId).single()
    if (!alat) continue
    if (alat.stokBaik < item.jumlah) return Response.json({ error: `Stok tidak cukup untuk salah satu alat.` }, { status: 400 })

    inserts.push({
      id: uuid(), 
      alatId: item.alatId, 
      peminjamId: user.id, 
      jumlah: Number(item.jumlah),
      tujuan, 
      tanggalPinjam, 
      tanggalKembali: tanggalKembali || null,
      status: initialStatus, 
      labId: alat.labId,
      createdAt: now, 
      updatedAt: now,
      // We'll use catatan to store groupId for now if we can't add a column, 
      // or we can just rely on 'now' being the same.
      // Actually, let's just use 'now' as the group key in the frontend.
    })
  }

  const { data, error } = await supabase.from('Peminjaman').insert(inserts).select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  
  if (data && data.length > 0) {
    const first = data[0]
    await createAuditLog({ 
      userId: user.id, 
      userName: user.nama, 
      aksi: 'CREATE_PEMINJAMAN', 
      tabel: 'Peminjaman', 
      recordId: first.id, 
      labId: first.labId,
      dataBaru: {
        itemsCount: data.length,
        peminjamNama: user.nama
      }
    })
  }

  return Response.json(data, { status: 201 })
}
