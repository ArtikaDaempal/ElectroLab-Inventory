import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { createAuditLog } from '@/lib/audit'

export async function PUT(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { nama, email, nip, nim, fotoUrl } = await req.json()

  if (!nama || nama.trim().length < 2) {
    return Response.json({ error: 'Nama minimal 2 karakter' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    nama: nama.trim(),
    updatedAt: new Date().toISOString(),
  }

  if (fotoUrl !== undefined) {
    updates.fotoUrl = fotoUrl
  }

  // Validasi dan update email
  if (email && email.trim()) {
    const cleanEmail = email.toLowerCase().trim()
    if (cleanEmail !== user.email) {
      const { data: exists } = await supabase.from('User').select('id').eq('email', cleanEmail).single()
      if (exists) return Response.json({ error: 'Email sudah digunakan oleh akun lain' }, { status: 409 })
      updates.email = cleanEmail
    }
  }

  // Update NIP hanya jika bukan mahasiswa
  if (user.role !== 'MAHASISWA' && nip !== undefined) {
    updates.nip = nip.trim() || null
    updates.nim = null // pastikan nim kosong
  }

  // Update NIM hanya jika mahasiswa
  if (user.role === 'MAHASISWA' && nim !== undefined) {
    updates.nim = nim.trim() || null
    updates.nip = null // pastikan nip kosong
  }

  const { data, error } = await supabase
    .from('User')
    .update(updates)
    .eq('id', user.id)
    .select('id,nama,email,role,nip,nim,labId,aktif,fotoUrl,createdAt,updatedAt')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  await createAuditLog({
    userId: user.id,
    userName: user.nama,
    aksi: 'UPDATE_PROFIL',
    tabel: 'User',
    recordId: user.id,
    dataBaru: { nama: updates.nama, email: updates.email || user.email, nip: updates.nip, nim: updates.nim, fotoUrl: updates.fotoUrl },
  })

  return Response.json(data)
}
