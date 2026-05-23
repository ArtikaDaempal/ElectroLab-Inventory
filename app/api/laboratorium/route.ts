import { NextRequest } from 'next/server'
import { v4 as uuid } from 'uuid'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user || user.role !== 'KAJUR') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Ambil semua laboratorium
  const { data: labs, error: labError } = await supabase.from('Laboratorium').select('*').order('nama', { ascending: true })
  if (labError) return Response.json({ error: labError.message }, { status: 500 })

  // Ambil semua user dengan role KEPALA_LAB
  const { data: kepalaLabs, error: userError } = await supabase.from('User').select('id, nama, email, labId').eq('role', 'KEPALA_LAB')
  if (userError) return Response.json({ error: userError.message }, { status: 500 })

  // Petakan kepala lab ke masing-masing lab
  const labsWithKepala = labs.map(lab => {
    const kepala = kepalaLabs.find(u => u.labId === lab.id)
    return {
      ...lab,
      kepalaLab: kepala ? { id: kepala.id, nama: kepala.nama, email: kepala.email } : null
    }
  })

  return Response.json(labsWithKepala)
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'KAJUR') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { nama, kode, deskripsi, prodi, kepalaLabId } = await req.json()
  if (!nama || !kode) return Response.json({ error: 'Nama dan Kode wajib diisi' }, { status: 400 })

  const newLabId = uuid()
  const { data, error } = await supabase.from('Laboratorium').insert({
    id: newLabId, nama, kode, deskripsi, prodi, createdAt: new Date().toISOString()
  }).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Jika ada kepalaLabId yang ditugaskan
  if (kepalaLabId && kepalaLabId !== 'none') {
    const { error: userError } = await supabase.from('User').update({
      role: 'KEPALA_LAB',
      labId: newLabId
    }).eq('id', kepalaLabId)
    
    if (userError) return Response.json({ error: 'Lab dibuat, tetapi gagal menugaskan Kepala Lab: ' + userError.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'KAJUR') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, nama, kode, deskripsi, prodi, kepalaLabId } = await req.json()
  const { data, error } = await supabase.from('Laboratorium').update({
    nama, kode, deskripsi, prodi
  }).eq('id', id).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Logika Pertukaran/Pembaruan Kepala Lab
  // 1. Dapatkan Kepala Lab lama di lab ini
  const { data: oldKepala } = await supabase
    .from('User')
    .select('id')
    .eq('labId', id)
    .eq('role', 'KEPALA_LAB')
    .single()

  const oldKepalaId = oldKepala?.id

  // Jika kepala lab diubah
  if (kepalaLabId === 'none' || !kepalaLabId) {
    // KAJUR ingin mengosongkan Kepala Lab
    if (oldKepalaId) {
      await supabase.from('User').update({ role: 'DOSEN', labId: null }).eq('id', oldKepalaId)
    }
  } else if (kepalaLabId !== oldKepalaId) {
    // 2. Berhentikan Kepala Lab lama (turun pangkat jadi DOSEN biasa dan labId diset null)
    if (oldKepalaId) {
      await supabase.from('User').update({ role: 'DOSEN', labId: null }).eq('id', oldKepalaId)
    }
    
    // 3. Tugaskan Dosen baru menjadi Kepala Lab di lab ini
    await supabase.from('User').update({ role: 'KEPALA_LAB', labId: id }).eq('id', kepalaLabId)
  }

  return Response.json(data)
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'KAJUR') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return Response.json({ error: 'ID tidak ditemukan' }, { status: 400 })

  // Cek apakah ada alat di lab ini
  const { count: alatCount } = await supabase.from('Peralatan').select('*', { count: 'exact', head: true }).eq('labId', id)
  if ((alatCount || 0) > 0) {
    return Response.json({ error: 'Tidak dapat menghapus Lab yang masih memiliki Peralatan' }, { status: 400 })
  }

  // Jika lab dihapus, turunkan Kepala Lab lama di lab ini menjadi DOSEN
  await supabase.from('User').update({ role: 'DOSEN', labId: null }).eq('labId', id)

  const { error } = await supabase.from('Laboratorium').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  
  return Response.json({ ok: true })
}
