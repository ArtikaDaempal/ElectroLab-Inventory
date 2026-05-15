import { NextRequest } from 'next/server'
import { v4 as uuid } from 'uuid'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase.from('LaporanKerusakan').select(`
    *, 
    alat:alatId(namaAlat, kodeAlat, fotoUrl),
    pelapor:pelaporId(nama, email),
    diproses:diprosesOleh(nama)
  `).order('createdAt', { ascending: false })

  const status = req.nextUrl.searchParams.get('status')
  if (status && status !== 'all') query = query.eq('status', status)

  if (user.role === 'MAHASISWA' || user.role === 'DOSEN') {
    query = query.eq('pelaporId', user.id)
  } else if (user.role !== 'KAJUR') {
    query = query.eq('labId', user.labId)
  }

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { alatId, deskripsi, fotoUrl } = await req.json()
  const { data: alat } = await supabase.from('Peralatan').select('labId').eq('id', alatId).single()
  if (!alat) return Response.json({ error: 'Alat tidak ditemukan' }, { status: 404 })

  const now = new Date().toISOString()
  const { data, error } = await supabase.from('LaporanKerusakan').insert({
    id: uuid(), alatId, pelaporId: user.id, deskripsi,
    fotoUrl: fotoUrl || null, status: 'DILAPOR', 
    labId: alat.labId, // Inherit labId from the equipment
    createdAt: now, updatedAt: now,
  }).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  await createAuditLog({ userId: user.id, userName: user.nama, aksi: 'CREATE_LAPORAN', tabel: 'LaporanKerusakan', recordId: data.id, labId: data.labId })
  return Response.json(data, { status: 201 })
}
