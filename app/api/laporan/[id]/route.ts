import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['KEPALA_LAB', 'DOSEN', 'KAJUR'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { status, catatan } = await req.json()

  const { data: old } = await supabase.from('LaporanKerusakan').select('*').eq('id', id).single()
  if (!old) return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 })

  const { data, error } = await supabase.from('LaporanKerusakan').update({
    status, catatan: catatan || null,
    diprosesOleh: user.id,
    updatedAt: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  await createAuditLog({ userId: user.id, userName: user.nama, aksi: `UPDATE_LAPORAN_${status}`, tabel: 'LaporanKerusakan', recordId: id, dataLama: old, dataBaru: data })
  return Response.json(data)
}
