import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function PUT(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { oldPassword, newPassword } = await req.json()
  if (!oldPassword || !newPassword) return Response.json({ error: 'Data tidak lengkap' }, { status: 400 })
  if (newPassword.length < 8) return Response.json({ error: 'Password baru minimal 8 karakter' }, { status: 400 })

  const { data: dbUser } = await supabase.from('User').select('password').eq('id', user.id).single()
  if (!dbUser) return Response.json({ error: 'User tidak ditemukan' }, { status: 404 })

  const valid = await bcrypt.compare(oldPassword, dbUser.password)
  if (!valid) return Response.json({ error: 'Password lama salah' }, { status: 401 })

  const hashed = await bcrypt.hash(newPassword, 12)
  await supabase.from('User').update({ password: hashed, updatedAt: new Date().toISOString() }).eq('id', user.id)
  return Response.json({ ok: true })
}
