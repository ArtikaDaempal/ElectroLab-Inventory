import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { createAuditLog } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { oldPassword, newPassword, confirmPassword } = await req.json()

  if (!oldPassword || !newPassword) {
    return Response.json({ error: 'Semua kolom password wajib diisi' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return Response.json({ error: 'Password baru minimal 8 karakter' }, { status: 400 })
  }
  if (newPassword !== confirmPassword) {
    return Response.json({ error: 'Konfirmasi password tidak cocok' }, { status: 400 })
  }

  // Ambil password hash dari database
  const { data: dbUser, error: fetchErr } = await supabase
    .from('User')
    .select('password')
    .eq('id', user.id)
    .single()

  if (fetchErr || !dbUser) {
    return Response.json({ error: 'Akun tidak ditemukan' }, { status: 404 })
  }

  // Verifikasi password lama
  const isValid = await bcrypt.compare(oldPassword, dbUser.password)
  if (!isValid) {
    return Response.json({ error: 'Password saat ini salah' }, { status: 403 })
  }

  // Hash password baru
  const hashedNew = await bcrypt.hash(newPassword, 12)

  const { error: updateErr } = await supabase
    .from('User')
    .update({ password: hashedNew, updatedAt: new Date().toISOString() })
    .eq('id', user.id)

  if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 })

  await createAuditLog({
    userId: user.id,
    userName: user.nama,
    aksi: 'CHANGE_PASSWORD',
    tabel: 'User',
    recordId: user.id,
  })

  return Response.json({ ok: true, message: 'Password berhasil diubah' })
}
