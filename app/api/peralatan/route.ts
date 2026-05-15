import { NextRequest } from 'next/server'
import { v4 as uuid } from 'uuid'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  let query = supabase.from('Peralatan').select('*').order('createdAt', { ascending: false })

  const search = sp.get('search')
  if (search) query = query.ilike('namaAlat', `%${search}%`)

  const kodeAlat = sp.get('kodeAlat')
  if (kodeAlat) query = query.eq('kodeAlat', kodeAlat)

  const kategori = sp.get('kategori')
  if (kategori && kategori !== 'all') query = query.eq('kategori', kategori)

  const prodi = sp.get('prodi')
  if (prodi && prodi !== 'all') query = query.eq('prodi', prodi)

  const namaLab = sp.get('namaLab')
  if (namaLab && namaLab !== 'all') query = query.eq('namaLab', namaLab)

  const filterLabId = sp.get('labId')
  if (filterLabId && filterLabId !== 'all') query = query.eq('labId', filterLabId)
  
  // Multi-Lab Filter
  // KAJUR, MAHASISWA, dan DOSEN bisa melihat semua alat (Katalog)
  // KEPALA_LAB dibatasi hanya pada lab miliknya sendiri
  if (!['KAJUR', 'MAHASISWA', 'DOSEN'].includes(user.role)) {
    if (user.labId) {
      query = query.eq('labId', user.labId)
    } else {
      // Jika staf tidak punya labId (pengaman), jangan tampilkan data
      query = query.eq('labId', '00000000-0000-0000-0000-000000000000')
    }
  }

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  // KAJUR, KEPALA_LAB, dan DOSEN boleh menambah alat
  if (!['KEPALA_LAB', 'DOSEN', 'KAJUR'].includes(user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { namaAlat, kategori, merek, kodeAlat, stokTotal, stokBaik, stokRusak, stokButuhPerbaikan, namaLab, prodi, kondisi, fotoUrl, labId } = body

  if (!namaAlat || !kategori || !kodeAlat) return Response.json({ error: 'Field wajib tidak lengkap' }, { status: 400 })

  const { data: exists } = await supabase.from('Peralatan').select('id').eq('kodeAlat', kodeAlat).single()
  if (exists) return Response.json({ error: 'Kode alat sudah digunakan' }, { status: 409 })

  const now = new Date().toISOString()
  
  // Tentukan labId: Jika KAJUR, ambil dari body. Jika staf, ambil dari profilnya.
  const finalLabId = user.role === 'KAJUR' ? (labId || body.labId) : user.labId

  if (!finalLabId) return Response.json({ error: 'Laboratorium tidak ditentukan' }, { status: 400 })

  const { data, error } = await supabase.from('Peralatan').insert({
    id: uuid(), namaAlat, kategori, merek: merek || null, kodeAlat,
    stokTotal: Number(stokTotal) || 0, stokBaik: Number(stokBaik) || 0,
    stokRusak: Number(stokRusak) || 0, stokButuhPerbaikan: Number(stokButuhPerbaikan) || 0,
    namaLab: namaLab || null, prodi: prodi || null, kondisi: kondisi || null,
    fotoUrl: fotoUrl || null,
    labId: finalLabId,
    createdAt: now, updatedAt: now,
  }).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  await createAuditLog({ 
    userId: user.id, 
    userName: user.nama, 
    aksi: 'CREATE_PERALATAN', 
    tabel: 'Peralatan', 
    recordId: data.id, 
    labId: data.labId, 
    dataBaru: data 
  })
  return Response.json(data, { status: 201 })
}
