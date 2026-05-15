import { NextRequest } from 'next/server'
import { v4 as uuid } from 'uuid'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user || user.role !== 'KAJUR') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.from('Laboratorium').select('*').order('nama', { ascending: true })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'KAJUR') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { nama, kode, deskripsi, prodi } = await req.json()
  if (!nama || !kode) return Response.json({ error: 'Nama dan Kode wajib diisi' }, { status: 400 })

  const { data, error } = await supabase.from('Laboratorium').insert({
    id: uuid(), nama, kode, deskripsi, prodi, createdAt: new Date().toISOString()
  }).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'KAJUR') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, nama, kode, deskripsi, prodi } = await req.json()
  const { data, error } = await supabase.from('Laboratorium').update({
    nama, kode, deskripsi, prodi
  }).eq('id', id).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || user.role !== 'KAJUR') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return Response.json({ error: 'ID tidak ditemukan' }, { status: 400 })

  // Cek apakah ada alat atau user di lab ini
  const { count: userCount } = await supabase.from('User').select('*', { count: 'exact', head: true }).eq('labId', id)
  const { count: alatCount } = await supabase.from('Peralatan').select('*', { count: 'exact', head: true }).eq('labId', id)

  if ((userCount || 0) > 0 || (alatCount || 0) > 0) {
    return Response.json({ error: 'Tidak dapat menghapus Lab yang masih memiliki User atau Peralatan' }, { status: 400 })
  }

  const { error } = await supabase.from('Laboratorium').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  
  return Response.json({ ok: true })
}
